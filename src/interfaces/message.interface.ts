import { Types } from 'mongoose';

export interface IMessage {
  name: string;
  user: Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}
