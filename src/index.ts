import * as dotenv from "dotenv";
dotenv.config();
import { topicGuildIds } from "./util/Constants.js";
import { KyaClient } from "./structures/KyaClient.js";
import { GatewayIntentBits, Partials } from "discord.js";

if (!topicGuildIds.length) throw Error("Specify topic guild ids");

const client = new KyaClient({
  defaultPrefix: "!",
  caseInsensitiveCommands: true,
  shards: "auto",
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

client.login(process.env.TOKEN);
