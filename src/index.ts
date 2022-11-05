import * as dotenv from "dotenv";
dotenv.config();
import { topicGuildIds } from "./util/Constants.js";
import { KyaClient } from "./structures/KyaClient.js";

if (!topicGuildIds.length) throw Error("Specify topic guild ids");

const client = new KyaClient({
  defaultPrefix: "!",
  caseInsensitiveCommands: true,
  shards: "auto",
  intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "DIRECT_MESSAGES"],
  partials: ["CHANNEL"],
});

client.login(process.env.TOKEN);
