export class CreateRoomDto {
  name: string;
  type: string;
  users: number[];
  color: {
    first: string;
    second: string;
  };
  owner: number;
}
