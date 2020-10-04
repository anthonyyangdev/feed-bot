import {Message, Client} from "discord.js";
import {UserModel} from "../collections/UserModel";
import {KeyboardCommands} from "../commands/keywords/KeywordCommands";
import {ReactionCommands} from "../commands/reaction/ReactionCommands";
import {ChannelCommands} from "../commands/channels/ChannelCommands";

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

  await ChannelCommands.show.checkAndRun(msg, client);

  if (msg_input === "!end-feed") {
    await UserModel.findOneAndRemove({author_id});
    await msg.author.send("You've been removed by the system. Goodbye 😢");
  }

  if (msg_input.startsWith("!set-period")) {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You have no saved channels");
    } else {
      const remaining_msg = msg_input.substring("!set-period".length + 1);
      const time_amount = remaining_msg.match(/[0-9]+/);
      const time_unit = remaining_msg.match(/(hour|day)s?/);
      if (time_amount == null || time_unit == null) {
        await msg.reply("You did not specify a specific amount of time.");
      } else {
        let amount = Number.parseInt(time_amount[0]);
        const unit = time_unit[0];
        if (isNaN(amount)) {
          await msg.reply("Cannot set this amount of time");
        } else {
          switch (unit) {
            case "hour": case "hours":
              amount *= 60 * 3600; break;
            case "day": case "days":
              amount *= 24 * 60 * 3600; break;
          }
          await UserModel.findOneAndUpdate({author_id}, {
            $set: {
              period: amount,
              next_period: Math.min(Date.now() + amount, user.next_period)
            }
          });
        }
      }
    }
  }


  if (msg_input === "!commands") {
    await msg.reply("Here is a list of available commands!");
  } else {
    await msg.reply("Hello <@" + msg.author.id + ">, how can I help you?\nYou can list available commands by typing" +
      " !commands");
  }
};
