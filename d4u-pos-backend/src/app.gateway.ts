import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TerminalService } from './modules/core/terminal/terminal.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private terminalService: TerminalService) {}

  private activeWaiterPins: Record<string, number> = {};
  // Track active waiters: client.id -> { store_id, name }
  private activeWaiters: Record<string, { store_id: number; name: string }> =
    {};
  // Live socket lookup for waiter terminal sessions (persistent source of truth is TerminalSession in the DB).
  private sessionSocketMap = new Map<number, string>();

  // Rider presence tracking (Fix 4 & 5): in-memory rider state per store
  private activeRiders = new Map<number, { socketId: string; storeId: number; isOnline: boolean; lastSeen: number }>();
  private riderSocketMap = new Map<string, number>();
  // Latest rider locations: riderId -> { riderId, storeId, lat, lng, accuracy, timestamp }
  private riderLocations = new Map<number, {
    riderId: number;
    storeId: number;
    lat: number;
    lng: number;
    accuracy: number | null;
    timestamp: number;
  }>();

  handleConnection(client: Socket) {
    console.log(`[SOCKET] Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`[SOCKET] Client disconnected: ${client.id}`);
    const waiter = this.activeWaiters[client.id];
    if (waiter) {
      delete this.activeWaiters[client.id];
      this.broadcastActiveWaiters(waiter.store_id);
    }

    // Losing the socket connection marks the waiter terminal offline, NOT
    // logged out — the session stays alive in the DB so a refresh/reconnect
    // resumes it automatically (see resume_waiter_session below).
    for (const [sessionId, socketId] of this.sessionSocketMap.entries()) {
      if (socketId === client.id) {
        this.sessionSocketMap.delete(sessionId);
        await this.terminalService.setSocketId(sessionId, null);
        const session = await this.terminalService.getStoreIdForSession(sessionId);
        if (session) this.broadcast('waiter_sessions_updated', { store_id: session }, `store_${session}`);
        break;
      }
    }

    // Clean up rider presence and location on disconnect
    const riderId = this.riderSocketMap.get(client.id);
    if (riderId) {
      const riderInfo = this.activeRiders.get(riderId);
      this.riderSocketMap.delete(client.id);
      this.activeRiders.delete(riderId);
      this.riderLocations.delete(riderId);
      if (riderInfo) {
        this.broadcastRiderPresence(riderInfo.storeId);
        this.broadcast('rider_location_removed', { riderId, storeId: riderInfo.storeId }, `store_${riderInfo.storeId}`);
      }
    }
  }

  @SubscribeMessage('rider_presence')
  handleRiderPresence(
    @MessageBody() data: { riderId: number; storeId: number; isOnline: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !data.riderId || !data.storeId) return { success: false };
    const riderId = Number(data.riderId);
    const storeId = Number(data.storeId);
    const isOnline = !!data.isOnline;

    this.activeRiders.set(riderId, {
      socketId: client.id,
      storeId,
      isOnline,
      lastSeen: Date.now(),
    });
    this.riderSocketMap.set(client.id, riderId);

    if (!isOnline) {
      this.riderLocations.delete(riderId);
      this.broadcast('rider_location_removed', { riderId, storeId }, `store_${storeId}`);
    }

    client.join(`store_${storeId}`);
    this.broadcastRiderPresence(storeId);
    console.log(`[SOCKET] Rider #${riderId} presence updated (store: ${storeId}, online: ${isOnline})`);
    return { success: true };
  }

  @SubscribeMessage('rider_location')
  handleRiderLocation(
    @MessageBody() data: { lat: number; lng: number; accuracy?: number; timestamp?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const riderId = this.riderSocketMap.get(client.id);
    if (!riderId) {
      console.warn(`[SOCKET] rider_location rejected: unauthenticated/unregistered rider socket ${client.id}`);
      return { success: false, error: 'Unregistered rider socket' };
    }
    const riderInfo = this.activeRiders.get(riderId);
    if (!riderInfo || !riderInfo.isOnline) {
      return { success: false, error: 'Rider is not online' };
    }

    const lat = Number(data?.lat);
    const lng = Number(data?.lng);
    if (isNaN(lat) || isNaN(lng) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { success: false, error: 'Invalid coordinates' };
    }

    const storeId = riderInfo.storeId;
    const locationUpdate = {
      riderId,
      storeId,
      lat,
      lng,
      accuracy: typeof data.accuracy === 'number' && Number.isFinite(data.accuracy) ? data.accuracy : null,
      timestamp: data.timestamp && Number.isFinite(data.timestamp) ? data.timestamp : Date.now(),
    };

    this.riderLocations.set(riderId, locationUpdate);

    // Broadcast only to the rider's authorized store room
    this.broadcast('rider_location', locationUpdate, `store_${storeId}`);
    return { success: true, location: locationUpdate };
  }

  @SubscribeMessage('get_store_rider_locations')
  handleGetStoreRiderLocations(@MessageBody() data: { storeId: number }) {
    if (!data || !data.storeId) return [];
    return this.getStoreRiderLocations(Number(data.storeId));
  }

  getStoreRiderLocations(storeId: number) {
    const list = [];
    for (const loc of this.riderLocations.values()) {
      if (loc.storeId === storeId) {
        const info = this.activeRiders.get(loc.riderId);
        if (info && info.isOnline) {
          list.push(loc);
        }
      }
    }
    return list;
  }

  getRiderLocation(riderId: number) {
    return this.riderLocations.get(riderId) || null;
  }

  @SubscribeMessage('get_active_riders')
  handleGetActiveRiders(@MessageBody() data: { storeId: number }) {
    if (!data || !data.storeId) return [];
    return this.getActiveRidersList(Number(data.storeId));
  }

  getActiveRidersList(storeId: number) {
    const list: { riderId: number; isOnline: boolean; lastSeen: number }[] = [];
    for (const [riderId, info] of this.activeRiders.entries()) {
      if (info.storeId === storeId && info.isOnline) {
        list.push({ riderId, isOnline: info.isOnline, lastSeen: info.lastSeen });
      }
    }
    return list;
  }

  isRiderOnline(riderId: number): boolean {
    const rider = this.activeRiders.get(riderId);
    return !!rider && rider.isOnline;
  }

  hasOnlineRiders(storeId: number): boolean {
    for (const info of this.activeRiders.values()) {
      if (info.storeId === storeId && info.isOnline) return true;
    }
    return false;
  }

  broadcastRiderPresence(storeId: number) {
    const activeList = this.getActiveRidersList(storeId);
    this.broadcast('rider_presence_updated', { storeId, riders: activeList, count: activeList.length }, `store_${storeId}`);
  }

  private broadcastActiveWaiters(store_id: number) {
    const waitersList = Object.values(this.activeWaiters).filter(
      (w) => w.store_id === store_id,
    );
    this.server
      .to(`store_${store_id}`)
      .emit('update_active_waiters', waitersList);
  }

  /**
   * Sprint 28.9: every frontend but d4u-rider calls this with an object
   * ({store_id: X}); d4u-rider calls it with a bare string (`store_${id}`).
   * The old handler assumed the object shape, so d4u-rider always joined
   * room "store_undefined" — silently never receiving any store-scoped
   * broadcast (order_updated, gps_update, etc.), which was the entire
   * reason POS/online orders never reached the Rider App in realtime.
   * Accept either shape rather than requiring every caller to agree.
   */
  @SubscribeMessage('join_store')
  handleJoinStore(
    @MessageBody() data: { store_id?: number } | string | number,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = this.resolveStoreRoom(data);
    if (!roomName) {
      console.warn(`[SOCKET] join_store received an unresolvable payload from ${client.id}:`, data);
      return { event: 'joined', data: null };
    }
    client.join(roomName);
    console.log(`[SOCKET] Client ${client.id} joined room: ${roomName}`);
    return { event: 'joined', data: roomName };
  }

  private resolveStoreRoom(data: { store_id?: number } | string | number): string | null {
    if (typeof data === 'number' && !isNaN(data)) return `store_${data}`;
    if (typeof data === 'string') {
      if (/^store_\d+$/.test(data)) return data; // already a valid room name
      if (/^\d+$/.test(data)) return `store_${data}`;
      return null; // e.g. "store_undefined" — reject rather than join a garbage room
    }
    if (data && typeof data === 'object' && data.store_id != null && !isNaN(Number(data.store_id))) {
      return `store_${data.store_id}`;
    }
    return null;
  }

  @SubscribeMessage('NEW_TERMINAL_ORDER')
  handleNewTerminalOrder(@MessageBody() data: any) {
    const roomName = `store_${data.store_id}`;
    this.server.to(roomName).emit('TERMINAL_ORDER_RECEIVED', data);
    return { success: true };
  }

  @SubscribeMessage('generate_waiter_pin')
  handleGeneratePin(@MessageBody() data: { store_id: number; pin: string }) {
    this.activeWaiterPins[data.pin] = data.store_id;
    console.log(
      `[SOCKET] Waiter PIN ${data.pin} registered for store ${data.store_id}`,
    );
    return { success: true };
  }

  /**
   * DB-backed pairing — validates against TerminalSession (persists across
   * server restarts, unlike the legacy activeWaiterPins map above, which is
   * left in place only for any not-yet-updated caller of generate_waiter_pin).
   */
  @SubscribeMessage('auth_waiter_pin')
  async handleAuthWaiterPin(
    @MessageBody() data: { pin: string; device_id?: string; device_name?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.terminalService.loginByPin(data.pin, data.device_id, data.device_name);
    if (!result.success || !result.session_id || !result.store_id) return result;

    await this.registerWaiterSocket(client, result.session_id, result.store_id);
    return result;
  }

  /** Reload/reconnect: resumes an existing session without re-entering a PIN. */
  @SubscribeMessage('resume_waiter_session')
  async handleResumeWaiterSession(
    @MessageBody() data: { session_id: number; device_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.terminalService.resumeSession(data.session_id, data.device_id);
    if (!result.success || !result.store_id) return result;

    await this.registerWaiterSocket(client, data.session_id, result.store_id);
    return result;
  }

  /** Periodic keep-alive from a connected waiter tablet — updates last_activity_at. */
  @SubscribeMessage('waiter_heartbeat')
  async handleWaiterHeartbeat(@MessageBody() data: { session_id: number }) {
    await this.terminalService.touchActivity(data.session_id);
    return { success: true };
  }

  private async registerWaiterSocket(client: Socket, session_id: number, store_id: number) {
    const roomName = `store_${store_id}`;
    client.join(roomName);
    client.join(`waiter_session_${session_id}`);
    this.sessionSocketMap.set(session_id, client.id);
    await this.terminalService.setSocketId(session_id, client.id);
    this.broadcast('waiter_sessions_updated', { store_id }, roomName);
    console.log(`[SOCKET] Waiter session #${session_id} connected for store ${store_id}`);
  }

  /** Cashier-initiated disconnect (called from TerminalController) — kicks the live socket if one is connected. */
  forceLogoutSession(session_id: number) {
    const socketId = this.sessionSocketMap.get(session_id);
    if (socketId) {
      this.server.to(socketId).emit('force_logout');
      this.sessionSocketMap.delete(session_id);
    }
  }

  @SubscribeMessage('waiter_connected')
  handleWaiterConnected(@MessageBody() data: { store_id: number }) {
    const roomName = `store_${data.store_id}`;
    this.server.to(roomName).emit('waiter_connected', data);
    return { success: true };
  }

  @SubscribeMessage('waiter_disconnected')
  handleWaiterDisconnected(@MessageBody() data: { store_id: number }) {
    const roomName = `store_${data.store_id}`;
    this.server.to(roomName).emit('waiter_disconnected', data);
    return { success: true };
  }

  @SubscribeMessage('kick_waiter')
  handleKickWaiter(@MessageBody() data: { name: string; store_id: number }) {
    // Find client ID by name and store_id
    const clientId = Object.keys(this.activeWaiters).find(
      (id) =>
        this.activeWaiters[id].name === data.name &&
        this.activeWaiters[id].store_id === data.store_id,
    );
    if (clientId) {
      this.server.to(clientId).emit('force_logout');
      delete this.activeWaiters[clientId];
      this.broadcastActiveWaiters(data.store_id);
    }
  }

  broadcast(event: string, payload: any, room?: string) {
    if (this.server) {
      if (room) {
        this.server.to(room).emit(event, payload);
      } else {
        this.server.emit(event, payload);
      }
    }
  }
}
