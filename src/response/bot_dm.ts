import {Message} from "discord.js";

/**
 * Executes commands that should run only when chatting with the bot in a DM.
 * @param msg
 */
export const check_bot_dm_response = async (msg: Message): Promise<void> => {
  if (msg.channel.type === "dm" && !msg.author.bot) {
    if (msg.content === "!commands") {
      await msg.reply("Here is a list of available commands!");
    } else {
      await msg.reply("Hello <@" + msg.author.id + ">, how can I help you?\nYou can list available commands by typing" +
        " !commands");
    }
  }
};
