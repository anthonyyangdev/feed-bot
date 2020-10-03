import {Document, Schema} from "mongoose";
import * as mongoose from "mongoose";

interface Message extends Document {
  author: string;
  message_id: string;
  channel_id: string;
  created_timestamp: number;
  users: string[];
}

const MessageSchema = new Schema({
  author: String,
  message_id: String,
  channel_id: String, 
  created_timestamp: Number,
  users: [String]
});

export const MessageModel = mongoose.model<Message>('Message', MessageSchema, 'messages');
