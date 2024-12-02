import { forwardRef, Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { debounce } from 'lodash';
import { Socket, Server } from 'socket.io';
import { MessagesService } from 'src/messages/messages.service';
import { PrismaService } from 'src/prisma.service';
import { RoomService } from 'src/room/room.service';
import { UserService } from 'src/user/user.service';
import {
  IMessage,
  INewDialog,
  INewRoom,
  IResRoom,
  IRoomData,
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

  async getUserId(client: Socket) {
    const user = await this.userService.findBySocketId(client.id);
    return user;
  }

  async setOfflineUser(client: Socket, userId: number = null) {
    if (userId) {
      setTimeout(async () => {
        const updUser = await this.userService.update(userId, {
          socketId: client.id,
          status: 'offline',
          lastSeen: new Date(),
        });
        this.server.to(updUser.email).emit('updateUser', updUser);
      }, 30000);
    } else {
      const user = await this.getUserId(client);
      if (user) {
        setTimeout(async () => {
          const updUser = await this.userService.update(user.id, {
            socketId: client.id,
            status: 'offline',
            lastSeen: new Date(),
          });
          this.server.to(updUser.email).emit('updateUser', updUser);
        }, 30000);
      }
    }
  }

  async setOnlineStatus(client: Socket, userId: number = null) {
    if (userId) {
      const updUser = await this.userService.update(userId, {
        socketId: client.id,
        status: 'online',
        lastSeen: new Date(),
      });
      this.server.to(updUser.email).emit('updateUser', updUser);
    } else {
      const user = await this.getUserId(client);
      if (user) {
        const updUser = await this.userService.update(user.id, {
          socketId: client.id,
          status: 'online',
          lastSeen: new Date(),
        });
        this.server.to(updUser.email).emit('updateUser', updUser);
      }
    }
  }

  async noTypeStatus(dto: TypingData) {
    this.server.to(`${dto.roomId}`).emit('typing', { ...dto, typing: false });
  }

  private updateTypeStatus = debounce((dto: TypingData) => {
    this.noTypeStatus(dto);
  }, 3000);

  async updateNewRoom(room: IRoomData) {
    const userList = await Promise.all(
      room.users.map(async (user) => {
        return await this.userService.findById(user.id);
      }),
    );
    userList.map((user) => {
      this.server.to(user.socketId).emit('joinedNewRoom', room);
      this.server.to(user.socketId).emit('updateUser', room.users);
      if (room.type === 'dialog') {
        this.server.to(user.socketId).emit('newDialog', room);
      }
    });
  }

  // SERVER

  @WebSocketServer() server: Server;

  @SubscribeMessage('new-message')
  async handleNewMessage(
    @MessageBody() dto: IMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const tempId = dto.id;
    const data = await this.messagesService.create(dto);
    if (data && data.roomId) {
      this.server.to(`${dto.roomId}`).emit('newMessage', { data, tempId });
    }

    this.setOnlineStatus(client);
    this.setOfflineUser(client);
    console.log(data);
  }

  @SubscribeMessage('update-message')
  async handleUpdateMessage(
    @MessageBody() dto: IMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const data = await this.messagesService.update(dto.id, dto);
    if (data) {
      this.server.to(`${dto.roomId}`).emit('updated-message', data);
      console.log(dto);
    }
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
  }

  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    @MessageBody() dto: IMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const data = await this.messagesService.remove(dto.id);
    if (data) {
      this.server.to(`${dto.roomId}`).emit('deleted-message', dto);
      this.setOnlineStatus(client);
      this.setOfflineUser(client);
      console.log(dto);
    }
  }

  // CONNECT

  async handleConnection(@ConnectedSocket() client: Socket) {
    const userId = +client.handshake.query.userId;

    if (userId) {
      this.setOnlineStatus(client, userId);
      this.setOfflineUser(client, userId);
    }
    console.log('new user connected', `{${userId}}`, client.id);
  }

  @SubscribeMessage('read-message')
  async handleReadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() { message, user },
  ) {
    const data = await this.messagesService.updateRead(message.id, user);
    if (data) {
      this.server.to(`${message.roomId}`).emit('readed-message', data);
      console.log(data);
    }
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
  }

  // ======= R O O M ==========

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: INewRoom,
  ) {
    const newRoom: IRoomData = await this.roomServise.create(dto, dto.owner);
    if (newRoom) {
      this.updateNewRoom(newRoom);
    }
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
  }

  @SubscribeMessage('clearHistory')
  async handleClearHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: number,
  ) {
    const data = await this.messagesService.removeMany(roomId);
    data && this.server.to(`${roomId}`).emit('clearedRoom', data);
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
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
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { room, user },
  ) {
    const isInRoom = client.rooms.has(room.id);

    if (!isInRoom) {
      client.join(`${room.id}`);
      client.emit('joinedRoom', room.id);
      console.log(`${user.email} has join to ${room.id}`, client.id);
    }
  }

  @SubscribeMessage('joinUser')
  async handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() { userRoom, user },
  ) {
    const isInRoom = client.rooms.has(userRoom.email);

    if (!isInRoom) {
      client.join(userRoom.email);
      client.emit('joinedUser', userRoom.email);
      console.log(`${user.email} has join to ${userRoom.email}`, client.id);
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { room, user },
  ) {
    client.leave(`${room.id}`);
    console.log(`${user.email} has leave ${room.id}`);
  }

  @SubscribeMessage('leaveUser')
  async handleLeaveUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() { userRoom, user },
  ) {
    client.leave(userRoom.email);
    console.log(`${user.email} has leave ${userRoom.email}`);
  }

  @SubscribeMessage('inviteToRoom')
  async handleInvateToRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { roomId, dto },
  ) {
    const data = await this.roomServise.update(roomId, dto);
    if (data) {
      const userList = data.users.map(async (user) => {
        return (await this.userService.findById(user.id)).socketId;
      });
      userList &&
        userList.map(async (socketId) => {
          this.server.to(await socketId).emit('invatedRoom', data);
        });
      console.log(data);
    }
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
  }

  @SubscribeMessage('excludeFromRoom')
  async handleExcludeFromRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { roomId, removeUser },
  ) {
    console.log(roomId, removeUser);

    const data = await this.roomServise.update(roomId, { removeUser });
    const excludedUser = await this.userService.findById(removeUser);
    if (data && excludedUser) {
      this.server.to(roomId).emit('updateRoom', data);
      this.server.to(excludedUser.socketId).emit('deletedRoom', data);
    }
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
  }

  @SubscribeMessage('promoteUser')
  async handlePromoteUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() { roomId, dto },
  ) {
    const data = await this.roomServise.update(roomId, dto);
    data && this.server.to(roomId).emit('updateRoom', data);
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
  }

  @SubscribeMessage('editRoom')
  async handleEditRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { roomId, dto },
  ) {
    const data = await this.roomServise.update(roomId, dto);
    data && this.server.to(`${data.id}`).emit('updateRoom', data);
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
  }

  // U S E R

  @SubscribeMessage('editUser')
  async handleEditUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() { userId, dto },
  ) {
    console.log(dto);

    const data = await this.userService.update(userId, dto);
    console.log(data);

    data && this.server.to(data.email).emit('updateUser', data);
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() dto: TypingData,
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`${dto.roomId}`).emit('typing', { ...dto, typing: true });
    this.updateTypeStatus(dto);
    this.setOnlineStatus(client);
    this.setOfflineUser(client);
  }
}

export class EventsGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
