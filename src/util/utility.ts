import { SapphireClient } from '@sapphire/framework';
import { Message, Guild, GuildMember, CommandInteraction, Team } from 'discord.js';
import type { treeNode } from 'simple-text-tree';
import { RateLimit, RateLimitManager } from '../structures/RateLimitManager.js';
import type { ActionOptions, SettingsOptionsStringArray, SettingsOptionBoolean,
	SettingsOptionNumber, UpdateData, SettingsOptionTopic, Topic } from './constants.js';

async function hasAtLeastPermissionLevel(message: Message | CommandInteraction, level: number): Promise<boolean> {
	const { permission } = await global.permLevels.run(message, level);
	return permission;
};

async function getSettings(instance: SapphireClient, setting: 'owners'): Promise<string[]>;
async function getSettings(instance: Guild, setting: SettingsOptionsStringArray): Promise<string[]>;
async function getSettings(instance: Guild, setting: SettingsOptionBoolean): Promise<boolean>;
async function getSettings(instance: Guild, setting: SettingsOptionNumber): Promise<number>;
async function getSettings(instance: Guild, setting: SettingsOptionTopic): Promise<Topic[]>;
async function getSettings(instance: Guild | SapphireClient, setting: any): Promise<any> {
	if (instance instanceof SapphireClient) {
		await instance.application!.fetch();
		if (instance.application!.owner instanceof Team) {
			return instance.application!.owner.members.map((val) => val.id);
		}
		return [instance.application!.owner!.id]
	}

	if (instance instanceof Guild) {
		const entry = await global.db.guilds.findByPk(instance.id, { include: [{ association: 'topics' }] });

		if (!entry) {
			await global.db.createGuild(instance);
			return await getSettings(instance, setting);
		}
		
		if (entry) return entry[setting as keyof typeof entry];
	}
}

async function updateSettings(guild: Guild, setting: SettingsOptionsStringArray, data: string[], action: ActionOptions): Promise<UpdateData>
async function updateSettings(guild: Guild, setting: SettingsOptionTopic, data: Topic[], action: ActionOptions | 'replace'): Promise<UpdateData>
async function updateSettings(guild: Guild, setting: SettingsOptionBoolean, data: boolean, action: 'replace'): Promise<UpdateData>
async function updateSettings(guild: Guild, setting: SettingsOptionNumber, data: number, action: 'replace'): Promise<UpdateData>
async function updateSettings(guild: Guild, setting: any, data: any, action: ActionOptions): Promise<UpdateData> {
	const entry = await global.db.guilds.findByPk(guild.id, { include: [{ association: 'topics' }] });

	if (!entry) {
		await global.db.createGuild(guild);
		return await updateSettings(guild, setting, data, action);
	}

	switch (action) {
		case 'add':
			if (isTopic(data)) {
				for (const single of data) {
					global.db.topic.create({
						guildId: guild.id,
						name: single.name,
						value: single.value,
						text: single.text
					});
				}
			}
			else if (isStringArray(data)) {
				(entry[setting as keyof typeof entry] as String[]) = 
					(entry[setting as keyof typeof entry] as String[]).concat(data);
			}
			break;
		case 'remove':
			if (isTopic(data)) {
				for (const single of data) {
					await global.db.topic.destroy({
						where: {
							value: single.value
						}
					});
				}
			}
			else if (isStringArray(data)) {
				(entry[setting as keyof typeof entry] as String[]) =
					(entry[setting as keyof typeof entry] as String[]).filter(el => !(data).includes(el));
			}
			break;
		case 'replace':
			if (isTopic(data)) {
				for (const single of data) {
					await global.db.topic.update(single, {
						where: {
							value: single.value
						}
					})
				}
			}
			else {
				entry[setting as keyof typeof entry] = data;
			}
			break;
	}

	return { result: true, error: '' };
}

async function getTopic(guild: Guild, topic: string): Promise<string> {
	const data = await getSettings(guild, 'topics');

	return data.find(value => value.value === topic)?.text
		?? `There was an error processing the topic for ${topic}`;
}

async function hasModRole(guild: Guild, member: GuildMember): Promise<boolean> {
	const modRoles = await getSettings(guild, 'roles-mod');
	for (const id of member.roles.cache.keys()) {
		if (modRoles.includes(id)) return true;
	}
	return false;
}

async function getScamRatelimit(guild: Guild, userid: string): Promise<RateLimit> {
	if (!global.rateLimits.has(guild.id))
		global.rateLimits.set(guild.id,
			new RateLimitManager(
				await getSettings(guild, 'antiScam-scamLinksAllowed'),
				await getSettings(guild, 'antiScam-timePeriod') * 1000)
			)

	return global.rateLimits.get(guild.id)!.acquire(userid);
}


function getBigrams(str: String) {
	const bigrams = new Set<String>();
	const { length } = str;
	for (let i = 0; i < length - 1; i++) {
	  const bigram = str.slice(i, i + 2);
	  bigrams.add(bigram);
	}
	return bigrams;
}

function intersect(set1: Set<String>, set2: Set<String>) {
	const intersection = new Set<String>();
	set1.forEach(value => {
		if (set2.has(value)) {
			intersection.add(value);
		}
	});
	return intersection;
}

function diceCoefficient(str1: String, str2: String) {
	const bigrams1 = getBigrams(str1);
	const bigrams2 = getBigrams(str2);
	return (2 * intersect(bigrams1, bigrams2).size) / (bigrams1.size + bigrams2.size);
}

function isStringArray(input: any): input is String[] {
	return Array.isArray(input)
		&& !input.some(value => typeof value !== 'string');
}

function isTopic(input: any): input is Topic[] {
	if (!Array.isArray(input)) return false;

	return typeof input[0] === 'object'
		&& 'name' in input[0]
		&& 'value' in input[0]
		&& 'text' in input[0];
}

function formatTopic(input: string): Topic[] | null {
	let data;
	try {
		data = JSON.parse(input);
	}
	catch(ex) {
		console.error(ex);
		return null;
	}

	if (!Array.isArray(data)) {
		data = [data];
	}
	
	if (!isTopic(data)) {
		console.error(`Received data not in topic format`)
		return null;
	}

	for (let i = 0; i <= data.length - 1; i++) {
		data[i]!.name = data[i]!.name.replaceAll('\n', '');
		data[i]!.value = data[i]!.value.replaceAll('\n', '').toLowerCase();
	}

	return data;
}

function buildTopicTree(data: Topic[]): treeNode {
	const topicTree = data.map(value => {
		return {
			text: `Name: ${value.name}`,
			children: [
				{
					text: `Value: ${value.value}`
				},
				{
					text: `Text: ${value.text.replaceAll('\n', '\\n')}`
				}
			]
		};
	});

	return {
		text: 'topics',
		children: topicTree
	}
}

export {
	hasAtLeastPermissionLevel,
	hasModRole,
	getSettings,
	getTopic,
	isTopic,
	updateSettings,
	getScamRatelimit,
	formatTopic,
	buildTopicTree,
	diceCoefficient
};