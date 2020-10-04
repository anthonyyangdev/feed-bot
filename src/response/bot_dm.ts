import {Message, Client} from "discord.js";
import {UserModel} from "../collections/UserModel";
import {KeyboardCommands} from "../commands/keywords/KeywordCommands";
import {ReactionCommands} from "../commands/reaction/ReactionCommands";
import {ChannelCommands} from "../commands/channels/ChannelCommands";
import {PeriodCommands} from "../commands/period/PeriodCommands";
import {HelpCommand} from "../commands/HelpCommand";

/**
 * Executes commands that should run only when chatting with the bot in a DM.
 * @param client
 * @param msg
 */
export const check_bot_dm_response = async (client: Client, msg: Message): Promise<void> => {

  if (msg.channel.type !== "dm" || msg.author.bot) return;

  const author_id = msg.author.id;
  const msg_input = msg.content.trim();

  await KeyboardCommands.show.checkAndRun(msg);
  await KeyboardCommands.add.checkAndRun(msg);
  await KeyboardCommands.remove.checkAndRun(msg);

  await ReactionCommands.setThreshold.checkAndRun(msg);
  await ReactionCommands.getThreshold.checkAndRun(msg);

  await ChannelCommands.show.checkAndRun(msg, client);

  if (msg_input === "!end-feed") {
    await UserModel.findOneAndRemove({author_id});
    await msg.author.send("You've been removed by the system. Goodbye 😢");
  }

  await PeriodCommands.set.checkAndRun(msg);

  await HelpCommand.checkAndRun(msg);
};
