import mongoose, { Document, Schema, Model, model } from 'mongoose';

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  messages: mongoose.Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}

const userSchema: Schema = new Schema(
  {
    username: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    messages: [mongoose.Types.ObjectId],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

const User: Model<IUser> = model<IUser>('User', userSchema);

export default User;
