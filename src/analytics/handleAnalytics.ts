import {ChannelAnalytics, collectTextChannelAnalytics, UserAnalytics} from "./analytics";
import {arrayMax} from "../util/arrayTools";
import tmp, {file} from "tmp";
import fs from "fs";
import {Message} from "discord.js";
import {createPieChart, createTimeGraph} from "./graphs";

const getUserActivities = (analytics: ChannelAnalytics[]): {
  average: Record<string, number>,
  best: Record<string, {channel_id: string, channel_name: string, score: number}>
} => {
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
  return {
    average: average_user_activities,
    best: best_user_activities
  };
};


const getTimeGraph = async (server_name: string, analytics: ChannelAnalytics[]): Promise<string> => {
  // This will create data for the number of posts per day.
  const post_count: Record<string, Record<string, number>> = {};
  analytics.forEach(({posts, channel_name}) => {
    if (posts.length > 0) {
      post_count[channel_name] = {};
      posts.forEach(post => {
        const date = new Date(post.timestamp);
        const month = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        const date_string = `${month}/${day}/${year}`;
        post_count[channel_name][date_string] = 1 + (post_count[channel_name][date_string] ?? 0);
      });
    }
  });
  const post_count_param: Record<string, [string, number][]> = {};
  Object.keys(post_count).forEach(channel => {
    post_count_param[channel] = Object.keys(post_count[channel]).map(time => {
      return [time, post_count[channel][time]];
    });
  });
  const temp_timeline = tmp.fileSync({postfix: '.png', prefix: server_name + '.posts_per_day.'});
  await createTimeGraph(post_count_param, temp_timeline.name, "Posts per Day across Channels");
  return temp_timeline.name;
};


const createPieGraph = async (server_name: string, average_user_activities: Record<string, number>): Promise<string> => {
  const temp_png = tmp.fileSync({postfix: '.png', prefix: server_name + '.relative_engagement.'});
  await createPieChart(Object.keys(average_user_activities).map<[string, number]>(username => {
    return [username, average_user_activities[username]];
  }), temp_png.name, "Engagement");
  return temp_png.name;
};


const createJsonDump = async (
  server_name: string,
  analytics: ChannelAnalytics[],
  average_user_activities: Record<string, number>,
  best_user_activities: Record<string, {channel_id: string, channel_name: string, score: number}>
): Promise<string> => {
  // This will map all users to their activeness in different channels.
  const temp_json = tmp.fileSync({postfix: '.json', prefix: server_name});
  fs.writeFileSync(temp_json.name, JSON.stringify({
    server_name,
    number_of_text_channels: analytics.length,
    channels: analytics,
    best_user_activities,
    average_user_activities,
  }, undefined, 2));
  return temp_json.name;
};



/**
 * Handles the message response where the user wants to get analytics data about a server.
 * The data will be DM'd to the user as a JSON file.
 * @param msg
 */
export const handleAnalytics = async (msg: Message): Promise<void> => {
  const server_name = msg.guild?.name ?? "Server Unknown";
  const channels = msg.guild?.channels.cache;
  const wants = msg.content.match(/\b(timeline|engagement|nojson)\b/g);
  if (channels != null) {
    const analytics: ChannelAnalytics[] = [];
    for (const channel of channels) {
      const data = collectTextChannelAnalytics(msg.author, channel[0], channel[1]);
      if (data) analytics.push(data);
    }

    const files_to_send: string[] = [];
    const {average, best} = getUserActivities(analytics);
    if (!wants || !wants.includes("nojson"))
      files_to_send.push(await createJsonDump(server_name, analytics, average, best));
    if (wants && wants.includes("engagement"))
      files_to_send.push(await createPieGraph(server_name, average));
    if (wants && wants.includes("timeline"))
      files_to_send.push(await getTimeGraph(server_name, analytics));

    await msg.author.send(`
      Hello ${msg.author.username}!
      
      Here's some information about the server: ${msg.guild?.name}:
      `, {
      files: files_to_send
    });
  }
};
