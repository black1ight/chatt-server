import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  socketId?: string;
  status?: string;
  lastSeen?: Date;
  imageUrl?: string;
}
