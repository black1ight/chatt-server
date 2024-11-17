import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma.service';
import { IUser } from 'types/types';
import { FilterRoomDto } from './dto/filter-room.dto';
import { SocketService } from 'src/socket/socket.service';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateRoomDto, userId: number) {
    const newRoom = await this.prisma.room.create({
      data: {
        name: dto.name,
        type: dto.type,
        users: {
          connect: dto.users?.map((id) => ({ id })),
        },
        owner: userId,
        color: dto.color,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
            color: true,
            online: true,
            lastSeen: true,
            socketId: true,
            imageUrl: true,
            createdAt: true,
          },
        },
        messages: {
          take: -1,
          include: {
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
    return newRoom;
  }

  async findAll(user: IUser) {
    return await this.prisma.room.findMany({
      where: {
        users: {
          some: { id: user.id },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
            bio: true,
            phone: true,
            color: true,
            online: true,
            lastSeen: true,
            socketId: true,
            imageUrl: true,
          },
        },
        messages: {
          take: -1,
          include: {
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
        messages: {
          _count: 'desc',
        },
      },
    });
  }

  async findBySearch(user: IUser, query: FilterRoomDto) {
    const { search } = query;
    const searchLength = search.length;

    if (searchLength >= 4) {
      return await this.prisma.room.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              username: true,
              online: true,
              lastSeen: true,
            },
          },
        },
      });
    }
  }

  async findOne(id: number) {
    return await this.prisma.room.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
            color: true,
            online: true,
            lastSeen: true,
            socketId: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateRoomDto) {
    const updateData: any = {};

    if (dto.addUsers) {
      updateData.users = {
        connect: dto.addUsers?.map((id) => ({ id })),
      };
    }

    if (dto.removeUser) {
      updateData.users = {
        disconnect: { id: dto.removeUser },
      };
    }

    if (dto.owner) {
      updateData.owner = dto.owner;
    }

    if (dto.promoteUser) {
      updateData.owner = dto.promoteUser;
    }

    if (dto.imageUrl) {
      updateData.imageUrl = dto.imageUrl;
    }

    await this.prisma.room.update({
      where: {
        id,
      },
      data: updateData,
    });
    return this.findOne(id);
  }

  async remove(id: number) {
    return await this.prisma.room.delete({
      where: { id },
    });
  }
}
