import {CommandInterface} from "../CommandInterface";
import {Message} from "discord.js";
import {UserModel} from "../../collections/UserModel";

export const ReactionCommands: {
  setThreshold: CommandInterface;
  getThreshold: CommandInterface;
} = {
  getThreshold: {
    command: "!get-reaction-threshold",
    description: "Gets the reaction threshold.",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content.trim();
      if (msg_input.startsWith(this.command)) {
        const author_id = msg.author.id;
        const user = await UserModel.findOne({author_id});
        if (user != null) {
          await msg.reply("Your reaction threshold is: " + user.reac_threshold);
        }
      }
    }
  },
  setThreshold: {
    command: "!set-reaction-threshold",
    description: "Sets the minimum reaction that a post needs to be relevant. Default 3.",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content.trim();
      const author_id = msg.author.id;
      if (msg_input.startsWith(this.command)) {
        const tokenized = msg_input.split(" ");
        const time = parseInt(tokenized[1]);
        if (!isNaN(time)) {
          const user = await UserModel.findOne({author_id});
          if (user != null) {
            await UserModel.findOneAndUpdate({author_id}, {
              $set: {
                reac_threshold: time,
              }
            });
          } else {
            await msg.reply("Could not find your user in database");
          }
        } else {
          await msg.reply("Please include valid integer after commands");
        }
      }
    }
  }
};
