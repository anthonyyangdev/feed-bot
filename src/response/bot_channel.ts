import {Message} from "discord.js";
import {UserModel} from "../collections/UserModel";
import {ChannelAnalytics, collectTextChannelAnalytics, UserAnalytics} from "../analytics/analytics";
import tmp from 'tmp';
import fs from 'fs';
import {arrayMax} from "../util/arrayMax";

/**
 * Executes commands that should run only when messaging in some channel in a server.
 * @param msg
 */
export const check_bot_channel_response = async (msg: Message): Promise<void> => {
  const channel_id = msg.channel.id;
  if (!channel_id) { return; }

  const author_id = msg.author.id;

  if (msg.content.startsWith("!get-analytics")) {
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

      const temp_json = tmp.fileSync({postfix: '.json'});
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
  }

  if (msg.content.trim() === "!remove-channel") {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      await msg.reply("You do not have any saved channels");
    } else {
      await UserModel.findOneAndUpdate({author_id}, {
        $pull: {
          channels: {
            channel_id,
            server_id: msg.guild?.id
          }
        }
      });
      await msg.reply("This channel has been removed your saved list of channels");
    }
  }

  if (msg.content.trim() === "!save-channel") {
    const user = await UserModel.findOne({author_id});
    if (user == null) {
      const doc = await UserModel.create({
        author_id,
        channels: [{
          channel_id,
          server_id: msg.guild?.id ?? ""
        }],
        period: 86400000,
        next_period: Date.now() + 86400000,
        keywords: [],
        reac_threshold: 3
      });
      await doc.save();
    } else {
      await UserModel.findOneAndUpdate({
        author_id
      }, {
        $addToSet: {
          channels: {
            channel_id,
            server_id: msg.guild?.id ?? ""
          }
        }
      });
    }
    await msg.reply("Saved this channel under your name.");
  }
};
