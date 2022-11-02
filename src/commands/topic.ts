import { Command } from '@sapphire/framework';
import { commandIdHints, topicGuildIds } from '../util/Constants.js';
import { getTopic } from '../util/Utility.js';

export class TopicCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName('topic')
				.setDescription('Sends some more info about certain topics')
				.addStringOption((option) => {
					return option.setName('inquiry')
						.setDescription('The topic you want to know more about')
						.setRequired(true)
						.setAutocomplete(true);
				});
		}, { guildIds: topicGuildIds, idHints: commandIdHints.topic });
	}

	public override async chatInputRun(interaction: Command.ChatInputInteraction) {
		await interaction.deferReply({
			ephemeral: true
		});

		const choice = interaction.options.getString('inquiry');

		if (!choice) return interaction.editReply(`Error: Received empty topic inquiry.`);

		const reply = await getTopic(interaction.guild!, choice);

		return interaction.editReply(reply);
	}
}
