import { container } from "@sapphire/framework";
import { RateLimitManager, RateLimit } from "@sapphire/ratelimits";
import type {
  CommandInteraction,
  Guild,
  GuildMember,
  Message,
} from "discord.js";
import type { treeNode } from "simple-text-tree";
import type { Topic } from "./Constants.js";
import { getSettings } from "./Settings.js";
import { isTopic } from "./Types.js";

async function hasAtLeastPermissionLevel(
  message: Message | CommandInteraction,
  level: number
): Promise<boolean> {
  const { permission } = await container.permLevels.run(message, level);
  return permission;
}

async function getTopic(guild: Guild, topic: string): Promise<string> {
  const data = await getSettings(guild, "topics");

  return (
    data.find((value) => value.value === topic)?.text ??
    `There was an error processing the topic for ${topic}`
  );
}

async function hasModRole(guild: Guild, member: GuildMember): Promise<boolean> {
  const modRoles = await getSettings(guild, "roles-mod");
  for (const id of member.roles.cache.keys()) {
    if (modRoles.includes(id)) return true;
  }
  return false;
}

async function getScamRatelimit(
  guild: Guild,
  userid: string
): Promise<RateLimit> {
  if (!container.rateLimits.has(guild.id))
    container.rateLimits.set(
      guild.id,
      new RateLimitManager(
        await getSettings(guild, "antiScam-scamLinksAllowed"),
        (await getSettings(guild, "antiScam-timePeriod")) * 1000
      )
    );

  return container.rateLimits.get(guild.id)!.acquire(userid);
}

function getBigrams(str: String) {
  const bigrams = new Set<String>();
  const { length } = str;
  for (let i = 0; i < length - 1; i++) {
    const bigram = str.slice(i, i + 2);
    bigrams.add(bigram);
  }
  return bigrams;
}

function intersect(set1: Set<String>, set2: Set<String>) {
  const intersection = new Set<String>();
  set1.forEach((value) => {
    if (set2.has(value)) {
      intersection.add(value);
    }
  });
  return intersection;
}

function diceCoefficient(str1: String, str2: String) {
  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);
  return (
    (2 * intersect(bigrams1, bigrams2).size) / (bigrams1.size + bigrams2.size)
  );
}

function formatTopic(input: string): Topic[] | null {
  let data;
  try {
    data = JSON.parse(input);
  } catch (ex) {
    console.error(ex);
    return null;
  }

  if (!Array.isArray(data)) {
    data = [data];
  }

  if (!isTopic(data)) {
    console.error(`Received data not in topic format`);
    return null;
  }

  for (let i = 0; i <= data.length - 1; i++) {
    data[i]!.name = data[i]!.name.replaceAll("\n", "");
    data[i]!.value = data[i]!.value.replaceAll("\n", "").toLowerCase();
  }

  return data;
}

function buildTopicTree(data: Topic[]): treeNode {
  const topicTree = data.map((value) => {
    return {
      text: `Name: ${value.name}`,
      children: [
        {
          text: `Value: ${value.value}`,
        },
        {
          text: `Text: ${value.text.replaceAll("\n", "\\n")}`,
        },
      ],
    };
  });

  return {
    text: "topics",
    children: topicTree,
  };
}

export {
  hasAtLeastPermissionLevel,
  hasModRole,
  getTopic,
  getScamRatelimit,
  formatTopic,
  buildTopicTree,
  diceCoefficient,
};
