export class CreateRoomDto {
  roomId: string;
  users: number[];
  color: {
    first: string;
    second: string;
  };
}
