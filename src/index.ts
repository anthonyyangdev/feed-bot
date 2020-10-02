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

// event checks if message has been sent and reacts accordingly
client.on("message", async (msg) => {
  if (msg.channel.type === "dm" && !msg.author.bot) {
    if (msg.content === "!commands") {
      msg.reply("Here is a list of available commands!");
    } else {
      msg.reply("Hello <@" + msg.author.id + ">, how can I help you?\nYou can list available commands by typing !commands");
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
