import { Command } from '@sapphire/framework';
import { MessageAttachment } from 'discord.js';
import { treeView, treeNode } from 'simple-text-tree';
import { AllSettings, BooleanSettings, NumberSettings, SettingsOptionBoolean, SettingsOptionNumber,
	SettingsOptionsStringArray, SettingsOptionTopic, StringArraySettings, TopicSettings } from '../util/constants.js';
import { getSettings, hasAtLeastPermissionLevel, updateSettings, formatTopic, buildTopicTree } from '../util/utility.js';

export class ConfigCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName('config')
				.setDescription('Configure bot settings to your liking')
				.addSubcommand((input) => {
					return input.setName('show')
						.setDescription('Show the current configuration for an option')
						.addStringOption((option) => {
							return option.setName('option')
								.setDescription('The option to change')
								.setRequired(false)
								.setAutocomplete(true)
						})
				})
				.addSubcommand((input) => {
					return input.setName('set')
						.setDescription('Sets an option to a new value')
						.addStringOption((option) => {
							return option.setName('option')
								.setDescription('The option to change')
								.setRequired(true)
								.setAutocomplete(true)
						})
						.addStringOption((option) => {
							return option.setName('value-to-set')
								.setDescription('The new value for the option')
								.setRequired(true)
								.setAutocomplete(true)
						})
				})
				.addSubcommand((input) => {
					return input.setName('add')
						.setDescription('Add a guarded url to the filter')
						.addStringOption((option) => {
							return option.setName('option')
								.setDescription('The option to change')
								.setRequired(true)
								.setAutocomplete(true)
						})
						.addStringOption((option) => {
							return option.setName('value-to-add')
								.setDescription('The guarded url to add to the filter')
								.setRequired(true)
						})
				})
				.addSubcommand((input) => {
					return input.setName('remove')
						.setDescription('Remove a guarded url from the filter')
						.addStringOption((option) => {
							return option.setName('option')
								.setDescription('The option to change')
								.setRequired(true)
								.setAutocomplete(true)
						})
						.addStringOption((option) => {
							return option.setName('value-to-remove')
								.setDescription('The guarded url to remove from the filter')
								.setRequired(true)
						})
				});
		}, { idHints: ['1035273295664251012'] });
	}

	public override async chatInputRun(interaction: Command.ChatInputInteraction) {
		await interaction.deferReply({
			ephemeral: true
		});

		if (!interaction.guildId) return interaction.editReply('This command is only available inside guilds.');
		
		await interaction.client.guilds.fetch(interaction.guildId);

		const hasPerms = await hasAtLeastPermissionLevel(interaction, 6);
		if (!hasPerms) return interaction.editReply(`You do not have enough permissions to edit the settings.`);

		const subcmd = interaction.options.getSubcommand();

		return await (this[subcmd as keyof this] as Function)(interaction);
	}

	async show(interaction: Command.ChatInputInteraction) {
		const option = interaction.options.getString('option');

		if (!option) { // FIX ME
			const allSettingsResult = new Array<treeNode>;

			for (const currentSetting of AllSettings.sort()) {
				let result: treeNode;
				if (StringArraySettings.includes(currentSetting)) {
					const data = await getSettings(interaction.guild!, currentSetting as SettingsOptionsStringArray);

					if (data.length > 1) {
						result = {
							text: currentSetting,
							children: data.map(value => ({ text: value }))
						};
					}
					else {
						result = {
							text: `${currentSetting}: ${data.length ? data[0] : 'none'}`
						};
					}
				}
				else if (TopicSettings.includes(currentSetting)) {
					const data = await getSettings(interaction.guild!, currentSetting as SettingsOptionTopic);
					result = buildTopicTree(data);
				}
				else if (BooleanSettings.includes(currentSetting)) {
					const data = await getSettings(interaction.guild!, currentSetting as SettingsOptionBoolean);

					result = {
						text: `${currentSetting}: ${data}`
					};
				}
				else if (NumberSettings.includes(currentSetting)) {
					const data = await getSettings(interaction.guild!, currentSetting as SettingsOptionNumber);

					result = {
						text: `${currentSetting}: ${data}`
					}
				}
				else {
					interaction.guild?.client.logger
						.error(`There was an error processing ${currentSetting} when building tree`);
					continue;
				}
				allSettingsResult.push(result);
			}

			const treeText = treeView(allSettingsResult);

			if (treeText.length >= 1920) {
				return interaction.editReply({
					content: `Here is the current config`,
					files: [
						new MessageAttachment(
							Buffer.from(`Current configuration\n${treeText}`, 'utf-8'),
							`config_${Date.now().toLocaleString()}.txt`
						)
					]
				});
			}

			return interaction.editReply(`Current configuration\n\`\`\`regex\n${treeText}\`\`\``)
		}
		else {
			let replyString = `Setting \`${option}\` could not be processed.`;

			if (StringArraySettings.includes(option)) {
				const stringArrResult = await getSettings(interaction.guild!, option as SettingsOptionsStringArray);
				if (!stringArrResult.length) return interaction.editReply(`The setting \`${option}\` is empty.`);

				const concated = stringArrResult.join('\n');

				if (concated.length >= 1920) {
					return interaction.editReply({
						content: `Setting \`${option}\`:`,
						files: [
							new MessageAttachment(
								Buffer.from(`Setting \`${option}\`:\n${concated}`, 'utf-8'),
								`${option}_${Date.now().toLocaleString()}.txt`
							)
						]
					});
				}
		
				replyString = `Setting \`${option}\`:\n\`\`\`regex\n${concated}\`\`\``;
			}
			else if (TopicSettings.includes(option)) {
				const topicResult = await getSettings(interaction.guild!, option as SettingsOptionTopic);
				if (!topicResult.length) return interaction.editReply(`The setting \`${option}\` is empty.`);

				const treeText = treeView([buildTopicTree(topicResult)]);

				if (treeText.length >= 1920) {
					return interaction.editReply({
						content: `Setting \`${option}\`:`,
						files: [
							new MessageAttachment(
								Buffer.from(`Setting \`${option}\`:\n${treeText}`, 'utf-8'),
								`${option}_${Date.now().toLocaleString()}.txt`
							)
						]
					});
				}

				replyString = `Setting \`${option}\`:\n\`\`\`regex\n${treeText}\`\`\``;
			}
			else if (BooleanSettings.includes(option)) {
				const boolResult = await getSettings(interaction.guild!, option as SettingsOptionBoolean);
		
				replyString = `Setting \`${option}\` is set to \`${boolResult}\`.`;
			}
			else if (NumberSettings.includes(option)) {
				const numberResult = await getSettings(interaction.guild!, option as SettingsOptionNumber);
		
				replyString = `Setting \`${option}\` is set to \`${numberResult}\`.`;
			}

			return interaction.editReply(replyString)
		}
	}

	async set(interaction: Command.ChatInputInteraction) {
		const value = interaction.options.getString('value-to-set')!.replace('\n', '');
		const temp = interaction.options.getString('option')!;
		let option, err;

		// check if the option value is a boolean or number option and update accordingly
		if (BooleanSettings.includes(temp)) {
			option = temp as SettingsOptionBoolean;
			const { error } = await updateSettings(interaction.guild!, option, Boolean(value), 'replace');
			err = error;
		}
		else if (NumberSettings.includes(temp)) {
			option = temp as SettingsOptionNumber;
			const { error } = await updateSettings(interaction.guild!, option, Number(value), 'replace');
			err = error;
		}
		else if (TopicSettings.includes(temp)) {
			let data = formatTopic(value);

			if (!data) return interaction.editReply(`There was an error formatting the data for \`${temp}\`.`);

			option = temp as SettingsOptionTopic;
			const { error } = await updateSettings(interaction.guild!, option, data, 'replace');
			err = error;
		}
		else {
			return interaction.editReply(`Internal error when checking type of \`${temp}\``);
		}

		if (err.length) return interaction.editReply(err);
		return interaction.editReply(`Successfully updated \`${option}\` to \`${value}\``);
	}

	async add(interaction: Command.ChatInputInteraction) {
		const value = interaction.options.getString('value-to-add')!.replace('\n', '');
		const option = interaction.options.getString('option');

		if (!option) return interaction.editReply('Error: received empty option parameter.');

		if (StringArraySettings.includes(option)) {
			// check if value is already in the string array. if so error and return
			if ((await getSettings(interaction.guild!, option as SettingsOptionsStringArray))
				.some(find => find === value)) {
					return interaction.editReply(`\`${value}\` is already set in \`${option}\`.`);
			}
	
			if (value.length > 255) return interaction.editReply('The provided value is too long.');
	
			const { error } =
				await updateSettings(interaction.guild!, option as SettingsOptionsStringArray, [value], 'add');
			if (error.length) return interaction.editReply(error);
		}
		else if (TopicSettings.includes(option)) {
			let data = formatTopic(value);

			if (!data) return interaction.editReply(`There was an error formatting the data for \`${option}\`.`);

			for (let i = 0; i <= data.length - 1; i++) {
				// check if value is already in the string array. if so error and return
				if ((await getSettings(interaction.guild!, option as SettingsOptionTopic))
					.some(find => find.value === value)) {
						return interaction.editReply(`\`${value}\` is already set in \`${option}\`.`);
				}
			}
	
			const { error } = await updateSettings(interaction.guild!, option as SettingsOptionTopic, data, 'add');
			if (error.length) return interaction.editReply(error);
		}
		return interaction.editReply(`Successfully added \`${value}\` to \`${option}\`.`);
	}

	async remove(interaction: Command.ChatInputInteraction) {
		const value = interaction.options.getString('value-to-remove')!;
		const option = interaction.options.getString('option');

		if (!option) return interaction.editReply('Error: received empty option parameter.');

		if (StringArraySettings.includes(option)) {
			// check if the value to remove does exist. if not error and return
			if (!(await getSettings(interaction.guild!, option as SettingsOptionsStringArray))
				.some(find => find === value)){
					return interaction.editReply(`\`${value}\` was not found in \`${option}\`.`);
			}
	
			const { error } = await updateSettings(interaction.guild!, option as SettingsOptionsStringArray, [value], 'remove');
			if (error.length) return interaction.editReply(error);
		}
		else if (TopicSettings.includes(option)) {
			let data = formatTopic(value);

			if (!data) return interaction.editReply(`There was an error formatting the data for \`${option}\`.`);

			for (let i = 0; i <= data.length - 1; i++) {
				// check if value is already in the string array. if so error and return
				if (!(await getSettings(interaction.guild!, option as SettingsOptionTopic))
					.some(find => find.value === value)) {
						return interaction.editReply(`\`${value}\` was not found in \`${option}\`.`);
				}
			}
	
			const { error } = await updateSettings(interaction.guild!, option as SettingsOptionTopic, data, 'remove');
			if (error.length) return interaction.editReply(error);
		}
		return interaction.editReply(`Successfully removed \`${value}\` to \`${option}\`.`);
	}
}

