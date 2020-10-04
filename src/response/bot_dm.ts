import {Message, Client} from "discord.js";
import {UserModel} from "../collections/UserModel";
import {parseKeywords} from "../keywords/parseKeywords";

/**
 * Executes commands that should run only when chatting with the bot in a DM.
 * @param client
 * @param msg
 */
export const check_bot_dm_response = async (client: Client, msg: Message): Promise<void> => {

  if (msg.channel.type !== "dm" || msg.author.bot) return;

  const author_id = msg.author.id;
  const msg_input = msg.content.trim();
  if (msg_input.startsWith("!add-keywords")) {
    /*
     Regex found from here:
     https://stackoverflow.com/questions/366202/regex-for-splitting-a-string-using-space-when-not-surrounded-by-single-or-double
     */
    const keywords = parseKeywords(msg_input, "!add-keywords");
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
  if (msg_input.startsWith("!show-keywords")) {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You don't have any channels saved");
    } else {
      await msg.reply("Keywords: " + user.keywords.map(v => "<" + v + ">").join(", "));
    }
  }
  if (msg_input.startsWith("!remove-keywords")) {
    const keywords = parseKeywords(msg_input, "!remove-keywords");
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

  if (msg_input.startsWith("!set-reaction-threshold")) {
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
      await msg.reply("Please include valid integer after command");
    }
  }
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

  if (msg_input === "!my-channels") {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You have no saved channels");
    } else {
      await msg.reply("Your saved channels are: ");
      for (const c of user.channels) {
        const channel_data = await client.channels.fetch(c.channel_id);
        const guild_data = c.server_id ? await client.guilds.fetch(c.server_id) : "None";
        await msg.reply(`Server: ${guild_data.toString()}, Channel: ${channel_data.toString()}`);
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
