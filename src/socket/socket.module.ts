import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/messages/entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  providers: [SocketService],
})
export class SocketModule {}
