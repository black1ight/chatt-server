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
  type: string;
  id: number;
  text: string;
  createdAt?: Date;
  user?: IMessageUser;
}
