import {Client, Message, TextChannel, User} from "discord.js";
import {MessageModel} from "./collections/MessageStorage";
import {formatDmMessage} from "./message/formatDmMessage";
import {UserDoc, UserModel} from "./collections/UserModel";
import PriorityQueue from 'js-priority-queue';

const compareUsers = function (a: [UserDoc, number], b: [UserDoc, number]) { return a[1] - b[1]; };
const q = new PriorityQueue({ comparator: compareUsers });

/**
 * Adds a user to the priority queue.
 * @param user
 */
export function addToQueue(user: UserDoc): void {
  const newElement: [UserDoc, number] = [user, user.next_period];
  q.queue(newElement);
}

export function checkUserUpdateEachMinute(client: Client): void {
  setInterval(() => checkUserUpdates(client), 1000);
}

async function checkUserUpdates(client: Client) {
  while (q.length > 0 && q.peek()[1] < Date.now()) {
    const [user, old_period] = q.dequeue();
    await updateUser(user, old_period, client);
  }
}

async function updateUser(user: UserDoc, old_period: number, client: Client) {
  //dequeue and requeue user
  user.next_period = old_period + user.period;
  const updatedUser = await UserModel.findOneAndUpdate({author_id: user.author_id}, {
    $set: {
      next_period: user.next_period
    }
  });
  if (updatedUser) {
    addToQueue(updatedUser);
    // update user with messages that have new reactions
    await sendMsgsWithReactions(updatedUser, client);
  }
}

function containsKeywords(content: string, keywords: string[]): boolean {
  return keywords.some(k => content.includes(k));
}

/**
 * Sends the content of [msg] to the [user] in a DM.
 * @param client
 * @param msg
 * @param user
 */
async function sendMessage(client: Client, msg: Message, user: User) {
  const message = await formatDmMessage(client, msg.id, msg.channel.id);
  if (message != null) {
    await user.send(message);
  }
  const message_id = msg.id;
  await MessageModel.findOneAndUpdate({
    message_id
  }, {
    $addToSet: {
      users: user.id
    }
  });
}


/**
 * Sends user new relevant messages from the subscribed channels in their DMs.
 * Relevant messages are popular, mention the user, or include keywords specified by the user.
 * @param user A user whose next_period value was already updated.
 * @param client Discord bot client.
 */
async function sendMsgsWithReactions(user: UserDoc, client: Client) {
  const author_id = user.author_id;
  const user_discord = await client.users.fetch(author_id);
  const user_database = await UserModel.findOne({ author_id });

  // Earliest period where we check messages.
  // Longer than the notification period in case a message becomes popular.
  const timestamp_threshold: number = Date.now() - (1000 * 60 * 60 * 24);

  const channelArray: string[] = [];
  const serverArray: string[] = [];
  if (user_database != null) {
    user_database.channels.forEach(c => {
      channelArray.push(c.channel_id);
      serverArray.push(c.server_id);
    });
  }

  const messages = await MessageModel.find(
    {
      'channel.channel_id': {
        $in: channelArray
      },
      'channel.server_id': {
        $in: serverArray
      },
      created_timestamp: {
        $gte: timestamp_threshold
      }
    });

  // for each new message
  for (const msg of messages) {
    if (msg.users.includes(author_id)) continue;

    const channel = await client.channels.fetch(msg.channel.channel_id);
    if (channel.type != "text") continue;

    const m = await (channel as TextChannel).messages.cache.get(msg.message_id);
    if (m == undefined) continue;

    const reactions = m.reactions.cache.array();
    // count number of unique reactions
    const userSet = new Set<string>();
    for (let i = 0; i < reactions.length; i++) {
      const reaction = reactions[i];
      const users = reaction.users.cache.array();
      for (let j = 0; j < users.length; j++) {
        userSet.add(users[j].id);
      }
    }
    const numUniqueReactors = userSet.size;

    // if message contains a keyword and if number of unique reactions crosses threshold,
    // and message hasn't been sent to user before, send message to user.
    if (numUniqueReactors >= user.reac_threshold || containsKeywords(m.content, user.keywords)) {
      await sendMessage(client, m, user_discord);
    } // Checks if the message mentions the user.
    else if (m.mentions.users.some(user => user.id === author_id)) {
      await sendMessage(client, m, user_discord);
    }
    else if (m.guild != null) {
      const userGuildMem = m.guild.members.cache.get(author_id);
      if (userGuildMem != undefined && m.mentions.roles.some(r => {
        return userGuildMem.roles.cache.get(r.id) != null;
      })) {
        await sendMessage(client, m, user_discord);
      }
    }
  }
}
