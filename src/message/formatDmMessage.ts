import {Client, TextChannel} from "discord.js";

/**
 * Formats a Discord message with id [message_id] found at channel [channel_id].
 * If the channel or the message cannot be found, this returns null.
 * Otherwise, it returns the string-formatted message.
 * @param client
 * @param message_id
 * @param channel_id
 */
export const formatDmMessage = async (
  client: Client,
  message_id: string,
  channel_id: string
): Promise<string | null> => {
  const channel = await client.channels.fetch(channel_id);
  if (channel.type === "text") {
    const message = await (channel as TextChannel).messages.fetch(message_id);
    const author = message.author;
    const guild = message.guild;
    const content = message.content;

    return `
    Message: ${message.url}
    By: ${author.username}, ${author.toString()}
    ${guild ? `From Server: ${guild.name}, ${guild.id}` : 'Server unknown'}
    Content:
=============================================================
    ${content}
=============================================================
    Reactions: ${message.reactions.toString()}
    `;
  }
  return null;
};
