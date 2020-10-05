import {Message, Client} from "discord.js";
import {KeyboardCommands} from "../commands/keywords/KeywordCommands";
import {ReactionCommands} from "../commands/reaction/ReactionCommands";
import {ChannelCommands} from "../commands/channels/ChannelCommands";
import {PeriodCommands} from "../commands/period/PeriodCommands";
import {HelpCommand} from "../commands/HelpCommand";
import {AccountCommands} from "../commands/account/AccountCommands";

/**
 * Executes commands that should run only when chatting with the bot in a DM.
 * @param client
 * @param msg
 */
export const check_bot_dm_response = async (client: Client, msg: Message): Promise<void> => {

  if (msg.channel.type !== "dm" || msg.author.bot) return;

  await KeyboardCommands.show.checkAndRun(msg);
  await KeyboardCommands.add.checkAndRun(msg);
  await KeyboardCommands.remove.checkAndRun(msg);

  await ReactionCommands.setThreshold.checkAndRun(msg);
  await ReactionCommands.getThreshold.checkAndRun(msg);

  await ChannelCommands.show.checkAndRun(msg, client);

  await AccountCommands.create.checkAndRun(msg);
  await AccountCommands.end.checkAndRun(msg);

  await PeriodCommands.set.checkAndRun(msg);
  await PeriodCommands.get.checkAndRun(msg);

};
