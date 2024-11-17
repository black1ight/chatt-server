import { forwardRef, Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { PrismaService } from 'src/prisma.service';
import { MessagesService } from 'src/messages/messages.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { RoomService } from 'src/room/room.service';
import { RoomModule } from 'src/room/room.module';

@Module({
  imports: [RoomModule],
  providers: [
    SocketService,
    JwtService,
    PrismaService,
    MessagesService,
    UserService,
  ],
  exports: [SocketService],
})
export class SocketModule {}
