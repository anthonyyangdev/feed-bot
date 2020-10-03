import { Message, Client } from "discord.js";
import { MessageModel } from "./MessageStorage";
import { formatDmMessage } from "./message/formatDmMessage";
import { User, UserModel } from "./collections/UserModel";
import PriorityQueue from 'js-priority-queue';

// creating priority queue 
export function createQueue(): PriorityQueue<[User, number]> {
  const compareUsers = function (a: [User, number], b: [User, number]) { return a[1] - b[1]; };
  let q = new PriorityQueue({ comparator: compareUsers });
  return q;
}

// adding a new user to priority queue 
export function addToQueue(q: PriorityQueue<[User, number]>, user: User) {
  const d = new Date();
  const newElement: [User, number] = [user, d.getTime() + user.period];
  q.queue(newElement);
};

function requeue(q: PriorityQueue<[User, number]>, user: User) {

}


// periodic check will call this function to update user's dms with new messages crossing the threshold
// function assumes that the user was already dequeued, its next period value was updated, and it was re-queued  
export async function sendMsgsWithReactions(user: User, client: Client, msg: Message) {
  const user_id = user.author_id;
  const user_discord = client.users.fetch(user_id);

  // TEMPORARY - hard coded to scan messages in last hour
  const d = new Date();
  const timestamp_thresh: number = d.getTime() - (1000 * 60 * 60);
  const messages = await MessageModel.find({ created_timestamp: { $gte: timestamp_thresh } }).exec();

  // //AFTER INTEGRATION WITH THOMAS CODE - scans messages between last update and now 
  // const timestamp_thresh : number = user.next_period - user.period;
  // const messages = await MessageModel.find({ created_timestamp: { $gte: timestamp_thresh } }).exec();

  // for each new message 
  for (const iteration of messages) {
    const m = await msg.channel.messages.fetch(iteration.message_id);
    const reactions = m.reactions.cache.array();

    // count number of unique reactions
    let userSet = new Set();
    for (let i = 0; i < reactions.length; i++) {
      const reaction = reactions[i];
      const users = reaction.users.cache.array();
      for (let j = 0; j < users.length; j++) {
        userSet.add(users[j].id);
      }
    }
    const numUniqueReactors = userSet.size;
    console.log("Message " + iteration.message_id.toString() + " has " + numUniqueReactors.toString() + " reactors")

    // if number of unique reactions crosses threshold, and message hasn't been sent to user before, send message to user
    if (numUniqueReactors >= user.reac_threshold && !iteration.users.includes(user_id)) {
      const message = await formatDmMessage(client, iteration.message_id, iteration.channel_id);
      client.users.fetch(user_id).then((user) => { user.send(message) });
      iteration.users.push(user_id);
    }
  }
} 
