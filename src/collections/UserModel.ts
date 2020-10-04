import {Document, Schema} from "mongoose";
import * as mongoose from "mongoose";
import {ChannelBody} from "./ChannelBody";

export interface UserDoc extends Document {
  author_id: string;
  period: number;
  channels: ChannelBody[];
  next_period: number;  // Milliseconds after epoch
  keywords: string[];
  reac_threshold: number
}

const UserSchema = new Schema({
  author_id: String,
  period: Number,
  channels: [{
    channel_id: String,
    server_id: String,
  }],
  next_period: Number,
  keywords: [String],
  reac_threshold: Number
});

export const UserModel = mongoose.model<UserDoc>('User', UserSchema, 'users');
