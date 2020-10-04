import {ChannelAnalytics, collectTextChannelAnalytics, UserAnalytics} from "./analytics";
import {arrayMax} from "../util/arrayMax";
import tmp from "tmp";
import fs from "fs";
import {Message} from "discord.js";

/**
 * Handles the message response where the user wants to get analytics data about a server.
 * The data will be DM'd to the user as a JSON file.
 * @param msg
 */
export const handleAnalytics = async (msg: Message): Promise<void> => {
  const server_name = msg.guild?.name;
  const channels = msg.guild?.channels.cache;
  if (channels != null) {
    const analytics: ChannelAnalytics[] = [];
    for (const channel of channels) {
      const data = collectTextChannelAnalytics(msg.author, channel[0], channel[1]);
      if (data) analytics.push(data);
    }

    // This will map all users to their activeness in different channels.
    const user_activity: Record<string, (UserAnalytics & {channel_id: string; channel_name: string})[]> = {};
    analytics.forEach(ch => {
      ch.users.forEach(user => {
        const data = user_activity[user.username];
        const datum = {
          ...user,
          channel_id: ch.channel_id,
          channel_name: ch.channel_name
        };
        if (!data) {
          user_activity[user.username] = [datum];
        } else {
          data.push(datum);
        }
      });
    });

    const best_user_activities: Record<string, {channel_id: string; channel_name: string; score: number}> = {};
    const average_user_activities: Record<string, number> = {};
    Object.keys(user_activity).forEach(username => {
      if (user_activity[username].length > 0) {
        const total = user_activity[username].reduce((p, c) => p + c.activeness, 0);
        average_user_activities[username] = total / user_activity[username].length;
      } else {
        average_user_activities[username] = 0;
      }
      const best_channel = arrayMax(user_activity[username], (u) => u.activeness);
      if (best_channel) {
        best_user_activities[username] = {
          channel_id: best_channel.channel_id,
          channel_name: best_channel.channel_name,
          score: best_channel.activeness
        };
      }
    });

    const temp_json = tmp.fileSync({postfix: '.json', prefix: server_name});
    fs.writeFileSync(temp_json.name, JSON.stringify({
      server_name: msg.guild?.name,
      number_of_text_channels: analytics.length,
      channels: analytics,
      best_user_activities,
      average_user_activities,
    }, undefined, 2));

    await msg.author.send(`
      Hello ${msg.author.username}!
      
      Here's some information about the server: ${msg.guild?.name}:
      `, {
      files: [temp_json.name]
    });
  }
};
