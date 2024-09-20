import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { MessagesService } from 'src/messages/messages.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { IMessage, IUser, TypingData } from 'types/types';
@WebSocketGateway({ cors: { origin: '*' } })
export class SocketService implements OnGatewayConnection {
  constructor(
    private messagesService: MessagesService,
    private userService: UserService,
    private prisma: PrismaService,
  ) {}

  setOfflineUser(id: number, client: Socket) {
    setTimeout(async () => {
      await this.userService.update(id, {
        socketId: client.id,
        status: 'offline',
        lastSeen: new Date(),
      });
    }, 60000);
  }

  async setOnlineStatus(id: number, client: Socket) {
    await this.userService.update(id, {
      socketId: client.id,
      status: 'online',
      lastSeen: new Date(),
    });
  }

  @WebSocketServer() server: Server;

  @SubscribeMessage('server-path')
  async handleEvent(
    @MessageBody() dto: IMessage,
    @ConnectedSocket() client: Socket,
  ) {
    if (dto.type === 'new-message') {
      const data = await this.messagesService.create(dto);
      this.server.to(dto.roomId).emit(dto.type, data);
      this.setOnlineStatus(dto.userId, client);
      this.setOfflineUser(dto.userId, client);

      console.log(data);
    } else if (dto.type === 'update-message') {
      const data = await this.messagesService.update(dto.id, dto);
      this.server.to(dto.roomId).emit(dto.type, data);
      this.setOnlineStatus(dto.userId, client);
      this.setOfflineUser(dto.userId, client);
      console.log(dto);

      console.log(data);
    } else if (dto.type === 'delete-message') {
      await this.messagesService.remove(dto.id);
      this.server.to(dto.roomId).emit(dto.type, dto);
      this.setOnlineStatus(dto.userId, client);
      this.setOfflineUser(dto.userId, client);

      console.log(dto);
    } else if (dto.type === 'read-message') {
      const user = await this.prisma.user.findFirst({
        where: { socketId: client.id },
      });
      if (user) {
        const data = await this.messagesService.updateRead(dto.id, dto, user);
        if (data) {
          this.server.to(dto.roomId).emit(dto.type, data);
          console.log(data);
        }
      }
      this.setOnlineStatus(dto.userId, client);
      this.setOfflineUser(dto.userId, client);

      console.log(dto);
    }
    // else if (dto.type === 'invate-users') {
    //   const users = (await this.server.in(dto.roomId).fetchSockets()).map(
    //     (item) => item.id,
    //   );
    //   this.setOnlineStatus(dto.userId, client);
    //   this.setOfflineUser(dto.userId, client);

    //   console.log(users);
    // }
  }

  async handleConnection(client: Socket) {
    const user = await this.prisma.user.findFirst({
      where: { socketId: client.id },
    });
    if (user) {
      this.setOnlineStatus(user.id, client);
      this.setOfflineUser(user.id, client);
    }

    console.log('new user connected', client.id);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, { room, user }) {
    client.join(room.id);
    client.emit('joinedRoom', room.id);
    this.setOnlineStatus(user.id, client);
    this.setOfflineUser(user.id, client);
    console.log(`${user.email} has join to ${room.id}`);
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() dto: TypingData,
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(dto.roomId).emit('typing', { ...dto, typing: true });
    console.log(dto);
    this.setOnlineStatus(dto.userId, client);
    this.setOfflineUser(dto.userId, client);
    setTimeout(() => {
      this.server.to(dto.roomId).emit('typing', { ...dto, typing: false });
    }, 5000);
    // const stopTyping = () => {
    //   this.server.to(dto.roomId).emit('typing', { ...dto, typing: false });
    //   console.log('ebat');
    // };
    // debounce(stopTyping, 5000)();
  }
}
