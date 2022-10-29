import type { Message, CommandInteraction } from "discord.js";
import { Collection } from 'discord.js';

const empty = Symbol('empty');

type PermissionLevelData = {
	broke: boolean,
	permission: boolean
}

type PermissionLevelOptions = {
	check: Function,
	break?: boolean,
	fetch?: boolean
}

class PermissionLevels extends Collection<number, PermissionLevelOptions | symbol> {
	constructor(levels: number = 11) {
		super();

		for (let i = 0; i < levels; i++) super.set(i, empty);
	}

	add(level: number, options: PermissionLevelOptions = {check: () => true, break: false, fetch: false}): this {
		return this.set(level, { check: options.check, break: Boolean(options.break), fetch: Boolean(options.fetch) });
	}

	remove(level: number): this {
		return this.set(level, empty);
	}

	override set(level: number, obj: PermissionLevelOptions | symbol): this {
		if (level < 0) throw new Error(`Cannot set permission level ${level}. Permission levels start at 0.`);
		if (level > (this.size - 1)) throw new Error(`Cannot set permission level ${level}. Permission levels stop at ${this.size - 1}.`);
		return super.set(level, obj);
	}

	isValid(): boolean {
		return this.every((level: PermissionLevelOptions | symbol) => level === empty || (typeof level === 'object' && typeof level.break === 'boolean' && typeof level.fetch === 'boolean' && typeof level.check === 'function'));
	}

	/**
	 * Returns any errors in the perm levels
	 * @since 0.2.1
	 * @returns {string} Error message(s)
	 */
	debug() {
		const errors = [];
		for (const [index, level] of this) {
			if (level === empty) continue;
			if (typeof level !== 'object') errors.push(`Permission level ${index} must be an object`);
			if (typeof (<PermissionLevelOptions>level).break !== 'boolean') errors.push(`"break" in permission level ${index} must be a boolean`);
			if (typeof (<PermissionLevelOptions>level).fetch !== 'boolean') errors.push(`"fetch" in permission level ${index} must be a boolean`);
			if (typeof (<PermissionLevelOptions>level).check !== 'function') errors.push(`"check" in permission level ${index} must be a function`);
		}
		return errors.join('\n');
	}

	async run(message: Message | CommandInteraction, min: number): Promise<PermissionLevelData> {
		for (let i = min; i < this.size; i++) {
			const level = this.get(i);
			if (level === empty) continue;
			if ((<PermissionLevelOptions>level).fetch && message.guild) await message.guild.members.fetch(message.type === 'APPLICATION_COMMAND' ? (<CommandInteraction>message).user : (<Message>message).author);
			const res = await (<PermissionLevelOptions>level).check(message);
			if (res) return { broke: false, permission: true };
			if ((<PermissionLevelOptions>level).break) return { broke: true, permission: false };
		}
		return { broke: false, permission: false };
	}

	static get [Symbol.species]() {
		return Collection;
	}
}

export {
	PermissionLevelData,
	PermissionLevelOptions,
	PermissionLevels
}
