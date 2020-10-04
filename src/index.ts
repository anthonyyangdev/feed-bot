import Discord from 'discord.js';
import { MessageModel } from './collections/MessageStorage';

import path from 'path';
import env from 'dotenv';
import mongoose, {Model} from "mongoose";
import {UserModel} from "./collections/UserModel";
import {check_bot_dm_response} from "./response/bot_dm";
import {check_bot_channel_response} from "./response/bot_channel";
import {checkUserUpdateEachMinute} from './periodicChecker';
import {ChannelBody} from "./collections/ChannelBody";

env.config({
  path: path.join(__dirname, '..', '.env')
});

async function start(): Promise<void> {
  const url = "mongodb://localhost:27017/";
  const mongooseOpts = {
    promiseLibrary: Promise,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  };
  mongoose.set('useCreateIndex', true);
  mongoose.set('runValidators', true);
  await mongoose.connect(url, mongooseOpts);
  await MessageModel.deleteMany({});
  await UserModel.deleteMany({});
  console.log("Connected to the database");
}

start();

const client = new Discord.Client();
client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  checkUserUpdateEachMinute(client);
});


// event checks if message has been sent and reacts accordingly
client.on("message", async (msg) => {
  if (msg.author.bot) return;

  const doc = await MessageModel.create({
    author: msg.author.id,
    message_id: msg.id,
    channel: {
      server_id: msg.guild?.id ?? "",
      channel_id: msg.channel.id
    },
    created_timestamp: msg.createdTimestamp,
    users: [msg.author.id],
  });
  await doc.save();

  await check_bot_dm_response(client, msg);
  await check_bot_channel_response(msg);
});

client.login(process.env.BOT_TOKEN);

process.on("disconnect", async () => {
  await mongoose.disconnect();
});
