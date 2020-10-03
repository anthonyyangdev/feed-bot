import Discord from 'discord.js';
import { MessageModel } from './MessageStorage';

import path from 'path';
import env from 'dotenv';
import mongoose from "mongoose";
import { UserModel } from "./collections/UserModel";
import { check_bot_dm_response } from "./response/bot_dm";
import { check_bot_channel_response } from "./response/bot_channel";
import { formatDmMessage } from "./message/formatDmMessage";
import {ChannelBody} from "./collections/ChannelBody";

let channels;

export function saveMessagesEveryMinute() {
  setInterval(saveAllMessages, 1000 * 60);
}

// get the user data in the database
// from user model
// then, go through channels
// then, collect messages in channels that have they keyword
// send messages to user and add to database
// what'll probably be better is to get all the messages from the
// message model, filter out so you get only the ones that fit the criteria
// and return those
const client = new Discord.Client();

async function containsKeywords(content: string, keywords: string[]) {
  let result = false;
  for (let i = 0; i < keywords.length; i++) {
    if (content.includes(keywords[i])) {
      result = result || true;
    }
  }
  return result;
}

async function saveUserMessages(id: string, user_channels: ChannelBody[],
  user_keywords: string[]) {
  const messages = await MessageModel.find({});
  channels = user_channels;
  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
    console.log("Saving messages in channel: " + channel.channel_id);
    const dc_channel = await client.channels.fetch(String(channel.channel_id));
    // need to add a time check too
    // make sure not to save duplicate
    // use with lowest priority number will be at front of priority queue
    // peek head of priority queue, if number for user
    // in peek is less than current time, then update user
    // pop and dequeue, then requeue next time it has to be updated, current time
    // + period number
    const msg_collector = await new Discord.MessageCollector(dc_channel as Discord.TextChannel, msg => containsKeywords(msg.content, user_keywords));
    await msg_collector.checkEnd();
    msg_collector.collected.forEach(async msg => {
      const doc = await MessageModel.create({
        author: msg.author.id,
        message_id: msg.id,
        channel_id: msg.channel.id,
        created_timestamp: msg.createdTimestamp,
        users: []
      });
      await doc.save();
      console.log("Saved a new message " + msg.content);
    });
    console.log("Done saving.");
  }
  console.log("Saved messages");
}

// should probably use period and next period???
// next period is next time when message should be sent
// period is interval length

// get list of users in guild that have dm with bot
// actually could just get list of users from UserModel
// that have opted into feedbot start with all users
// first
// then get the user ids and call sendMessagesToUser with the id

async function saveAllMessages() {
  console.log("Starting save...");
  const users = await UserModel.find({});
  users.forEach(user => saveUserMessages(user.author_id, user.channels,
    user.keywords));
}
