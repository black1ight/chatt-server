import { Injectable, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Prisma } from '@prisma/client';
import { Socket, Server } from 'socket.io';
import { MessagesService } from 'src/messages/messages.service';
import { PrismaService } from 'src/prisma.service';
import { IMessage } from 'types/types';
// @Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class SocketService implements OnGatewayConnection {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
  ) {}
  @WebSocketServer() server: Server;

  @SubscribeMessage('server-path')
  handleEvent(@MessageBody() dto: IMessage, @ConnectedSocket() client: Socket) {
    // const res = { type: 'someType', dto };
    if (dto.type === 'new-message') {
      this.server.emit(dto.type, dto);
      this.create(dto);
      console.log(dto);
    } else if (dto.type === 'update-message') {
      this.server.emit(dto.type, dto);
      this.messagesService.update(dto.id, dto);
      console.log(dto);
    } else if (dto.type === 'delete-message') {
      this.server.emit(dto.type, dto);
      this.messagesService.remove(dto.id);
      console.log(dto);
    }
  }

  async create(dto: IMessage) {
    const newMessage = await this.prisma.message.create({
      data: {
        text: dto.text,
        userId: dto.user.id,
      },
    });
    return { newMessage };
  }

  handleConnection(client: Socket) {
    console.log('new user connected', client.id);
  }
}
