import {Message, Client, TextChannel} from "discord.js";
import {MessageModel} from "./MessageStorage";
import {formatDmMessage} from "./message/formatDmMessage";
import {User, UserModel} from "./collections/UserModel";
import PriorityQueue from 'js-priority-queue';
import {ChannelBody} from './collections/ChannelBody'

// creating priority queue 
export function createQueue () : PriorityQueue<[User, number]> {
    const compareUsers = function(a : [User, number], b : [User, number]) { return a[1] - b[1]; };
    let q = new PriorityQueue({ comparator: compareUsers });
    return q;
}

// adding a new user to priority queue 
export function addToQueue (q : PriorityQueue<[User, number]>, user : User) {
    const d = new Date();
    const newElement : [User, number] = [user, d.getTime() + user.period];
    q.queue(newElement);
};

function updateUser (q : PriorityQueue<[User, number]>, user : User, client : Client) {
    //dequeue and requeue user
    let dequeued_item = q.dequeue();
    let dequeued_user = dequeued_item[0];
    const old_period = dequeued_item[1];
    const new_number = old_period + dequeued_user.period;
    dequeued_user.next_period = new_number;
    addToQueue(q, dequeued_user);

    // update user with messages that have new reactions
    sendMsgsWithReactions(dequeued_user, client);
}

  
// periodic check will call this function to update user's dms with new messages crossing the threshold
// function assumes that the user was already dequeued, its next period value was updated, and it was re-queued  
async function sendMsgsWithReactions (user : User, client : Client) {
    const user_id = user.author_id;
    const user_discord = client.users.fetch(user_id);

    // CAN CHANGE - hard coded to scan messages in last hour
    const d = new Date();
    const timestamp_thresh : number = d.getTime() - (1000 * 60 * 60);
    const messages = await MessageModel.find({created_timestamp: {$gte: timestamp_thresh}}).exec();

    // for each new message 
    for (const iteration of messages) {
        const channel = await client.channels.fetch(iteration.channel.channel_id);
        if (channel.type != "text") {
            console.log('Error finding text channel in sendMsgsWithReactions');
            continue
        }
        const m  = await (channel as TextChannel).messages.cache.get(iteration.message_id);
        if (m == undefined) {
            console.log('Error finding message in sendMsgsWithReactions');
            continue
        }
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
            const message = await formatDmMessage(client, iteration.message_id, iteration.channel.channel_id);
            (await user_discord).send(message);
            iteration.users.push(user_id);
        }
    }
} 


export function checkUserUpdateEachMinute() {
    setInterval(checkUserUpdates, 1000);
  }
  
  async function checkUserUpdates(q: PriorityQueue<[User, number]>, client: Client) {
    console.log("Starting check...");
    let user = q.peek();
    while (user[1] < new Date().getTime()) {
      updateUser(q, user[0], client);
    }
    console.log("Done checking");
}