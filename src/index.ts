import * as dotenv from 'dotenv';
dotenv.config();

import { SapphireClient } from '@sapphire/framework';
import { Collection, Message, TextChannel, ThreadChannel, Permissions, CommandInteraction } from 'discord.js';
import { PermissionLevels } from './structures/PermissionLevels.js';
import type { RateLimitManager } from './structures/RateLimitManager.js';
import { getSettings, hasModRole } from './util/utility.js';
import { PostgresDatabase } from './structures/Database.js';

const { FLAGS } = Permissions;

const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	shards: 'auto',
	intents: [
		'GUILDS',
		'GUILD_MEMBERS',
		'GUILD_MESSAGES',
		'DIRECT_MESSAGES'
	],
	partials: [
		'CHANNEL'
	]
});

declare global {
	var rateLimits: Collection<String, RateLimitManager>;
	var permLevels: PermissionLevels;
	var db: PostgresDatabase;
}

global.rateLimits = new Collection<String, RateLimitManager>;

global.permLevels = new PermissionLevels()
	.add(0)
	.add(3, { check: ({ guild, member, channel }: Message) => guild && (<TextChannel | ThreadChannel>channel).permissionsFor(member!.id)!.has(FLAGS.MANAGE_MESSAGES), fetch: true })
	.add(4, { check: ({ guild, member }: Message) => guild && member!.permissions.has(FLAGS.KICK_MEMBERS), fetch: true })
	.add(5, { check: ({ guild, member }: Message) => guild && member!.permissions.has(FLAGS.BAN_MEMBERS), fetch: true })
	.add(6, { check: async ({ guild, member }: Message) => guild && await hasModRole(guild, member!), fetch: true })
	.add(7, { check: ({ guild, member }: Message) => guild && member!.permissions.has([FLAGS.MANAGE_GUILD, FLAGS.ADMINISTRATOR]), fetch: true })
	.add(8, { check: (message: Message | CommandInteraction) => message.guild && message.type === 'APPLICATION_COMMAND' ? (<CommandInteraction>message).user.id === message.guild!.ownerId : (<Message>message).author.id === message.guild!.ownerId, fetch: true })
	.add(10, { check: async (message: Message | CommandInteraction) => (await getSettings(client, 'owners')).includes(message.type === 'APPLICATION_COMMAND' ? (<CommandInteraction>message).user.id : (<Message>message).author.id) });

global.db = new PostgresDatabase({
	host: process.env.HOST ?? '',
	database: process.env.DATABSE ?? '',
	username: process.env.USERNAME ?? '',
	password: process.env.PASSWORD ?? ''
});

client.login(process.env.TOKEN);
