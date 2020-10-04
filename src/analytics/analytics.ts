import {GuildChannel, TextChannel, User} from "discord.js";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const keyword_extractor = require("keyword-extractor");

export type UserAnalytics = {
  username: string;
  id: string;
  activeness: number;
  posts: {
    id: string;
    timestamp: number;
    unique_reactions: number;
  }[];
};

export type ChannelAnalytics = {
  channel_type: string;
  channel_id: string;
  channel_name: string;
  created_date: number;
  users: UserAnalytics[];
  common_words: [string, number][];
  conversation_starters: [string, number][];
};

export function collectTextChannelAnalytics(
  requesting_user: User,
  channel_name: string,
  channel: GuildChannel
): ChannelAnalytics | null {
  if (channel.type !== "text") return null;

  console.log("Getting analysis");
  const users_on_channel: Record<string, UserAnalytics> = {};
  channel.members.forEach(member => {
    if (member.user.bot) return;

    users_on_channel[member.user.id] = {
      username: member.user.username,
      id: member.user.id,
      activeness: 0,
      posts: []
    };
  });

  const word_frequency: Record<string, number> = {};
  (channel as TextChannel).messages.cache.forEach(m => {
    if (m.author.bot) return;

    const post_user = users_on_channel[m.author.id];
    if (post_user != null) {
      post_user.activeness += 1;
    }
    const extraction_result: string[] = keyword_extractor.extract(m.content, {
      language:"english",
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: false
    });
    extraction_result.forEach(word => {
      word_frequency[word] = (word_frequency[word] ?? 0) + 1;
    });
    // This will repeat users who've reacted.
    const unique_reactors: Record<string, true> = {};
    m.reactions.cache.forEach(r => {
      r.users.cache.forEach(u => {
        const reaction_user = users_on_channel[u.id];
        if (reaction_user != null) {
          reaction_user.activeness += 0.5;
          post_user.activeness += 0.5;
          unique_reactors[reaction_user.id] = true;
        }
      });
    });
    post_user.posts.push({
      id: m.id,
      timestamp: m.createdTimestamp,
      unique_reactions: Object.keys(unique_reactors).length,
    });
  });

  const user_data_array = Object.keys(users_on_channel).map(k => users_on_channel[k]);
  return {
    channel_type: "text",
    channel_id: channel.id,
    channel_name: channel.name,
    common_words: Object.keys(word_frequency)
      .map<[string, number]>(word => [word, word_frequency[word]])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30),
    created_date: channel.createdTimestamp,
    users: user_data_array,
    conversation_starters: user_data_array.map<[string, number]>(user => {
      const number_of_posts = user.posts.length;
      const average_recognition =
        number_of_posts === 0
          ? 0
          : user.posts.reduce((p, c) => p + c.unique_reactions, 0) / number_of_posts;
      return [user.username, number_of_posts + average_recognition];
    }).sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  };
}
