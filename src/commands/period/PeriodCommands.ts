import {CommandInterface} from "../CommandInterface";
import {Message} from "discord.js";
import {UserModel} from "../../collections/UserModel";
import {parseMilliseconds} from "./parseMilliseconds";

export const PeriodCommands: {
  set: CommandInterface;
  get: CommandInterface;
} = {
  get: {
    command: "!get-period",
    description: "Gets the time period in between messages from the bot. Default 1 day.",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content.trim();
      const author_id = msg.author.id;
      if (msg_input.startsWith(this.command)) {
        const user = await UserModel.findOne({author_id});
        if (user == null) {
          await msg.reply("You have not created an account with me.");
        } else {
          const {days, hours, minutes, seconds} = parseMilliseconds(user.period);
          const dayString = days > 0 ? days + " day" + (days > 1 ? 's' : ', ') : '';
          const hourString = days > 0 ? hours + " hour" + (hours !== 1 ? 's' : ', ') : '';
          const minuteString = minutes > 0 ? minutes + " minute" + (minutes !== 1 ? 's' : ', '): '';
          const secondString = seconds + " second" + (seconds !== 1 ? 's' : '');
          await msg.reply(`The time period is set at: ${dayString}${hourString}${minuteString}${secondString}`);
        }
      }
    }
   },
  set: {
    command: "!set-period",
    description: "Sets the time period that the user receives content from the bot. The [amount] can be any positive" +
      " integer. The [unit] can be: hour, hours, day, days",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content.trim();
      const author_id = msg.author.id;
      if (msg_input.startsWith(this.command)) {
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
              await msg.reply("The new period time has been set");
            }
          }
        }
      }
    }
  }
};
