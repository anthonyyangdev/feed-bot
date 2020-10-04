import {CommandInterface} from "../CommandInterface";
import {Message} from "discord.js";
import {parseKeywords} from "./parseKeywords";
import {UserModel} from "../../collections/UserModel";

/**
 * Contains commands related to keywords.
 */
export const KeyboardCommands: {
  add: CommandInterface;
  remove: CommandInterface;
  show: CommandInterface;
} = {
  show: {
    command: "!show-keywords",
    description: "Show all keywords on the user's profile.",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content.trim();
      const author_id = msg.author.id;
      if (msg_input.startsWith(this.command)) {
        const user = await UserModel.findOne({author_id});
        if (user == null) {
          await msg.reply("You don't have any channels saved");
        } else {
          if (user.keywords.length > 0)
            await msg.reply("Keywords: " + user.keywords.map(v => "<" + v + ">").join(", "));
          else
            await msg.reply("You do not have any keywords added");
        }
      }
    }
  },
  remove: {
    command: "!remove-keywords",
    description: "Removes keywords from the user's profile. Multi-word phrases can be added by using" +
      " double-quotation marks.",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content.trim();
      const author_id = msg.author.id;
      if (msg_input.startsWith(this.command)) {
        const keywords = parseKeywords(msg_input, this.command);
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
    }
  },
  add: {
    command: "!add-keywords",
    description: "Add keywords onto the user's profile for the bot to use when curating content. Multi-word phrases" +
      " can be added by using double-quotation marks.",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content.trim();
      const author_id = msg.author.id;
      if (msg_input.startsWith(this.command)) {
        const keywords = parseKeywords(msg_input, this.command);
        const user = await UserModel.findOne({author_id});
        if (user == null) {
          await msg.reply("You don't have any channels saved");
        } else if (keywords != null) {
          await UserModel.findOneAndUpdate({author_id}, {
            $push: {
              keywords: {
                $each: keywords.filter(w => !user.keywords.includes(w)),
                $slice: 100
              }
            }
          });
        }
      }
    }
  }
};

