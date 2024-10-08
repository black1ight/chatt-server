import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { MessagesService } from 'src/messages/messages.service';
import { PrismaService } from 'src/prisma.service';
import { RoomService } from 'src/room/room.service';
import { UserService } from 'src/user/user.service';
import {
  IMessage,
  INewRoom,
  IResRoom,
  IRoomData,
  IUser,
  TypingData,
} from 'types/types';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketService implements OnGatewayConnection {
  constructor(
    private messagesService: MessagesService,
    private roomServise: RoomService,
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

  @SubscribeMessage('new-message')
  async handleNewMessage(
    @MessageBody() dto: IMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const data = await this.messagesService.create(dto);
    if (data) {
      this.server.to(dto.roomId).emit('new-message', data);
    }
    this.setOnlineStatus(dto.userId, client);
    this.setOfflineUser(dto.userId, client);
    console.log(data);
  }

  @SubscribeMessage('update-message')
  async handleUpdateMessage(
    @MessageBody() dto: IMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const data = await this.messagesService.update(dto.id, dto);
    if (data) {
      this.server.to(dto.roomId).emit('updated-message', data);
      this.setOnlineStatus(dto.userId, client);
      this.setOfflineUser(dto.userId, client);
      console.log(dto);
    }
  }

  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    @MessageBody() dto: IMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const data = await this.messagesService.remove(dto.id);
    if (data) {
      this.server.to(dto.roomId).emit('deleted-message', dto);
      this.setOnlineStatus(dto.userId, client);
      this.setOfflineUser(dto.userId, client);
      console.log(dto);
    }
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const userId = +client.handshake.query.userId;
    if (userId) {
      this.setOnlineStatus(userId, client);
      this.setOfflineUser(userId, client);
    }
    console.log('new user connected', `{${userId}}`, client.id);
  }

  @SubscribeMessage('read-message')
  async handleReadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() { message, user },
  ) {
    const data = await this.messagesService.updateRead(
      message.id,
      message,
      user,
    );
    if (data) {
      this.server.to(message.roomId).emit('readed-message', data);
      console.log(data);
    }
    this.setOnlineStatus(user.id, client);
    this.setOfflineUser(user.id, client);
  }

  // ======= R O O M ==========

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: INewRoom,
  ) {
    const newRoom: IRoomData = await this.roomServise.create(dto, dto.owner);
    if (newRoom) {
      const userList = newRoom.users.map(async (user) => {
        return (await this.userService.findById(user.id)).socketId;
      });
      userList.map(async (socketId) => {
        this.server.to(await socketId).emit('joinedNewRoom', newRoom);
      });
      console.log(newRoom);
    }
  }

  @SubscribeMessage('clearHistory')
  async handleClearHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    const data = await this.messagesService.removeMany(roomId);
    data && this.server.to(roomId).emit('clearedRoom', data);
    console.log(data);
  }

  @SubscribeMessage('deleteRoom')
  async handleDeleteRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: IResRoom,
  ) {
    const userList = room.users.map(async (user) => {
      return (await this.userService.findById(user.id)).socketId;
    });
    const deletedRoom = await this.roomServise.remove(room.id);
    if (deletedRoom) {
      userList.map(async (socketId) => {
        this.server.to(await socketId).emit('deletedRoom', deletedRoom);
      });
      console.log(deletedRoom);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { room, user },
  ) {
    const isInRoom = client.rooms.has(room.id);

    if (!isInRoom) {
      client.join(room.id);
      client.emit('joinedRoom', room.id);
      this.setOnlineStatus(user.id, client);
      this.setOfflineUser(user.id, client);
      console.log(`${user.email} has join to ${room.id}`, client.id);
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { room, user },
  ) {
    client.leave(room.id);
    this.setOnlineStatus(user.id, client);
    this.setOfflineUser(user.id, client);
    console.log(`${user.email} has leave ${room.id}`);
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() dto: TypingData,
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(dto.roomId).emit('typing', { ...dto, typing: true });
    this.setOnlineStatus(dto.userId, client);
    this.setOfflineUser(dto.userId, client);
    setTimeout(() => {
      this.server.to(dto.roomId).emit('typing', { ...dto, typing: false });
    }, 5000);
  }
}

export class EventsGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
