import Discord from 'discord.js';
import {MessageModel} from './MessageStorage';

import path from 'path';
import env from 'dotenv';
import mongoose from "mongoose";
import {UserModel} from "./collections/UserModel";
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
  // if (!msg.author.bot && !msg.content.startsWith("!get-all-messages")) {
  //   const doc = await MessageModel.create({
  //     author: msg.author.id,
  //     message_id: msg.id,
  //     channel_id: msg.channel.id
  //   });
  //   await doc.save();
  //   console.log("Saved a new message");
  //   await msg.reply("Add the message onto the database");
  //   return;
  // }

  if (msg.content.trim() === "!save-channel") {
    const channel_id = msg.channel.id;
    const author_id = msg.author.id;
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      const doc = await UserModel.create({
        author_id,
        channels: [channel_id],
        period: 10000000,
        next_period: 10000000,
        keywords: []
      });
      await doc.save();
    } else {
      await UserModel.findOneAndUpdate({
        author_id
      }, {
        $addToSet: {
          channels: channel_id
        }
      });
    }
    await msg.reply("Saved this channel under your name.");
  }

  if (msg.content.trim() === "!my-channels") {
    const author_id = msg.author.id;
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You have no saved channels");
    } else {
      const channels_list = user.channels.join(", ");
      await msg.reply("Your saved channels are: <" + channels_list + ">");
    }
  }

  if (msg.content.startsWith("!get-all-messages")) {
    const messages = await MessageModel.find({});
    const message_links = await Promise.all(messages.map(async (v) => msg.channel.messages.fetch(v.message_id)));
    message_links.forEach(link => {
      msg.reply(link.content);
    });
  }

  if (msg.channel.type === "dm" && !msg.author.bot) {
    if (msg.content === "!commands") {
      msg.reply("Here is a list of available commands!");
    } else {
      msg.reply("Hello <@" + msg.author.id + ">, how can I help you?\nYou can list available commands by typing !commands");
    }
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
