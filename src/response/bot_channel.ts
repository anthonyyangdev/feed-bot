import {Message} from "discord.js";
import {UserModel} from "../collections/UserModel";

export const check_bot_channel_response = async (msg: Message): Promise<void> => {
  const channel_id = msg.channel.id;
  if (!channel_id) { return; }

  const author_id = msg.author.id;
  if (msg.content.trim() === "!save-channel") {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      const doc = await UserModel.create({
        author_id,
        channels: [channel_id],
        period: 10000000,
        next_period: 10000000,
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
