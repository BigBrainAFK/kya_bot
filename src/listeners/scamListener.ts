import { Listener } from "@sapphire/framework";
import type { Message } from "discord.js";
import { getSettings } from "../util/Settings.js";
import {
  getScamRatelimit,
  diceCoefficient,
  hasAtLeastPermissionLevel,
} from "../util/Utility.js";

export class InviteListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: false,
      event: "messageCreate",
    });
  }

  public async run(message: Message) {
    if (!message.guild) return;
    if (
      !(await getSettings(message.guild, "antiScam")) ||
      !(await hasAtLeastPermissionLevel(message, 3))
    )
      return;

    const result = await this.containsScamURL(message);
    if (result.hasScam) {
      message
        .delete()
        .catch(() =>
          message.client.logger.error(`Could not delete scam message.`)
        );
      message.client.emit(
        "caseCreate",
        message,
        message.guild,
        message.client.user,
        message.author,
        `Anti-Scam (${result.scamURL})`,
        "Deleted Message",
        "#ff8300"
      );
      message.author
        .send("Scam URLs are not permitted in this server")
        .catch(() =>
          message.client.logger.error(
            `Could not send DM about scam URLs to \`${message.author.tag}\``
          )
        );

      const ratelimit = await getScamRatelimit(
        message.guild,
        message.author.id
      ); //reimplement ratelimit for scam

      if (ratelimit.limited) {
        message.member!.ban({ days: 7, reason: "Scam Link Spam" });
        message.client.emit(
          "caseCreate",
          message,
          message.guild,
          message.client.user,
          message.author,
          `Anti-Scam RateLimit Exceeded`,
          "Banned",
          "#ff1900"
        );
      }

      ratelimit.consume();
    }
  }

  public async containsScamURL(message: Message) {
    let messageHasScamURL = false;
    let targetScamURL = "";

    const URLRegex =
      /(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/gi;

    const messageLinks = message.content.match(URLRegex);

    if (!messageLinks || !messageLinks.length) {
      return {
        hasScam: messageHasScamURL,
        scamURL: "",
      };
    }

    main: for (const url of messageLinks) {
      for (const link of await getSettings(
        message.guild!,
        "antiScam-guardedURLs"
      )) {
        const domainRegex = /((?:[-\w]{0,61})*?(?:\.\w{2,4}){1,2})\b/im;

        const match = url.match(domainRegex);

        if (match === null || match.length < 1) continue;

        const hit = match[1]!.toLowerCase();

        const coefficient = diceCoefficient(link, hit);

        if (
          coefficient >
            (await getSettings(message.guild!, "antiScam-urlLowerBound")) &&
          coefficient < 1
        ) {
          messageHasScamURL = true;
          targetScamURL = url;
        }

        if (coefficient >= 1) {
          messageHasScamURL = false;
          targetScamURL = "";
          continue main;
        }
      }
    }

    return {
      hasScam: messageHasScamURL,
      scamURL: targetScamURL,
    };
  }
}
