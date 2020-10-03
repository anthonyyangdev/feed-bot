import Discord from 'discord.js';
import {MessageModel} from './MessageStorage';

import path from 'path';
import env from 'dotenv';
import mongoose from "mongoose";
import {UserModel} from "./collections/UserModel";
import {check_bot_dm_response} from "./response/bot_dm";
import {check_bot_channel_response} from "./response/bot_channel";
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
});


// event checks if message has been sent and reacts accordingly
client.on("message", async (msg) => {

  const channel_id = msg.channel.id;
  const author_id = msg.author.id;

  if (author_id !== process.env.TEST_USER)
    return;

  if (!msg.author.bot && !msg.content.startsWith("!get-all-messages")) {
    const doc = await MessageModel.create({
      author: msg.author.id,
      message_id: msg.id,
      channel_id: msg.channel.id,
      created_timestamp: msg.createdTimestamp,
      users: []
    });
    await doc.save();
    console.log("Saved a new message");
    await msg.reply("Add the message onto the database");
  }

  // at the time of periodic check

  if (msg.content.trim() === "!get-reactions") {
    const d : Date = new Date();

    //all messages from last hour
    const timestamp_thresh : number = d.getTime() - (1000 * 60 * 60);
    const messages = await MessageModel.find({ created_timestamp: { $gte: timestamp_thresh } }).exec();

    for (const iteration of messages) {
      const m  = await msg.channel.messages.fetch(iteration.message_id);
      const reactions = m.reactions.cache.size;
      console.log('Message ' + iteration.message_id + ' has ' + reactions.toString() + ' reactions');

      const author_id = msg.author.id;
      const user = await UserModel.findOne({author_id});

      if (!(user == null)) {
        //make sure you don't resend a message to a user
        if (reactions >= user.reac_threshold && !iteration.users.includes(author_id)) {
          msg.author.send(m.url);
          msg.author.send(m.content);
          iteration.users.push(author_id);
        }
      }
    }
  }

  await check_bot_dm_response(client, msg);
  await check_bot_channel_response(msg);

  if (msg.content.startsWith("!get-all-messages")) {
    const messages = await MessageModel.find({});
    const message_links = await Promise.all(messages.map(async (v) => msg.channel.messages.fetch(v.message_id)));
    message_links.forEach(link => {
      msg.reply(link.content);
    });
  }

  if (msg.content.startsWith("!save-server")) {
    const server_id = msg.guild?.id;
    if (server_id != null) {
      msg.author.send("Saved this server (" + server_id + ") for <@" + msg.author.id + ">");
    } else {
      msg.reply("Could not find channel");
    }
  }

  if (msg.content.startsWith("!ping")) {
    // checks the guild name and checks if channel name is general
    // need to make it check if the name is DMChannel name
    const ch = msg.guild?.channels.cache.find(channel => channel.name === "general");
    if (ch != null) {
      msg.reply("Pong! " + ch.createdTimestamp + ". Found the general channel in the cache");
    } else {
      msg.reply("Could not find channel");
    }
  }
});

client.login(process.env.BOT_TOKEN);

process.on("disconnect", async () => {
  await mongoose.disconnect();
});
