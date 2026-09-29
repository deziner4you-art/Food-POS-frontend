import { AppGateway } from './app.gateway';

describe('AppGateway — KDS/KOT entitlement rooms', () => {
  function makeGateway(capabilities: { kds: boolean; kotPrint: boolean; tvBoard?: boolean }) {
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 11,
        active_brand_id: 4,
        active_store_id: 7,
      }),
    };
    const entitlements = {
      resolveForAuthenticatedUser: jest.fn().mockResolvedValue({
        capabilities,
      }),
      resolveForStore: jest.fn().mockResolvedValue({
        capabilities,
      }),
      isCapabilityEnabled: jest.fn((_snapshot: any, moduleKey: string) =>
        moduleKey === 'KDS'
          ? capabilities.kds
          : moduleKey === 'TV_BOARD'
            ? capabilities.tvBoard === true
            : capabilities.kotPrint,
      ),
    };
    const gateway = new AppGateway({} as any, jwt as any, entitlements as any);
    const emitted: Array<{ room: string; event: string; payload: any }> = [];
    (gateway as any).server = {
      to: jest.fn((room: string) => ({
        emit: jest.fn((event: string, payload: any) => emitted.push({ room, event, payload })),
      })),
    };
    return { gateway, jwt, entitlements, emitted };
  }

  function client() {
    return {
      id: 'socket-1',
      handshake: { auth: {}, headers: {} },
      data: {},
      join: jest.fn(),
    } as any;
  }

  it('allows an entitled KDS socket to join only the dedicated KDS room', async () => {
    const { gateway, entitlements } = makeGateway({ kds: true, kotPrint: true });
    const socket = client();

    await expect(gateway.handleJoinKdsStore({ store_id: 7, token: 'valid-token' }, socket))
      .resolves.toMatchObject({ success: true, room: 'kds_store_7' });
    expect(entitlements.resolveForAuthenticatedUser).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 11 }),
      7,
    );
    expect(socket.join).toHaveBeenCalledWith('kds_store_7');
  });

  it('rejects a POS-only socket from the dedicated KDS room', async () => {
    const { gateway } = makeGateway({ kds: false, kotPrint: true });
    const socket = client();

    await expect(gateway.handleJoinKdsStore({ store_id: 7, token: 'valid-token' }, socket))
      .resolves.toMatchObject({ success: false, error: 'MODULE_NOT_INCLUDED', module: 'KDS' });
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('allows a POS-only tenant to join the KOT lifecycle room', async () => {
    const { gateway } = makeGateway({ kds: false, kotPrint: true });
    const socket = client();

    await expect(gateway.handleJoinKotStore({ store_id: 7, token: 'valid-token' }, socket))
      .resolves.toMatchObject({ success: true, room: 'kot_store_7' });
    expect(socket.join).toHaveBeenCalledWith('kot_store_7');
  });

  it('allows an entitled TV Board client to join only the dedicated TV Board room', async () => {
    const { gateway, entitlements } = makeGateway({ kds: false, kotPrint: true, tvBoard: true });
    const socket = client();

    await expect(gateway.handleJoinTvBoardStore({ store_id: 7, token: 'valid-token' }, socket))
      .resolves.toMatchObject({ success: true, room: 'tv_board_store_7', module: 'TV_BOARD' });
    expect(entitlements.resolveForAuthenticatedUser).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 11 }),
      7,
    );
    expect(socket.join).toHaveBeenCalledWith('tv_board_store_7');
  });

  it('rejects a tenant without TV Board from the dedicated TV Board room', async () => {
    const { gateway } = makeGateway({ kds: false, kotPrint: true, tvBoard: false });
    const socket = client();

    await expect(gateway.handleJoinTvBoardStore({ store_id: 7, token: 'valid-token' }, socket))
      .resolves.toMatchObject({ success: false, error: 'MODULE_NOT_INCLUDED', module: 'TV_BOARD' });
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('rejects an entitled-room request without a valid socket token', async () => {
    const { gateway } = makeGateway({ kds: true, kotPrint: true });
    const socket = client();

    await expect(gateway.handleJoinKdsStore({ store_id: 7 }, socket))
      .resolves.toMatchObject({ success: false, error: 'Socket authentication is required' });
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('allows an authenticated Marketing client to join only the Marketing room', async () => {
    const { gateway, entitlements } = makeGateway({ kds: false, kotPrint: true });
    const socket = client();
    entitlements.isCapabilityEnabled.mockImplementation((_snapshot: any, moduleKey: string) => moduleKey === 'MARKETING');

    await expect(gateway.handleJoinMarketingStore({ store_id: 7, token: 'valid-token' }, socket))
      .resolves.toMatchObject({ success: true, room: 'marketing_store_7' });
    expect(entitlements.resolveForAuthenticatedUser).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 11 }),
      7,
    );
    expect(socket.join).toHaveBeenCalledWith('marketing_store_7');
  });

  it('allows a public website client only when the store has Marketing enabled', async () => {
    const { gateway, entitlements } = makeGateway({ kds: false, kotPrint: false });
    const socket = client();
    entitlements.isCapabilityEnabled.mockImplementation((_snapshot: any, moduleKey: string) => moduleKey === 'MARKETING');

    await expect(gateway.handleJoinMarketingStore({ store_id: 7, public: true }, socket))
      .resolves.toMatchObject({ success: true, room: 'marketing_store_7', public: true });
    expect(entitlements.resolveForStore).toHaveBeenCalledWith(7);
    expect(socket.join).toHaveBeenCalledWith('marketing_store_7');
  });

  it('rejects a public website client when Marketing is not included', async () => {
    const { gateway, entitlements } = makeGateway({ kds: false, kotPrint: false });
    const socket = client();
    entitlements.isCapabilityEnabled.mockReturnValue(false);

    await expect(gateway.handleJoinMarketingStore({ store_id: 7, public: true }, socket))
      .resolves.toMatchObject({ success: false, error: 'MODULE_NOT_INCLUDED', module: 'MARKETING' });
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('routes KDS lifecycle events only to authorized capability rooms', () => {
    const { gateway, emitted } = makeGateway({ kds: true, kotPrint: true });

    gateway.broadcast('kds_update', { store_id: 7, status: 'READY' }, 'store_7');

    expect(emitted).toEqual([
      { room: 'kot_store_7', event: 'kds_update', payload: { store_id: 7, status: 'READY' } },
      { room: 'kds_store_7', event: 'kds_update', payload: { store_id: 7, status: 'READY' } },
      { room: 'tv_board_store_7', event: 'kds_update', payload: { store_id: 7, status: 'READY' } },
    ]);
    expect(emitted.some((entry) => entry.room === 'store_7')).toBe(false);
  });

  it('routes Marketing updates only to the entitlement-checked Marketing room', () => {
    const { gateway, emitted } = makeGateway({ kds: false, kotPrint: false });

    gateway.broadcast('marketing_update', { campaignId: 12, status: 'RUNNING' }, 'store_7');

    expect(emitted).toEqual([
      { room: 'marketing_store_7', event: 'marketing_update', payload: { campaignId: 12, status: 'RUNNING' } },
    ]);
    expect(emitted.some((entry) => entry.room === 'store_7')).toBe(false);
  });

  it('drops Marketing updates without a valid store identity', () => {
    const { gateway, emitted } = makeGateway({ kds: false, kotPrint: false });

    gateway.broadcast('marketing_update', { campaignId: 12, status: 'RUNNING' });

    expect(emitted).toEqual([]);
  });

  it('preserves general store-room routing for non-KDS events', () => {
    const { gateway, emitted } = makeGateway({ kds: false, kotPrint: false });

    gateway.broadcast('order_updated', { store_id: 7, id: 42 }, 'store_7');

    expect(emitted).toEqual([
      { room: 'store_7', event: 'order_updated', payload: { store_id: 7, id: 42 } },
    ]);
  });

  it('drops a KDS event without a valid store identity', () => {
    const { gateway, emitted } = makeGateway({ kds: true, kotPrint: true });

    gateway.broadcast('kds_update', { status: 'READY' });

    expect(emitted).toEqual([]);
  });
});
