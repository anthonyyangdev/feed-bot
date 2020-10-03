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

  await check_bot_dm_response(msg);
  await check_bot_channel_response(msg);

  if (msg.content.startsWith("!add-keywords")) {
    /*
     Regex found from here:
     https://stackoverflow.com/questions/366202/regex-for-splitting-a-string-using-space-when-not-surrounded-by-single-or-double
     */
    const keywords = msg.content.trim()
      .substring("!add-keywords".length + 1)
      .match(/[^\s"']+|"([^"]*)"|'([^']*)'/g)
      ?.map(s => s.startsWith('"') && s.endsWith('"') ? s.substring(1, s.length - 1) : s);
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You don't have any channels saved");
    } else if (keywords != null) {
      await UserModel.findOneAndUpdate({author_id}, {
        $push: {
          keywords: {
            $each: keywords,
            $slice: 100
          }
        }
      });
    }
  }
  if (msg.content.startsWith("!show-keywords")) {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You don't have any channels saved");
    } else {
      await msg.reply("Keywords: " + user.keywords.map(v => "<" + v + ">").join(", "));
    }
  }
  if (msg.content.startsWith("!remove-keywords")) {
    const keywords = msg.content.trim().substring("!add-keywords".length + 1).split(' ');
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You don't have any channels saved");
    } else {
      await UserModel.findOneAndUpdate({author_id}, {
        $pullAll: {
          keywords: keywords
        }
      });
    }
  }

  if (msg.content.trim() === "!end-feed") {
    await UserModel.findOneAndRemove({author_id});
    await msg.author.send("You've been removed by the system. Goodbye 😢");
  }

  if (msg.content.trim().startsWith("!set-period")) {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You have no saved channels");
    } else {
      const remaining_msg = msg.content.trim().substring("!set-period".length + 1);
      const time_amount = remaining_msg.match(/[0-9]+/);
      const time_unit = remaining_msg.match(/(minute|hour|day)s?/);
      if (time_amount == null || time_unit == null) {
        await msg.reply("You did not specify a specific amount of time.");
      } else {
        let amount = Number.parseInt(time_amount[0]);
        const unit = time_unit[0];
        if (isNaN(amount)) {
          await msg.reply("Cannot set this amount of time");
        } else {
          switch (unit) {
            case "minute": case "minutes":
              amount *= 3600; break;
            case "hour": case "hours":
              amount *= 60 * 3600; break;
            case "day": case "days":
              amount *= 24 * 60 * 3600; break;
          }
          await UserModel.findOneAndUpdate({author_id}, {
            $set: {
              period: amount,
              next_period: Math.min(Date.now() + amount, user.next_period)
            }
          });
        }
      }
    }
  }


  if (msg.content.trim() === "!my-channels") {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You have no saved channels");
    } else {
      await msg.reply("Your saved channels are: ");
      for (const c of user.channels) {
        const channel_data = await client.channels.fetch(c);
        await msg.reply(channel_data.toString());
      }
    }
  }

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
