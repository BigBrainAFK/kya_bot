import * as dotenv from 'dotenv';
dotenv.config();

import { KyaClient } from './structures/KyaClient.js';

const client = new KyaClient({
	databaseOptions: {
		host: process.env.HOST ?? '',
		database: process.env.DATABSE ?? '',
		username: process.env.USERNAME ?? '',
		password: process.env.PASSWORD ?? ''
	},
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

client.login(process.env.TOKEN);
