export interface IUser {
  id: string;
  email: string;
  createdAt?: Date;
}

export interface IMessageUser {
  id: number;
  user_name?: string | null;
  email?: string;
}

export interface IMessage {
  text: string;
  createdAt?: Date;
  user: IMessageUser;
}
