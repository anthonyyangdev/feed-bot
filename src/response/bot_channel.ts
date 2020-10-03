import {Message} from "discord.js";
import {UserModel} from "../collections/UserModel";

/**
 * Executes commands that should run only when messaging in some channel in a server.
 * @param msg
 */
export const check_bot_channel_response = async (msg: Message): Promise<void> => {
  const channel_id = msg.channel.id;
  if (!channel_id) { return; }

  const author_id = msg.author.id;

  if (msg.content.trim() === "!remove-channel") {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You do not have any saved channels");
    } else {
      await UserModel.findOneAndUpdate({author_id}, {
        $pull: {
          channels: channel_id
        }
      });
      await msg.reply("This channel has been removed your saved list of channels");
    }
  }

  if (msg.content.trim() === "!save-channel") {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      const doc = await UserModel.create({
        author_id,
        channels: [channel_id],
        period: 86400000,
        next_period: Date.now() + 86400000,
        keywords: []
      });
      await doc.save();
    } else {
      await UserModel.findOneAndUpdate({
        author_id
      }, {
        $addToSet: {
          channels: channel_id
        }
      });
    }
    await msg.reply("Saved this channel under your name.");
  }
};
