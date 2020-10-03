import {Document, Schema} from "mongoose";
import * as mongoose from "mongoose";

interface User extends Document {
  author_id: string;
  period: number;
  channels: string[];
  next_period: number;  // Milliseconds after epoch
  keywords: string[];
}

const UserSchema = new Schema({
  author_id: String,
  period: Number,
  channels: [String],
  next_period: Number,
  keywords: [String]
});

export const UserModel = mongoose.model<User>('User', UserSchema, 'users');
