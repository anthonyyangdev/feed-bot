import Discord from 'discord.js';

import env from 'dotenv';
env.config();

const client = new Discord.Client();



client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("message", (msg) => {
  if (msg.content === "ping") {
    msg.reply("Pong!");
  }
});

client.login("NzYxNDQ1OTU2ODUxNzI4Mzk0.X3atzw.IAUZWNHwEQsel5-QGywQQU8wPeE");
