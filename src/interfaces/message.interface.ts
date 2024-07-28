import { Document, Types } from 'mongoose';

export interface IMessage extends Document<Types.ObjectId> {
  name: string;
  user: Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}
