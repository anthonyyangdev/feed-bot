import {CommandInterface} from "./CommandInterface";
import {Message} from "discord.js";
import {ChannelCommands} from "./channels/ChannelCommands";
import {AnalysisCommands} from "./analysis/AnalysisCommands";
import {KeyboardCommands} from "./keywords/KeywordCommands";
import {PeriodCommands} from "./period/PeriodCommands";
import {ReactionCommands} from "./reaction/ReactionCommands";
import {AccountCommands} from "./account/AccountCommands";


const AvailableCommands: CommandInterface[] = [
  ...Object.values(ChannelCommands),
  ...Object.values(AnalysisCommands),
  ...Object.values(KeyboardCommands),
  ...Object.values(PeriodCommands),
  ...Object.values(ReactionCommands),
  ...Object.values(AccountCommands)
];

export const HelpCommand: CommandInterface = {
  command: "!help",
  description: "Describes how to use the bot.",
  async checkAndRun(msg: Message): Promise<void> {
    const msg_input = msg.content.trim();
    const author_id = msg.author.id;
    if (msg_input === this.command) {
      await msg.reply(`
      Hello <@${author_id}>, how can I help you?
      Here are all of the available commands:
${AvailableCommands.map(cmd => {
        return `**${cmd.command}**: ${cmd.description}`;
        }).join('\n\n')}
      `);
    }
  }
};
