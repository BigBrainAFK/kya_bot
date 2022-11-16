import { Command } from "@sapphire/framework";
import { ChannelType } from "discord.js";
import {
  channelIdHints,
  commandIdHints,
  topicGuildIds,
} from "../util/Constants.js";

export class CleanupCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      requiredUserPermissions: ["BanMembers"],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => {
        builder
          .setName("cleanup")
          .setDescription("Cleans the support channel resolved threads");
      },
      { guildIds: topicGuildIds, idHints: commandIdHints.cleanup }
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    if (!interaction.guild)
      return await interaction.reply({
        content: "Can only run this inside a guild",
      });

    interaction.deferReply({
      ephemeral: true,
    });

    const supportChannel = await interaction.guild.channels.fetch(
      channelIdHints.support
    );

    if (
      supportChannel === null ||
      supportChannel.type !== ChannelType.GuildForum
    )
      return interaction.editReply("Configured channel is not a forum");

    await supportChannel.threads.fetch();

    for (const thread of supportChannel.threads.cache.values()) {
      for (const tagId of thread.appliedTags) {
        const tag = supportChannel.availableTags.find((el) => el.id === tagId);

        if (tag === undefined) continue;

        if (tag.name === "Resolved") {
          thread.setLocked(true, "Flagged as resolved");
        }
      }
    }

    return interaction.editReply("Done!");
  }
}
