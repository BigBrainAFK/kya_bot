import { SapphireClient } from "@sapphire/framework";
import { ClientOptions, Collection, CommandInteraction, Message, Permissions, TextChannel, ThreadChannel } from "discord.js";
import { hasModRole, getSettings } from "../util/utility.js";
import { DatabaseOptions, PostgresDatabase } from "./Database.js";
import { PermissionLevels } from "./PermissionLevels.js";
import type { RateLimitManager } from "./RateLimitManager.js";

export interface KyaClientOptions {
	databaseOptions: DatabaseOptions,
	permLevels?: PermissionLevels,
	rateLimits?: Collection<string, RateLimitManager>
}

export class KyaClient<Ready extends boolean = boolean> extends SapphireClient<Ready> {
	public override database: PostgresDatabase;
	public override permLevels: PermissionLevels;
	public override rateLimits: Collection<string, RateLimitManager>;

	constructor(options: ClientOptions) {
		super(options);

		this.database = new PostgresDatabase(this, options.databaseOptions);

		const { FLAGS } = Permissions;

		this.permLevels = options.permLevels ?? new PermissionLevels()
			.add(0)
			.add(3, { check: ({ guild, member, channel }: Message) => guild && (<TextChannel | ThreadChannel>channel).permissionsFor(member!.id)!.has(FLAGS.MANAGE_MESSAGES), fetch: true })
			.add(4, { check: ({ guild, member }: Message) => guild && member!.permissions.has(FLAGS.KICK_MEMBERS), fetch: true })
			.add(5, { check: ({ guild, member }: Message) => guild && member!.permissions.has(FLAGS.BAN_MEMBERS), fetch: true })
			.add(6, { check: async ({ guild, member }: Message) => guild && await hasModRole(guild, member!), fetch: true })
			.add(7, { check: ({ guild, member }: Message) => guild && member!.permissions.has([FLAGS.MANAGE_GUILD, FLAGS.ADMINISTRATOR]), fetch: true })
			.add(8, { check: (message: Message | CommandInteraction) => message.guild && message.type === 'APPLICATION_COMMAND' ? (<CommandInteraction>message).user.id === message.guild!.ownerId : (<Message>message).author.id === message.guild!.ownerId, fetch: true })
			.add(10, { check: async (message: Message | CommandInteraction) => (await getSettings(message.client, 'owners')).includes(message.type === 'APPLICATION_COMMAND' ? (<CommandInteraction>message).user.id : (<Message>message).author.id) });

		this.rateLimits = options.rateLimits ?? new Collection<string, RateLimitManager>();
	}
}

declare module '@sapphire/framework' {
	interface SapphireClientOptions extends KyaClientOptions {}
}

declare module 'discord.js' {
	interface Client {
		database: PostgresDatabase,
		permLevels: PermissionLevels,
		rateLimits: Collection<string, RateLimitManager>
	}
}
