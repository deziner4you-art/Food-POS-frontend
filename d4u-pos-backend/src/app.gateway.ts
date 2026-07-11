import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
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

  handleConnection(client: Socket) {
    console.log(`[SOCKET] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[SOCKET] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_store')
  handleJoinStore(@MessageBody() data: { store_id: number }, @ConnectedSocket() client: Socket) {
    const roomName = `store_${data.store_id}`;
    client.join(roomName);
    console.log(`[SOCKET] Client ${client.id} joined room: ${roomName}`);
    return { event: 'joined', data: roomName };
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
