import { Guild, Team } from "discord.js";
import { KyaClient } from "../structures/KyaClient.js";
import {
  SettingsOptionsStringArray,
  SettingsOptionBoolean,
  SettingsOptionNumber,
  SettingsOptionTopic,
  Topic,
  ActionOptions,
  UpdateData,
  initialTopics,
} from "./Constants.js";
import { isStringArray, isTopic } from "./Types.js";
import Database from "../structures/Database.js";
import type { guilds } from "@prisma/client";

async function getSettings(
  instance: KyaClient,
  setting: "owners"
): Promise<string[]>;
async function getSettings(
  instance: Guild,
  setting: SettingsOptionsStringArray
): Promise<string[]>;
async function getSettings(
  instance: Guild,
  setting: SettingsOptionBoolean
): Promise<boolean>;
async function getSettings(
  instance: Guild,
  setting: SettingsOptionNumber
): Promise<number>;
async function getSettings(
  instance: Guild,
  setting: SettingsOptionTopic
): Promise<Topic[]>;
async function getSettings(
  instance: Guild | KyaClient,
  setting: string
): Promise<any> {
  if (instance instanceof KyaClient) {
    await instance.application!.fetch();
    if (instance.application!.owner instanceof Team) {
      return instance.application!.owner.members.map((val) => val.id);
    }
    return [instance.application!.owner!.id];
  }

  if (instance instanceof Guild) {
    const entry = await getGuildSettings(instance);

    setting = setting.replace("-", "_");

    return { ...entry }[setting];
  }
}

async function updateSettings(
  guild: Guild,
  setting: SettingsOptionsStringArray,
  data: string[],
  action: ActionOptions
): Promise<UpdateData>;
async function updateSettings(
  guild: Guild,
  setting: SettingsOptionTopic,
  data: Topic[],
  action: ActionOptions | "replace"
): Promise<UpdateData>;
async function updateSettings(
  guild: Guild,
  setting: SettingsOptionBoolean,
  data: boolean,
  action: "replace"
): Promise<UpdateData>;
async function updateSettings(
  guild: Guild,
  setting: SettingsOptionNumber,
  data: number,
  action: "replace"
): Promise<UpdateData>;
async function updateSettings(
  guild: Guild,
  setting: string,
  data: any,
  action: ActionOptions
): Promise<UpdateData> {
  const entry = await getGuildSettings(guild);

  setting = setting.replace("-", "_");

  let result = true;
  let error = "";
  const catchFunc = (reason: string) => {
    error = reason;
    result = false;
  };

  switch (action) {
    case "add":
      if (isTopic(data)) {
        addTopicLoop: for (const single of data) {
          await Database.topics
            .create({
              data: {
                name: single.name,
                value: single.value,
                text: single.text,
                guild: {
                  connect: {
                    id: guild.id,
                  },
                },
              },
              include: { guild: true },
            })
            .catch(catchFunc);

          if (!result) break addTopicLoop;
        }
      } else if (isStringArray(data)) {
        await Database.guilds
          .update({
            where: {
              id: guild.id,
            },
            data: {
              [setting]: ({ ...entry }[setting] as string[]).concat(data),
            },
          })
          .catch(catchFunc);
      }
      break;
    case "remove":
      if (isTopic(data)) {
        removeTopicLoop: for (const single of data) {
          await Database.topics
            .delete({
              where: {
                guildId_value: {
                  guildId: guild.id,
                  value: single.value,
                },
              },
            })
            .catch(catchFunc);

          if (!result) break removeTopicLoop;
        }
      } else if (isStringArray(data)) {
        await Database.guilds
          .update({
            where: {
              id: guild.id,
            },
            data: {
              [setting]: ({ ...entry }[setting] as string[]).filter(
                (value) => !data.includes(value)
              ),
            },
          })
          .catch(catchFunc);
      }
      break;
    case "replace":
      if (isTopic(data)) {
        replaceTopicLoop: for (const single of data) {
          await Database.topics
            .update({
              where: {
                guildId_value: {
                  guildId: guild.id,
                  value: single.value,
                },
              },
              data: single,
            })
            .catch(catchFunc);

          if (!result) break replaceTopicLoop;
        }
      } else {
        await Database.guilds
          .update({
            where: {
              id: guild.id,
            },
            data: {
              [setting]: data,
            },
          })
          .catch(catchFunc);
      }
      break;
  }

  return { result, error };
}

async function getGuildSettings(guild: Guild): Promise<guilds> {
  const retrievedGuild = await Database.guilds.findUnique({
    where: { id: guild.id },
    include: { topics: true },
  });

  if (retrievedGuild === null) {
    return await Database.guilds.create({
      data: {
        id: guild.id,
        topics: {
          createMany: {
            data: initialTopics,
          },
        },
      },
    });
  }

  return retrievedGuild;
}

export { getSettings, updateSettings };
