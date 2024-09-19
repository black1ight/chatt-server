import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma.service';
import { IUser } from 'types/types';
import { FilterRoomDto } from './dto/filter-room.dto';
import { disconnect } from 'process';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateRoomDto, user: IUser) {
    const isExist = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });
    if (!isExist) {
      const newRoom = await this.prisma.room.create({
        data: {
          id: dto.roomId,
          users: {
            connect: dto.users?.map((id) => ({ id })),
          },
          owner: user.id,
          color: dto.color,
        },
      });
      return newRoom;
    } else {
      throw new BadRequestException('This room already is exist!');
    }
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
            user_name: true,
            color: true,
            online: true,
            lastSeen: true,
            socketId: true,
          },
        },
        messages: {
          take: -1,
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

    return await this.prisma.room.findMany({
      where: {
        OR: [
          {
            id: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
        users: {
          some: { id: user.id },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            user_name: true,
            online: true,
            lastSeen: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.room.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            user_name: true,
            color: true,
            online: true,
            lastSeen: true,
            socketId: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateRoomDto) {
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
    return await this.prisma.room.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            user_name: true,
            color: true,
            online: true,
            lastSeen: true,
          },
        },
      },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} room`;
  }
}
