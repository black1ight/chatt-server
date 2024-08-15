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

export interface IMessage {
  type: string;
  id: number;
  text: string;
  userId: number;
  updatedAt?: Date;
}

export interface INewMessage {
  id: number;
  text: string;
  userId: number;
  createdAt: Date;
}

export interface IResCreateMessage {
  newMessage: INewMessage;
}
