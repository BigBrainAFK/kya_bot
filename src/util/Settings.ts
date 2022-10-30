import { container } from "@sapphire/framework";
import { Guild, Team } from "discord.js";
import { KyaClient } from "../structures/KyaClient.js";
import type { SettingsOptionsStringArray, SettingsOptionBoolean, SettingsOptionNumber, SettingsOptionTopic, Topic, ActionOptions, UpdateData } from "./Constants.js";
import { isStringArray, isTopic } from "./Types.js";

async function getSettings(instance: KyaClient, setting: 'owners'): Promise<string[]>;
async function getSettings(instance: Guild, setting: SettingsOptionsStringArray): Promise<string[]>;
async function getSettings(instance: Guild, setting: SettingsOptionBoolean): Promise<boolean>;
async function getSettings(instance: Guild, setting: SettingsOptionNumber): Promise<number>;
async function getSettings(instance: Guild, setting: SettingsOptionTopic): Promise<Topic[]>;
async function getSettings(instance: Guild | KyaClient, setting: any): Promise<any> {
	if (instance instanceof KyaClient) {
		await instance.application!.fetch();
		if (instance.application!.owner instanceof Team) {
			return instance.application!.owner.members.map((val) => val.id);
		}
		return [instance.application!.owner!.id]
	}

	if (instance instanceof Guild) {
		const entry = await container.database.getGuildRow(instance)

		return entry.getDataValue(setting);
	}
}

async function updateSettings(guild: Guild, setting: SettingsOptionsStringArray, data: string[], action: ActionOptions): Promise<UpdateData>
async function updateSettings(guild: Guild, setting: SettingsOptionTopic, data: Topic[], action: ActionOptions | 'replace'): Promise<UpdateData>
async function updateSettings(guild: Guild, setting: SettingsOptionBoolean, data: boolean, action: 'replace'): Promise<UpdateData>
async function updateSettings(guild: Guild, setting: SettingsOptionNumber, data: number, action: 'replace'): Promise<UpdateData>
async function updateSettings(guild: Guild, setting: any, data: any, action: ActionOptions): Promise<UpdateData> {
	const entry = await container.database.getGuildRow(guild);

	let result = true;
	let error = '';
	const catchFunc = (reason: string) => {
		error = reason;
		result = false;
	};

	switch (action) {
		case 'add':
			if (isTopic(data)) {
				addTopicLoop: for (const single of data) {
					await container.database.topic.create({
						guildId: guild.id,
						name: single.name,
						value: single.value,
						text: single.text
					}).catch(catchFunc);

					if (!result) break addTopicLoop;
				}
			}
			else if (isStringArray(data)) {
				await entry.update(setting, entry.getDataValue(setting).concat(data)).catch(catchFunc);
			}
			break;
		case 'remove':
			if (isTopic(data)) {
				removeTopicLoop: for (const single of data) {
					await container.database.topic.destroy({
						where: {
							value: single.value
						}
					}).catch(catchFunc);

					if (!result) break removeTopicLoop;
				}
			}
			else if (isStringArray(data)) {
				await entry
					.update(setting, entry.getDataValue(setting).filter((value: string) => !data.includes(value)))
					.catch(catchFunc);
			}
			break;
		case 'replace':
			if (isTopic(data)) {
				replaceTopicLoop: for (const single of data) {
					await container.database.topic.update(single, {
						where: {
							value: single.value
						}
					}).catch(catchFunc);

					if (!result) break replaceTopicLoop;
				}
			}
			else {
				await entry.update(setting, data).catch(catchFunc);
			}
			break;
	}

	return { result, error };
}

export {
	getSettings,
	updateSettings
}
