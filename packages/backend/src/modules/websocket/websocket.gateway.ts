import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

export type User = {
  name: string;
  avatar: string;
  id: string;
};

// import { User } from '@webrtc/types';
@WebSocketGateway({
  cors: {
    methods: ['GET', 'POST'],
    transports: ['websocket', 'polling'],
  },
  allowEIO3: true,
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server;
  users: Array<User & { client: Socket }> = [];

  async handleConnection(client: Socket) {
    const user = {
      id: client.id,
      name: client.handshake?.query?.name,
      avatar: client.handshake?.query?.avatar,
    } as User;

    this.users.push({ ...user, client });
    client.emit('user', user);
    this.server.emit(
      'users',
      this.users.map(({ client, ...user }) => user),
    );
  }

  async handleDisconnect(client: Socket) {
    client.disconnect();
    this.users = this.users.filter((i) => i.id !== client.id);
    this.server.emit(
      'users',
      this.users.map(({ client, ...user }) => user),
    );
  }

  @SubscribeMessage('user')
  async updateUser(client, data) {
    this.users = this.users.map((i) => {
      if (i.id !== client.id) {
        return i;
      } else {
        return {
          ...i,
          ...data,
        };
      }
    });
    client.emit('user', {
      id: client.id,
      name: data?.name,
      avatar: data?.avatar,
    });
    client.broadcast.emit(
      'users',
      this.users.map(({ client, ...user }) => user),
    );
  }

  @SubscribeMessage('offer')
  async onOffer(client, data) {
    const targetClient = this.users.find((i) => i.id === data?.user)?.client;
    if (targetClient) {
      targetClient.emit('receiveOffer', {
        source: client.id,
        data: {
          sdp: data.sdp,
        },
      });
    }
  }

  @SubscribeMessage('answer')
  async onAnswer(client, data) {
    const targetClient = this.users.find((i) => i.id === data?.user)?.client;
    if (targetClient) {
      targetClient.emit('receiveAnswer', {
        source: client.id,
        data: {
          sdp: data.sdp,
        },
      });
    }
  }
}
