import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}
  create(createMessageDto: CreateMessageDto, req) {
    return 'This action adds a new message';
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
    });
  }

  async getById(id: number) {
    return await this.prisma.message.findUnique({
      where: {
        id,
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  async update(id: number, dto: UpdateMessageDto) {
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
