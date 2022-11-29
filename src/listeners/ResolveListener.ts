import { Listener } from "@sapphire/framework";
import { ChannelType, ThreadChannel } from "discord.js";

export class ResolveListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: false,
      event: "threadUpdate",
    });
  }

  public async run(_: ThreadChannel, newThread: ThreadChannel) {
    if (newThread.parentId === null) return;

    await newThread.guild.channels.fetch(newThread.parentId);

    if (newThread.parent === null) return;

    if (newThread.parent.type === ChannelType.GuildForum) {
      for (const tagId of newThread.appliedTags) {
        const tag = newThread.parent.availableTags.find(
          (el) => el.id === tagId
        );

        if (tag === undefined) continue;

        if (tag.name === "Resolved") {
          if (!newThread.archived) {
            newThread.setArchived(true, "Flagged as resolved");
          } else {
            newThread.edit({
              appliedTags: newThread.appliedTags.filter((t) => t !== tagId),
            });
          }
        }
      }
    }
  }
}
