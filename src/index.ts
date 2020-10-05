import Discord from 'discord.js';
import { MessageModel } from './collections/MessageStorage';

import path from 'path';
import env from 'dotenv';
import mongoose from "mongoose";
import {check_bot_dm_response} from "./response/BotDm";
import {check_bot_channel_response} from "./response/BotChannel";
import {checkUserUpdateEachMinute} from './PeriodicChecker';

env.config({
  path: path.join(__dirname, '..', '.env')
});

async function start(): Promise<void> {
  const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@cluster0.copfc.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority`;
  const mongooseOpts = {
    promiseLibrary: Promise,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  };
  mongoose.set('useCreateIndex', true);
  mongoose.set('runValidators', true);
  await mongoose.connect(url, mongooseOpts);
  console.log("Connected to the database");
}

start();

const client = new Discord.Client();
client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  console.log("Client id", client.user?.id);
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
