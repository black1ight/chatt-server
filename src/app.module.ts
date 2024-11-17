import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { SocketModule } from './socket/socket.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [UserModule, AuthModule, MessagesModule, SocketModule, RoomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
