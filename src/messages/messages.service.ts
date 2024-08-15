import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/prisma.service';
import { IMessage, IUser } from 'types/types';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}
  async create(dto: IMessage) {
    const newMessage = await this.prisma.message.create({
      data: {
        text: dto.text,
        userId: dto.userId,
      },
    });
    const { id } = newMessage;
    return await this.getById(id);
  }

  async findAll() {
    return await this.prisma.message.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getById(id: number) {
    return await this.prisma.message.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            user_name: true,
            email: true,
          },
        },
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  async update(id: number, dto: IMessage) {
    return await this.prisma.message.update({
      where: {
        id,
      },
      data: { text: dto.text },
    });
  }

  async remove(id: number) {
    return await this.prisma.message.delete({
      where: {
        id,
      },
    });
  }
}
