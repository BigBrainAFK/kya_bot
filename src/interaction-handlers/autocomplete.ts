import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import { AllSettings, BooleanSettings, NumberSettings, StringArraySettings, Topic } from '../util/constants.js';
import { distance } from 'fastest-levenshtein';

export class AutocompleteHandler extends InteractionHandler {
	public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Autocomplete
		});
	}

	public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		const autoCompleteCmds = ['1035273295664251012', '1035274298937589840'];
		if (autoCompleteCmds.includes(interaction.commandId)) {
			const focusedOption = interaction.options.getFocused(true);

			switch (focusedOption.name) {
				case 'option': {
					const subCommand = interaction.options.getSubcommand(true);

					return this.some(
						AllSettings
						// filter by subcommand
						.filter(value => {
							if (['add', 'remove'].includes(subCommand))
							{
								return StringArraySettings.includes(value);
							}
							if (subCommand === 'set') {
								return !StringArraySettings.includes(value);
							}

							return true;
						})
						// most basic pre filtering to only include options that contain the inserted string
						.filter(value => {
							return value.toLowerCase().includes(focusedOption.value.toLowerCase());
						})
						// sort by closeness to current input
						.sort((a, b) => {
							const dist_a = distance(a, focusedOption.value);
							const dist_b = distance(b, focusedOption.value);

							if (dist_a < dist_b) {
								return -1;
							}
							if (dist_a > dist_b) {
								return 1;
							}
							return 0;
						})
						//shorten to 25 max
						.slice(0, 24)
						// map to required format
						.map(value => ({ name: value, value })));
				}
				case 'value-to-set': {
					const option = interaction.options.getString('option');

					if (!option) return this.none();
				
					// if option field is a boolean setting just show true or false
					if (BooleanSettings.includes(option)) {
						return this.some(['true', 'false'].map(value => ({ name: value, value })));
					}
					// if option field has todo with numbers show some numbers
					else if (NumberSettings.includes(option)) {
						if (isNaN(Number(focusedOption.value)) || !focusedOption.value.length) {
							const tempArr = Array.from(Array(10));

							// for the named option return values between 0 and 1 specifically
							if (option === 'antiScam-urlLowerBound') {
								return this.some(
									tempArr.map(
										(_e, i) => (i / 10).toString()
									)
									.map(
										value => ({ name: value, value })
									)
								);
							}

							// otherwise just list 1 to 10 (nothing should need more than this)
							return this.some(
								tempArr.map(
									(_e, i) => (i + 1).toString()
								)
								.map(
									value => ({ name: value, value })
								)
							);
						}
						else {
							return this.some([{ name: focusedOption.value, value: focusedOption.value }]);
						}
					}

					return this.none();
				}
				case 'inquiry':
					const rawData = await global.db.topic.findAll({
						where: {
							guildId: interaction.guildId
						}
					});

					if (!rawData.length) return this.none();

					return this.some(
						rawData.map(value => {
							return {
								name: value.get('name'),
								value: value.get('value'),
								text: value.get('text')
							} as Topic
						})
						// most basic pre filtering to only include options that contain the inserted string
						.filter(value => {
							return value.name.toLowerCase().includes(focusedOption.value.toLowerCase());
						})
						// sort by closeness to current input
						.sort((a, b) => {
							const dist_a = distance(a.name, focusedOption.value);
							const dist_b = distance(b.name, focusedOption.value);
	
							if (dist_a < dist_b) {
								return -1;
							}
							if (dist_a > dist_b) {
								return 1;
							}
							return 0;
						})
						//shorten to 25 max
						.slice(0, 24)
						// map to required format
						.map(value => ({ name: value.name, value: value.value }))
					);
				default:
					return this.none();
			}
		}

		return this.none();
	}
}