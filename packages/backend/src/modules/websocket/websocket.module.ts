import { SocketGateway } from './websocket.gateway';
import { Module } from '@nestjs/common';

@Module({
  providers: [SocketGateway],
})
export class SocketModule {}
