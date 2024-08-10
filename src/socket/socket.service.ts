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
import { Socket, Server } from 'socket.io';
import { Message } from 'src/messages/entities/message.entity';
import { MessagesService } from 'src/messages/messages.service';
import { Repository } from 'typeorm';
import { IMessage } from 'types/types';
// @Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class SocketService implements OnGatewayConnection {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}
  @WebSocketServer() server: Server;

  @SubscribeMessage('server-path')
  handleEvent(@MessageBody() dto: IMessage, @ConnectedSocket() client: Socket) {
    console.log(dto);
    // const res = { type: 'someType', dto };
    this.server.emit('message', dto);
    this.create(dto);
  }

  async create(dto: IMessage) {
    const newMessage = {
      text: dto.text,
      user: {
        id: dto.user.id,
      },
    };
    return await this.messageRepository.save(newMessage);
  }

  handleConnection(client: Socket) {
    console.log('new user connected', client.id);
  }
}
