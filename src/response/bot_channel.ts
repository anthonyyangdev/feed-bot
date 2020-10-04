import {Message} from "discord.js";
import {ChannelCommands} from "../commands/channels/ChannelCommands";
import {AnalysisCommands} from "../commands/analysis/AnalysisCommands";

/**
 * Executes commands that should run only when messaging in some channel in a server.
 * @param msg
 */
export const check_bot_channel_response = async (msg: Message): Promise<void> => {
  const channel_id = msg.channel.id;
  if (!channel_id) return;

  await AnalysisCommands.create.checkAndRun(msg);

  await ChannelCommands.add.checkAndRun(msg);
  await ChannelCommands.remove.checkAndRun(msg);
};
