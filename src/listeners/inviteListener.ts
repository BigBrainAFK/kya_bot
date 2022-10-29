import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { DataResolver } from 'discord.js';
import fetch from 'node-fetch';
import { hasAtLeastPermissionLevel, getSettings } from '../util/utility.js';

type InviteResult = {
	hasLink: boolean,
	link: string | null
};

export class InviteListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			once: false,
			event: 'messageCreate'
		});
	}

	public async run(message: Message) {
		if (!message.guild) return;
		if (!await getSettings(message.guild, 'antiInvite') || await hasAtLeastPermissionLevel(message, 3)) return;

		const result = await this.containsInvite(message);
		if (result.hasLink) {
			message.delete().catch(() => console.log(`Could not delete invite message.`));
			message.client.emit('caseCreate', message, message.guild, message.client.user, message.member!.user, `Anti-Invite (${result.link})`, 'Deleted Message', '#ff8300');
			message.author.send('Invites are not permitted in this server').catch(() => console.log(`Could not send DM about invite URLs to \`${message.author.tag}\``));
		}
	}

	public async containsInvite(message: Message): Promise<InviteResult> {
		const discordGGRegex = /(?:(?:https?:\/\/)?(?:www\.)?(?:(?:discord|discordapp)\.(?:gg|com)\/(?:invite\/)?).+[a-zA-Z0-9])/gi;

		const URLRegex = /(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/gi;

		const messageDiscordGGLinks = message.content.match(discordGGRegex) || [];
		const messageLinks = message.content.match(URLRegex);

		if ((messageLinks === null || messageLinks.length <= 0) && (messageDiscordGGLinks === null || messageDiscordGGLinks.length <= 0)) {
			return {
				hasLink: false,
				link: null
			}
		}

		let messageHasDiscordGGLink = false;
		let targetLink = '';

		for (let link of messageLinks!) {
			if (!link.includes('http')) {
				link = `http://${link}`;
			}

			const response = await fetch(link).catch(() => {});

			if (response && response.url && discordGGRegex.test(response.url)) {
				messageDiscordGGLinks.push(response.url);
			}
		}

		if (messageDiscordGGLinks.length > 0) {
			for (const link of messageDiscordGGLinks) {
				console.log(`testing link ${link}`);
				if (/discord\.io\/[a-zA-Z0-9]+/.test(link.toLowerCase())) {
					messageHasDiscordGGLink = true;
					targetLink = link;
					break;
				}

				const code = DataResolver.resolveInviteCode(link);

				const invite = await message.client.fetchInvite(code)
					.catch(() => {});

				if (!invite) continue;

				console.log(`Checking guild id ${invite.guild!.id} with invite ${link}`);

				if (invite.guild!.id === message.guild!.id) continue;

				if ((await getSettings(message.guild!, 'antiInvite-whitelistedGuilds'))!
					.every((element) => element !== invite.guild!.id)) {
					messageHasDiscordGGLink = true;
					targetLink = link;
					break;
				}
			}
		}

		return {
			hasLink: messageHasDiscordGGLink,
			link: targetLink
		};
	}
};