import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { IMessage, IUser } from 'types/types';
import { GetMessagesDto } from './dto/get-messages.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}
  async create(dto: IMessage) {
    const newMessage = await this.prisma.message.create({
      data: {
        replyId: dto.replyId,
        text: dto.text,
        userId: dto.userId,
        roomId: dto.roomId,
        readUsers: [dto.userId],
        status: 'send',
      },
    });
    const { id } = newMessage;
    return await this.getById(id);
  }

  async findMany(query: GetMessagesDto, user: IUser) {
    const { room } = query;
    const conditions = [];
    if (room) {
      conditions.push({
        OR: [{ roomId: +room }],
      });
    } else {
      conditions.push({
        OR: [
          {
            room: {
              users: {
                some: { id: user.id },
              },
            },
          },
        ],
      });
    }

    return await this.prisma.message.findMany({
      where: {
        AND: conditions,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        reply: {
          select: {
            text: true,
            user: {
              select: {
                email: true,
                username: true,
              },
            },
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
            email: true,
            username: true,
            socketId: true,
          },
        },
        reply: {
          select: {
            text: true,
            user: {
              select: {
                email: true,
                username: true,
              },
            },
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
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });
  }

  async updateRead(id: number, user: IUser) {
    const currentMessage = await this.getById(id);
    const alreadyRead = currentMessage.readUsers.find(
      (index) => index === user.id,
    );

    if (alreadyRead) {
      return currentMessage;
    }

    return await this.prisma.message.update({
      where: {
        id,
      },
      data: {
        readUsers: {
          push: user.id,
        },
        updatedAt: currentMessage.updatedAt,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            socketId: true,
          },
        },
        reply: {
          select: {
            text: true,
            user: {
              select: {
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    return await this.prisma.message.delete({
      where: {
        id,
      },
    });
  }

  async removeMany(id: number) {
    const messageToDelete = await this.prisma.message.findMany({
      where: { roomId: id },
    });
    await this.prisma.message.deleteMany({
      where: {
        roomId: id,
      },
    });
    return messageToDelete;
  }
}
