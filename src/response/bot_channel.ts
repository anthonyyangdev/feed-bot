import {Message} from "discord.js";
import {ChannelCommands} from "../commands/channels/ChannelCommands";
import {AnalysisCommands} from "../commands/analysis/AnalysisCommands";

/**
 * Executes commands that should run only when messaging in some channel in a server.
 * @param msg
 */
export const check_bot_channel_response = async (msg: Message): Promise<void> => {
  const channel_id = msg.channel.id;
  if (!channel_id) { return; }

  await AnalysisCommands.create.checkAndRun(msg);

<<<<<<< HEAD
  if (msg_input.startsWith("!get-analytics")) {
    await handleAnalytics(msg.guild, msg_input, msg.author);
  }

  if (msg_input === "!remove-channel") {
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

  if (msg_input === "!save-channel") {
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
      addToQueue(q, doc);
    } else {
      await UserModel.findOneAndUpdate( 
        { author_id, 'channels.channel_id': { '$ne': channel_id } }, 
        { '$addToSet': { 'channels': { channel_id, server_id } } }
      )
    }
    await msg.reply("Saved this channel under your name.");
  }
=======
  await ChannelCommands.add.checkAndRun(msg);
  await ChannelCommands.remove.checkAndRun(msg);
>>>>>>> 1064ed014dc89d10fdf2335659df06134554ab59
};
