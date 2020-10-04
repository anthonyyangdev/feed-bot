import {Document, Schema} from "mongoose";
import * as mongoose from "mongoose";
import {ChannelBody} from './collections/ChannelBody';

interface Message extends Document {
  author: string;
  message_id: string;
  channel: ChannelBody;
  created_timestamp: number;
  users: string[];
}

const MessageSchema = new Schema({
  author: String,
  message_id: String,
  channel: {
    channel_id: String,
    server_id: String,
  },
  created_timestamp: Number,
  users: [String],
  createdAt: {
    type: Date,
    expires: Number.parseInt(process.env.MESSAGE_EXPIRATION_PERIOD ?? "86400"),
    default: Date.now
  }
});

export const MessageModel = mongoose.model<Message>('Message', MessageSchema, 'messages');
