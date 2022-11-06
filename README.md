# Kya Bot

### Description

This is a re-imagination and second rewrite of the WootBot (internally called Katara Bot).
This was written on the basis of PostgreSQL, SapphireJS, DiscordJS and TypeScript.

### Initial Setup

#### Requirements

- NodeJS 19.X

#### Setup the `.env` file

1. Copy the `example.env` (or rename directly to `.env`)
2. If copied rename the copy to `.env`
3. Insert all values except `DB_URL` which you shouldnt touch
4. Save all changes

#### Delete all commands if necessary

If you have remaining commands on the bot account you wanna use you can remove them by following the next few steps.

1. Edit `src/scripts/delete_all_commands.js` and insert your Bots `clientId` and the `guildId` belonging to the guild that gets the `topic` command
2. Execute the script by running `node src/scripts/delete_all_commands.js`
3. It should run without errors
4. Remove the `clientId` and `guildId` from `src/scripts/delete_all_commands.js` to prevent accidental clearing of commands

#### First run

1. Add a guild or multiple to `topicGuildIds` in `src/util/Constants.ts`
2. Run the following command after saving the changes from the previous step
   `npm i && npx prisma generate && npx prisma migrate deploy && npm start`
3. Note the `idHints` from the console output and copy them with the `""` into the corresponding fields in `src/util/Constants.ts` near `topicGuildIds`

### Credits

- [DiscordJS](https://github.com/discordjs) Team for the great Discord framework
- [SapphireJS](https://github.com/sapphiredev) Team for the great bot framework
- All [PostgreSQL](https://www.postgresql.org) maintainers
