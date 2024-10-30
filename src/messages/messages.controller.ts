import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
  Query,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IMessage } from 'types/types';
import { GetMessagesDto } from './dto/get-messages.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  create(@Body() dto: IMessage) {
    return this.messagesService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  findAll(@Query() query: GetMessagesDto, @Request() req) {
    return this.messagesService.findMany(query, req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  update(@Param('id') id: string, @Body() dto: IMessage) {
    return this.messagesService.update(+id, dto);
  }

  @Patch('read/:id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  updateRead(@Param('id') id: string, @Body() dto: IMessage, @Request() req) {
    return this.messagesService.updateRead(+id, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  remove(@Param('id') id: string) {
    return this.messagesService.remove(+id);
  }

  @Delete('byRoom/:id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  removeMany(@Param('id') id: string) {
    return this.messagesService.removeMany(id);
  }
}
