import { container, SapphireClient } from "@sapphire/framework";
import type { RateLimitManager } from "@sapphire/ratelimits";
import {
  ClientOptions,
  Collection,
  CommandInteraction,
  Message,
  TextChannel,
  ThreadChannel,
  Permissions,
} from "discord.js";
import { getSettings } from "../util/Settings.js";
import { hasModRole } from "../util/Utility.js";
import { PostgresDatabase } from "./Database.js";
import { PermissionLevels } from "./PermissionLevels.js";

export class KyaClient extends SapphireClient {
  constructor(options: ClientOptions) {
    super(options);
  }

  public override async login(token?: string) {
    container.database = new PostgresDatabase(this);
    container.rateLimits = new Collection<string, RateLimitManager>();

    const { FLAGS } = Permissions;
    container.permLevels = new PermissionLevels()
      .add(0)
      .add(3, {
        check: ({ guild, member, channel }: Message) =>
          guild &&
          (<TextChannel | ThreadChannel>channel)
            .permissionsFor(member!.id)!
            .has(FLAGS.MANAGE_MESSAGES),
        fetch: true,
      })
      .add(4, {
        check: ({ guild, member }: Message) =>
          guild && member!.permissions.has(FLAGS.KICK_MEMBERS),
        fetch: true,
      })
      .add(5, {
        check: ({ guild, member }: Message) =>
          guild && member!.permissions.has(FLAGS.BAN_MEMBERS),
        fetch: true,
      })
      .add(6, {
        check: async ({ guild, member }: Message) =>
          guild && (await hasModRole(guild, member!)),
        fetch: true,
      })
      .add(7, {
        check: ({ guild, member }: Message) =>
          guild &&
          member!.permissions.has([FLAGS.MANAGE_GUILD, FLAGS.ADMINISTRATOR]),
        fetch: true,
      })
      .add(8, {
        check: (message: Message | CommandInteraction) =>
          message.guild && message.type === "APPLICATION_COMMAND"
            ? (<CommandInteraction>message).user.id === message.guild!.ownerId
            : (<Message>message).author.id === message.guild!.ownerId,
        fetch: true,
      })
      .add(10, {
        check: async (message: Message | CommandInteraction) =>
          (await getSettings(message.client, "owners")).includes(
            message.type === "APPLICATION_COMMAND"
              ? (<CommandInteraction>message).user.id
              : (<Message>message).author.id
          ),
      });
    return super.login(token);
  }
}

declare module "@sapphire/pieces" {
  interface Container {
    database: PostgresDatabase;
    rateLimits: Collection<string, RateLimitManager>;
    permLevels: PermissionLevels;
  }
}
