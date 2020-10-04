import Discord, { ReactionManager } from 'discord.js';
import { MessageModel } from './MessageStorage';

import path from 'path';
import env from 'dotenv';
import mongoose from "mongoose";
import {UserModel} from "./collections/UserModel";
import {check_bot_dm_response} from "./response/bot_dm";
import {check_bot_channel_response} from "./response/bot_channel";
import {formatDmMessage} from "./message/formatDmMessage";

env.config({
  path: path.join(__dirname, '..', '.env')
});

// function callEveryHour() {
//   setInterval(saveMessages, 1000 * 60);
// }

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

// const messages = await MessageModel.find({});
//     const message_links = await Promise.all(messages.map(async (v) => msg.channel.messages.fetch(v.message_id)));
//     message_links.forEach(link => {
//       msg.reply(link.content);
//     });

function containsKeywords(content: string, keywords: string[]): boolean {
  let result = false;
  keywords.forEach(keyword => {
    if (content.includes(keyword)) {
      result = result || true;
    }
  });
  return result;
}

// async function saveMessages() {
//   // const channel_id = client.channels;
//   // get all users and apply across users
//   // have it send as a dm to the user
//   // messages mapped by channels, and guild
//   const author_id = client.user?.id;
//   if (author_id != undefined) {
//     const user = await UserModel.findOne({ author_id });
//     if (user != null) {
//       const user_channels = user.channels;
//       const user_keywords = user.keywords;
//       user_channels.forEach(async channel_id => {
//         console.log("Saving messages in channel: " + channel_id);
//         const dc_channel = await client.channels.fetch(channel_id);
//         // get the discord Channel object with channel_id
//         // need to check timing of message
//         const msg_collector = await new Discord.MessageCollector(dc_channel as Discord.TextChannel, msg => containsKeywords(msg.content, user_keywords));
//         await msg_collector.checkEnd();
//         msg_collector.collected.forEach(async msg => {
//           const doc = await MessageModel.create({
//             author: msg.author.id,
//             message_id: msg.id,
//             channel_id: msg.channel.id,
//             created_timestamp: msg.createdTimestamp,
//             users: []
//           });
//           await doc.save();
//           console.log("Saved a new message " + msg.content);
//         });
//         console.log("Done saving.");
//       });
//       console.log("Saved messages");
//     }
//   } else {
//     console.log("User not found");
//   }
// }

// callEveryHour();

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

    //hardcoded - scans messages from last hour
    const timestamp_thresh : number = d.getTime() - (1000 * 60 * 60);
    const messages = await MessageModel.find({ created_timestamp: { $gte: timestamp_thresh } }).exec();

    for (const iteration of messages) {
      const m  = await msg.channel.messages.fetch(iteration.message_id);
      const reactions = m.reactions.cache.array();

      // count number of unique reactions
      const userSet = new Set();
      for (let i = 0; i < reactions.length; i++) {
        const reaction = reactions[i];
        const users = reaction.users.cache.array();
        for (let j = 0; j < users.length; j++) {
          userSet.add(users[j].id);
        }
      }
      const numUniqueReactors = userSet.size;
      console.log("Message " + iteration.message_id.toString() + " has " + numUniqueReactors.toString() + " reactors");

      const author_id = msg.author.id;
      const user = await UserModel.findOne({author_id});

      if (!(user == null)) {
        if (numUniqueReactors >= user.reac_threshold && !iteration.users.includes(author_id)) {
          // Use anthony's message printing code
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
    console.log("Number of messages", messages.length);
    const message_contents = await Promise.all(messages.map(async (v) => {
      return formatDmMessage(client, v.message_id, v.channel_id);
    }));
    message_contents.forEach(content => {
      if (content != null)
        msg.reply(content);
    });
  }

  if (msg.content.trim() === "!get-mention-messages") {
    const messages = await MessageModel.find({});
    const message_contents = await Promise.all(messages.map(async (v) => msg.channel.messages.fetch(v.message_id)));
    message_contents.forEach(contents => {
      if (contents.mentions.users.firstKey() != undefined) {
        const userKeyArr = contents.mentions.users.keyArray();
        userKeyArr.forEach(userKey => {
          if (contents.content.includes("" + userKey) && userKey == msg.author.id) {
            msg.reply(contents.content)
          }
        })
      }
      else if (contents.mentions.roles.firstKey() != undefined && msg.member != null) {
        const roleKeyArr = msg.member.roles.cache.keyArray();
        roleKeyArr.forEach(roleKey => {
          if (contents.content.includes("" + roleKey)) {
            msg.reply(contents.content);
          }
        });
      }
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
