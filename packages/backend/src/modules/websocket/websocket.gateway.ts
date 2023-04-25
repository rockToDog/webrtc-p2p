import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import * as ipaddr from 'ipaddr.js';

@WebSocketGateway({
  cors: {
    methods: ['GET', 'POST'],
    transports: ['websocket', 'polling'],
  },
  allowEIO3: true,
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  getIp(client: Socket) {
    let ip = client.handshake.address;
    if (ipaddr.parse(ip).range() === 'ipv4Mapped') {
      ip = ipaddr.IPv6.parse(ip).toIPv4Address().octets.join('.');
    }
    if (ipaddr.parse(ip).range() === 'private') {
      return 'private';
    }
    return ip;
  }

  async handleConnection(client: Socket) {
    const ip = this.getIp(client);
    client.join(ip);
    client.data.name = client.handshake?.query?.name;
    client.data.avatar = client.handshake?.query?.avatar;
    client.emit('user', {
      id: client.id,
      ...client.data,
    });
    const sockets = await this.server.to(ip).fetchSockets();
    this.server.to(ip).emit(
      'users',
      sockets.map((client) => ({
        id: client.id,
        ...client.data,
      })),
    );
  }

  async handleDisconnect(client: Socket) {
    const ip = this.getIp(client);
    client.disconnect();
    const sockets = await this.server.to(ip).fetchSockets();
    this.server.to(ip).emit(
      'users',
      sockets.map((client) => ({
        id: client.id,
        ...client.data,
      })),
    );
  }

  @SubscribeMessage('user')
  async updateUser(client, data) {
    client.data = {
      ...data,
    };
    client.emit('user', {
      id: client.id,
      name: data?.name,
      avatar: data?.avatar,
    });
    const ip = this.getIp(client);
    const sockets = await this.server.to(ip).fetchSockets();
    this.server.to(ip).emit(
      'users',
      sockets.map((client) => ({
        id: client.id,
        ...client.data,
      })),
    );
  }

  @SubscribeMessage('offer')
  async onOffer(client, data) {
    const sockets = await this.server.to(data.user).fetchSockets();
    if (sockets.length) {
      sockets[0].emit('receiveOffer', {
        source: client.id,
        data: {
          sdp: data.sdp,
        },
      });
    }
  }

  @SubscribeMessage('answer')
  async onAnswer(client, data) {
    const sockets = await this.server.to(data.user).fetchSockets();
    if (sockets.length) {
      sockets[0].emit('receiveAnswer', {
        source: client.id,
        data: {
          sdp: data.sdp,
        },
      });
    }
  }
}
