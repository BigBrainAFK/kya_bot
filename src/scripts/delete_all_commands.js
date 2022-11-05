import * as dotenv from "dotenv";
dotenv.config();
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

const token = process.env.TOKEN;
const clientId = "";
const guildId = "";

const rest = new REST({ version: "10" }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
  .then(() => console.log("Successfully deleted all guild commands."))
  .catch(console.error);

// for global commands
rest
  .put(Routes.applicationCommands(clientId), { body: [] })
  .then(() => console.log("Successfully deleted all application commands."))
  .catch(console.error);
