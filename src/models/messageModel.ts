import { Schema, model } from 'mongoose';
import { IMessage } from 'src/interfaces/message.interface';

const messageSchema = new Schema<IMessage>(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user is required'],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

export default model<IMessage>('Message', messageSchema);
