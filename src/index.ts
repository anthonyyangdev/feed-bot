import Discord from 'discord.js';
import path from 'path';

import env from 'dotenv';
env.config({
  path: path.join(__dirname, '..', '.env')
});

const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("message", async (msg) => {
  if (msg.content.startsWith("!ping")) {
    const ch = msg.guild?.channels.cache.find(channel => channel.name === "general");
    if (ch != null) {
      msg.reply("Pong! " + ch.createdTimestamp + ". Found the general channel in the cache");
    } else {
      msg.reply("Could not find channel");
    }
  }
});

client.login(process.env.BOT_TOKEN);
