import {Message} from "discord.js";

export type CommandInterface = {
  readonly command: string;
  readonly description: string;
  checkAndRun(msg: Message): Promise<void>;
};
