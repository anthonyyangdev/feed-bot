import {CommandInterface} from "../CommandInterface";
import {UserModel} from "../../collections/UserModel";
import {addToQueue} from "../../periodicChecker";
import {Client, Message} from "discord.js";


export const ChannelCommands: {
  add: CommandInterface;
  remove: CommandInterface;
  show: CommandInterface;
} = {
  show: {
    command: "!my-channels",
    description: "Shows all channels added by the user.",
    async checkAndRun(msg: Message, client: Client): Promise<void> {
      if (client == null) throw new Error("Client must be used");

      const msg_input = msg.content.trim();
      const author_id = msg.author.id;
      if (msg_input === "!my-channels") {
        const user = await UserModel.findOne({author_id});
        if (user == null) {
          await msg.reply("You have no saved channels");
        } else {
          await msg.reply("Your saved channels are: ");
          for (const c of user.channels) {
            const channel_data = await client.channels.fetch(c.channel_id);
            const guild_data = c.server_id ? await client.guilds.fetch(c.server_id) : "None";
            await msg.reply(`Server: ${guild_data.toString()}, Channel: ${channel_data.toString()}`);

          }
        }
      }
    }
  },
  remove: {
    command: "!remove-channel",
    description: "Removes the current channel where this command was executed from the user's profile.",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content.trim();
      const author_id = msg.author.id;
      const channel_id = msg.channel.id;
      const server_id = msg.guild?.id ?? "Unknown";
      if (msg_input === this.command) {
        const user = await UserModel.findOne({author_id});
        if (user == null) {
          await msg.reply("You do not have any saved channels");
        } else {
          await UserModel.findOneAndUpdate({author_id}, {
            $pull: {
              channels: { channel_id, server_id }
            }
          });
          await msg.reply("This channel has been removed your saved list of channels");
        }
      }
    }
  },
  add: {
    command: "!save-channel",
    description: "Adds the current channel where this command was executed onto the user's profile. The bot will use" +
      " this channel when curating content for the user.",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content.trim();
      const author_id = msg.author.id;
      const channel_id = msg.channel.id;
      const server_id = msg.guild?.id ?? "Unknown";
      if (msg_input === this.command) {
        const user = await UserModel.findOne({author_id});
        if (user == null) {
          const doc = await UserModel.create({
            author_id,
            channels: [{channel_id, server_id}],
            period: 10000, //10000 for demo; 86400000 orig
            next_period: Date.now() + 10000, //10000 for demo; 86400000 orig
            keywords: [],
            reac_threshold: 3
          });
          await doc.save();
          addToQueue(doc);
        } else {
          await UserModel.findOneAndUpdate({author_id}, {
            $addToSet: {
              channels: { channel_id, server_id }
            }
          });
        }
        await msg.reply("Saved this channel under your name.");
      }
    }
  }
};
