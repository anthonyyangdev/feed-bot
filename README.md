# Discord FeedBuddy

## Description
This is a Discord bot that helps organizers and community members will engage in their servers. The bot curates the content you want from specified channels in a server. On servers that have added this bot, users can save specific channels under their profile. Then, the bot periodically sends those users content/messages tailored to them. For example: popular messages from those channels, messages that include the user's name/role, or messages that contain keywords that each user had chosen. Additionally, users may call the bot to generate analytic reports about the engagement in the current server.

## Commands

Commands are run on the server or in the DM with the bot. Some commands can only be run specifically in a channel or in the DM.

### DM-Only

These commands can only be run when in a DM with the bot. They include most of the settings command, such as adding/removing keywords or setting the period that the bot sends messages.

| Command                        | Description                                                                                                                                           |
|--------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| !add-keywords [...keywords]    | Add keywords onto the user's profile for the bot to use when curating content. Multi-word phrases can be added by using double-quotation marks.       |
| !remove-keywords [...keywords] | Removes keywords from the user's profile. Multi-word phrases can be added by using double-quotation marks.                                            |
| !show-keywords                 | Show all keywords on the user's profile.                                                                                                              |
| !set-period [amount] [unit]    | Sets the time period that the user receives content from the bot. The [amount] can be any positive integer. The [unit] can be: hour, hours, day, days |
| !show-period                   | Shows the time period that the user receives content from the bot.                                                                                    |
| !end-feed                      | Drops the users profile information from the bot.                                                                                                     |

### Channel-Only

These commands can only be run when in a channel with the bot.


| Command                     | Description                                                                                                                                                                                                                                      |
|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| !save-channel               | Adds the current channel where this command was executed onto the user's profile. The bot will use this channel when curating content for the user.                                                                                              |
| !remove-channel             | Removes the current channel where this command was executed from the user's profile.                                                                                                                                                             |
| !my-channels                | Shows all channels added by the user.                                                                                                                                                                                                            |
| !get-analytics [...options] | The bot will generate an analysis report about the server where the command was run. The report will be sent to the user's DM with the bot. Options are added to generate more tailored reports. Accepted Options: timeline, engagement, nojson. |



### Analysis

The following describes the options that can be used with `!get-analytics`:

- timeline: Sends a png photo of a line graph that compares the number of posts per day across all channels in the server.

- engagement: Sends a png photo a pie chart that compares users' relative engagement on the server. Engagement is based on the number of posts, how well-received those posts are, and how often user's react to the posts of others.

- nojson: Does not send the JSON file that contains server information to the user. By default, the JSON is sent.


## For Developers

### Setup

- Clone the repository
```shell script
git clone https://github.com/ayang4114/discord_bot_curator.git
```

- Install Node.js and npm from their installation pages.

- Install MongoDB from its installation page.

- Install an IDE/Editor that supports Node.js/Typescript development, e.g. VSCode or Webstorm.

- Open the project directory in your IDE/Editor.

- In the project directory, execute the following to install all project dependencies:

```shell script
npm install
```

### Running the Project

Source files are located in the `src` directory. Test files are located in the `test` directory, named as `*.test.ts`.

```shell script
# Build project, i.e. TypeScript -> JavaScript
npm run build

# Run project on watch mode
npm run dev

# Run tests
npm test

# Clean compiled JavaScript files
npm run clean
```


## License

ISC © 
