import { container, SapphireClient } from "@sapphire/framework";
import type { RateLimitManager } from "@sapphire/ratelimits";
import {
  ClientOptions,
  Collection,
  CommandInteraction,
  Message,
  TextChannel,
  ThreadChannel,
  InteractionType,
  PermissionFlagsBits,
} from "discord.js";
import { getSettings } from "../util/Settings.js";
import { hasModRole } from "../util/Utility.js";
import { PermissionLevels } from "./PermissionLevels.js";

export class KyaClient extends SapphireClient {
  constructor(options: ClientOptions) {
    super(options);
  }

  public override async login(token?: string) {
    container.rateLimits = new Collection<string, RateLimitManager>();

    container.permLevels = new PermissionLevels()
      .add(0)
      .add(3, {
        check: ({ guild, member, channel }: Message) =>
          guild &&
          (<TextChannel | ThreadChannel>channel)
            .permissionsFor(member!.id)!
            .has(PermissionFlagsBits.ManageMessages),
        fetch: true,
      })
      .add(4, {
        check: ({ guild, member }: Message) =>
          guild && member!.permissions.has(PermissionFlagsBits.KickMembers),
        fetch: true,
      })
      .add(5, {
        check: ({ guild, member }: Message) =>
          guild && member!.permissions.has(PermissionFlagsBits.BanMembers),
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
          member!.permissions.has([
            PermissionFlagsBits.ManageGuild,
            PermissionFlagsBits.Administrator,
          ]),
        fetch: true,
      })
      .add(8, {
        check: (message: Message | CommandInteraction) =>
          message.guild && message.type === InteractionType.ApplicationCommand
            ? message.user.id === message.guild!.ownerId
            : (message as Message).author.id === message.guild!.ownerId,
        fetch: true,
      })
      .add(10, {
        check: async (message: Message | CommandInteraction) =>
          (await getSettings(message.client, "owners")).includes(
            message.type === InteractionType.ApplicationCommand
              ? message.user.id
              : message.author.id
          ),
      });
    return super.login(token);
  }
}

// Use module augmentation to adjust container DI to keep our Data aswell
declare module "@sapphire/pieces" {
  interface Container {
    rateLimits: Collection<string, RateLimitManager>;
    permLevels: PermissionLevels;
  }
}
