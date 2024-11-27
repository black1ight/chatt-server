import { Socket } from 'dgram';

export interface IUser {
  id: number;
  email: string;
  createdAt?: Date;
}

export interface IMessageUser {
  id: number;
  username?: string | null;
  email?: string;
}

export interface IUser {
  id: number;
  username: string;
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

export interface IReplyData {
  text: string;
  user: {
    email: string;
    username: string;
  };
}

export interface IMessage {
  replyId: number | null;
  id: number;
  text: string;
  userId: number;
  roomId: number;
  dialogId: number;
  readUsers: number[];
}

export interface IUserData {
  id: number;
  email?: string;
  password?: string;
  username?: string;
}

export interface IRoomData {
  id: number;
  type: string;
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
  username: string | null | undefined;
  id: number | undefined;
  color: IRoomColors;
  online: Boolean;
  lastSeen: Date;
  socketId: string;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface IResRoom {
  id: number;
  name: string;
  type: string;
  users: IResUser[];
  messages: IResMessage[];
  color: IRoomColors;
  owner: number;
  createdAt: Date;
}

export interface INewRoom {
  name: string;
  type: string;
  users: number[];
  color: IRoomColors;
  owner: number;
}

export interface INewDialog {
  type: string;
  myId: number;
  users: number[];
}

export interface JoinData {
  room: string;
  user: string;
}

export interface TypingData {
  userId: number;
  userName: string;
  roomId: number;
  typing: boolean;
}
