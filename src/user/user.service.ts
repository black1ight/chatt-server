import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { GetUsersDto } from './dto/get-users.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async checkUserName(name: string) {
    const exist = await this.prisma.user.findUnique({
      where: {
        username: name,
      },
    });
    return exist ? null : name;
  }

  async create(createUserDto: CreateUserDto) {
    const userNameFromEmail = createUserDto.email.split('@')[0];
    const existUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (existUser) throw new BadRequestException('This email already exist');
    const userName =
      (await this.checkUserName(userNameFromEmail)) ||
      (await this.checkUserName(
        userNameFromEmail + Math.floor(Math.random() * 10),
      ));

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: userName,
        password: await argon2.hash(createUserDto.password),
        color: createUserDto.color,
      },
    });

    const token = this.jwtService.sign({ email: createUserDto.email });

    return { user, token };
  }

  async findMany(query: GetUsersDto) {
    const { search } = query;
    const searchLength = search.length;

    if (searchLength >= 4) {
      return await this.prisma.user.findMany({
        where: {
          OR: [
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              username: {
                equals: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          email: true,
          username: true,
          phone: true,
          bio: true,
          color: true,
          online: true,
          lastSeen: true,
          socketId: true,
          imageUrl: true,
        },
      });
    }
  }

  async findOne(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneByField(field: string, value: string) {
    return await this.prisma.user.findFirst({
      where: { [field]: value },
    });
  }

  async findBySocketId(socketId: string) {
    return await this.prisma.user.findUnique({
      where: { socketId },
    });
  }

  async findById(id: number) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: number, dto: UpdateUserDto) {
    const userExist = await this.findById(id);
    const updateData: any = {};
    if (dto.status && dto.lastSeen && dto.socketId) {
      updateData.socketId = dto.socketId;
      updateData.online = dto.status === 'online' ? true : false;
      updateData.lastSeen = dto.lastSeen;
    }
    if (dto.imageUrl && userExist) {
      updateData.imageUrl = dto.imageUrl;
    }
    if (dto.username && userExist) {
      const exist = await this.findOneByField('username', dto.username);
      if (!exist) {
        updateData.username = dto.username;
      } else {
        throw new Error('This name already exists!');
      }
    }
    if (dto.phone && userExist) {
      const exist = await this.findOneByField('phone', dto.phone);
      if (!exist) {
        updateData.phone = dto.phone;
      } else {
        throw new Error('This phone number already exists!');
      }
    }
    if (dto.bio && userExist) {
      updateData.bio = dto.bio;
    }

    return await this.prisma.user.update({
      where: {
        id,
      },
      data: updateData,
    });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
