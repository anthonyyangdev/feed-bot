import {CommandInterface} from "../CommandInterface";
import {handleAnalytics} from "../../analytics/handleAnalytics";
import {Message} from "discord.js";


export const AnalysisCommands: {
  create: CommandInterface
} = {
  create: {
    command: "!get-analytics",
    description: "The bot will generate an analysis report about the server where the command was run. The report" +
      " will be sent to the user's DM with the bot. Options are added to generate more tailored reports. Accepted" +
      " Options: timeline, engagement, nojson.",
    async checkAndRun(msg: Message): Promise<void> {
      const msg_input = msg.content;
      if (msg_input.startsWith(this.command))
        await handleAnalytics(msg.guild, msg_input, msg.author);
    }
  }
};
