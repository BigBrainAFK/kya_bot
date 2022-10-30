import { type SettingsOptionsStringArray, StringArraySettings, type SettingsOptionBoolean, BooleanSettings, type SettingsOptionNumber, NumberSettings, type SettingsOptionTopic, TopicSettings, type Topic } from "./Constants.js";

function isSettingStringArray(input: any): input is SettingsOptionsStringArray {
	return typeof input === 'string'
		&& StringArraySettings.includes(input);
}

function isSettingBoolean(input: any): input is SettingsOptionBoolean {
	return typeof input === 'string'
		&& BooleanSettings.includes(input);
}

function isSettingNumber(input: any): input is SettingsOptionNumber {
	return typeof input === 'string'
		&& NumberSettings.includes(input);
}

function isSettingTopic(input: any): input is SettingsOptionTopic {
	return typeof input === 'string'
		&& TopicSettings.includes(input);
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

export {
	isSettingBoolean,
	isSettingNumber,
	isSettingStringArray,
	isSettingTopic,
	isStringArray,
	isTopic
}
