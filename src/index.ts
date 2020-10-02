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

client.on("message", (msg) => {
  if (msg.content === "ping") {
    msg.reply("Pong!");
  }
});

client.login(process.env.BOT_TOKEN);
