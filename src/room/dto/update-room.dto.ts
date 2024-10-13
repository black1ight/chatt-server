import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  addUsers?: number[];
  removeUser?: number;
  owner?: number;
  promoteUser?: number;
  imageUrl?: string;
}
