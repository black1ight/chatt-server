export interface IUser {
  id: number;
  email: string;
  createdAt?: Date;
}

export interface IMessageUser {
  id: number;
  user_name?: string | null;
  email?: string;
}

export interface IUser {
  id: number;
  user_name: string;
  email: string;
}

export interface IResMessage {
  id: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  user: IUser;
}

export interface IMessage {
  reply: number | null;
  type: string;
  id: number;
  text: string;
  userId: number;
}
