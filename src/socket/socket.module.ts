import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { PrismaService } from 'src/prisma.service';
import { MessagesService } from 'src/messages/messages.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  providers: [
    SocketService,
    JwtService,
    PrismaService,
    MessagesService,
    UserService,
  ],
})
export class SocketModule {}
