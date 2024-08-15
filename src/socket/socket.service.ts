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
import { IMessage } from 'types/types';
// @Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class SocketService implements OnGatewayConnection {
  constructor(private messagesService: MessagesService) {}
  @WebSocketServer() server: Server;

  @SubscribeMessage('server-path')
  async handleEvent(
    @MessageBody() dto: IMessage,
    @ConnectedSocket() client: Socket,
  ) {
    if (dto.type === 'new-message') {
      const data = await this.messagesService.create(dto);
      this.server.emit(dto.type, data);
      console.log(data);
    } else if (dto.type === 'update-message') {
      const data = await this.messagesService.update(dto.id, dto);
      this.server.emit(dto.type, data);
      console.log(data);
    } else if (dto.type === 'delete-message') {
      this.server.emit(dto.type, dto);
      this.messagesService.remove(dto.id);
      console.log(dto);
    }
  }

  handleConnection(client: Socket) {
    console.log('new user connected', client.id);
  }
}
