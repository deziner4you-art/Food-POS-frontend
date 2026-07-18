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

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeWaiterPins: Record<string, number> = {};
  // Track active waiters: client.id -> { store_id, name }
  private activeWaiters: Record<string, { store_id: number; name: string }> =
    {};

  handleConnection(client: Socket) {
    console.log(`[SOCKET] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[SOCKET] Client disconnected: ${client.id}`);
    const waiter = this.activeWaiters[client.id];
    if (waiter) {
      delete this.activeWaiters[client.id];
      this.broadcastActiveWaiters(waiter.store_id);
    }
  }

  private broadcastActiveWaiters(store_id: number) {
    const waitersList = Object.values(this.activeWaiters).filter(
      (w) => w.store_id === store_id,
    );
    this.server
      .to(`store_${store_id}`)
      .emit('update_active_waiters', waitersList);
  }

  @SubscribeMessage('join_store')
  handleJoinStore(
    @MessageBody() data: { store_id: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `store_${data.store_id}`;
    client.join(roomName);
    console.log(`[SOCKET] Client ${client.id} joined room: ${roomName}`);
    return { event: 'joined', data: roomName };
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

  @SubscribeMessage('auth_waiter_pin')
  handleAuthWaiterPin(
    @MessageBody() data: { pin: string },
    @ConnectedSocket() client: Socket,
  ) {
    const storeId = this.activeWaiterPins[data.pin];
    if (storeId) {
      const roomName = `store_${storeId}`;
      client.join(roomName);
      console.log(
        `[SOCKET] Waiter authenticated with PIN ${data.pin} for store ${storeId}`,
      );

      // Calculate a waiter name based on existing active waiters for this store
      const existingCount = Object.values(this.activeWaiters).filter(
        (w) => w.store_id === storeId,
      ).length;
      const waiterName = `Waiter ${existingCount + 1}`;

      this.activeWaiters[client.id] = { store_id: storeId, name: waiterName };
      this.broadcastActiveWaiters(storeId);

      return { success: true, store_id: storeId, name: waiterName };
    }
    return { success: false, message: 'Invalid PIN' };
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
