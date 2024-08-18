import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { PrismaService } from 'src/prisma.service';
import { MessagesService } from 'src/messages/messages.service';

@Module({
  imports: [],
  providers: [SocketService, PrismaService, MessagesService],
})
export class SocketModule {}
