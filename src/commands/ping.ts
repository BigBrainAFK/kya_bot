import { Command } from '@sapphire/framework';
import { Message } from 'discord.js';
import { commandIdHints } from '../util/Constants.js';

export class PingCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName('ping')
				.setDescription('Ping bot to see if it is alive');
		}, { idHints: commandIdHints.ping });
	}

	public override async chatInputRun(interaction: Command.ChatInputInteraction) {
		const msg = await interaction.reply({ content: `Ping?`, ephemeral: true, fetchReply: true });

		if (msg instanceof Message) {
			const diff = msg.createdTimestamp - interaction.createdTimestamp;
			const ping = Math.round(this.container.client.ws.ping);
			return interaction.editReply(`Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`);
		}

		return interaction.editReply('Failed to retrieve ping :(');
	}
}