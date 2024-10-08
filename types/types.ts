import { Socket } from 'dgram';

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
  socketId: string;
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
  id: number;
  text: string;
  userId: number;
  roomId: string;
  readUsers: number[];
}

export interface IUserData {
  id: number;
  email?: string;
  password?: string;
  user_name?: string;
}

export interface IRoomData {
  id: string;
  users: IUserData[];
  createdAt: Date;
}

export interface IRoomColors {
  first: string;
  second: string;
}

export interface IResUser {
  email: string | undefined;
  password?: string | undefined;
  user_name: string | null | undefined;
  id: number | undefined;
  color: IRoomColors;
  online: Boolean;
  lastSeen: Date;
  socketId: string;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface IResRoom {
  id: string;
  users: IResUser[];
  messages: IResMessage[];
  color: IRoomColors;
  owner: number;
  createdAt: Date;
}

export interface INewRoom {
  roomId: string;
  users: number[];
  color: IRoomColors;
  owner: number;
}

export interface JoinData {
  room: string;
  user: string;
}

export interface TypingData {
  userId: number;
  userName: string;
  roomId: string;
  typing: boolean;
}
