import {CommandInterface} from "../CommandInterface";
import {Message} from "discord.js";
import {UserModel} from "../../collections/UserModel";
import {addToQueue} from "../../PeriodicChecker";

export const AccountCommands: {
  create: CommandInterface;
  end: CommandInterface;
} = {

  end: {
    command: "!end",
    description: "Drops the users profile information from the bot.",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content.trim();
      const author_id = msg.author.id;
      if (msg_input === "!end-feed") {
        await UserModel.findOneAndRemove({author_id});
        await msg.author.send("You've been removed by the system. Goodbye 😢");
      }
    }
  },
  create: {
    command: "!create",
    description: "Create an account with the bot.",
    async checkAndRun(msg: Message): Promise<void> {
      if (msg.content.trim().startsWith(this.command)) {
        const author_id = msg.author.id;
        const channel_id = msg.channel.id;
        const server_id = msg.guild?.id ?? "Unknown";
        const user = await UserModel.findOne({author_id});
        if (user != null)
          await msg.reply("You've created an account with me already.");
        else {
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
          await msg.reply("Account created! Welcome aboard <@" + author_id + ">");
        }
      }
    }
  }

};
