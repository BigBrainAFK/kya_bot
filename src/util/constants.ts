const _StringArraySettings = ['roles-mod', 'antiInvite-whitelistedGuilds', 'antiScam-guardedURLs'] as const;
const _BooleanSettings = ['antiInvite', 'antiScam'] as const;
const _NumberSettings = ['antiScam-urlLowerBound', 'antiScam-scamLinksAllowed', 'antiScam-timePeriod'] as const;
const _TopicSettings = ['topics'] as const;

const StringArraySettings = _StringArraySettings.join('å').split('å');
const BooleanSettings = _BooleanSettings.join('å').split('å');
const NumberSettings = _NumberSettings.join('å').split('å');
const TopicSettings = _TopicSettings.join('å').split('å');
const AllSettings = [...StringArraySettings, ...BooleanSettings, ...NumberSettings, ...TopicSettings];

type SettingsOptionsStringArray = typeof _StringArraySettings[number];

type SettingsOptionBoolean = typeof _BooleanSettings[number];

type SettingsOptionNumber = typeof _NumberSettings[number];

type SettingsOptionTopic = typeof _TopicSettings[number];

type ActionOptions = 'add'
	| 'remove'
	| 'replace';

type UpdateData = {
	result: boolean,
	error: string
}

type Topic = {
	name: string,
	value: string,
	text: string
}

const initialTopics: Topic[] = [
	{
		name: 'My Analog is not working',
		value: 'analognotworking',
		text: 'Hey there! it has been brought to my attention you need a link for Analog not working, here you go! :)\n<https://help.wooting.io/en/article/troubleshoot-analog-input-is-not-working-1581hjr/>'
	},
	{
		name: 'My stem broke when pulling off a keycap',
		value: 'brokenstem',
		text: 'Hey there! it has been brought to my attention you need a link on how to remove a broken stem from a keycap, here you go! :)\nhttps://s.mrpl.me/switchremoval'
	},
	{
		name: 'Fortnite/Double Movement FAQ',
		value: 'fortnite',
		text: 'Hey there! A lot of issues with Double Movement can easily be fixed by visiting our FAQ ats :)\n<https://s.mrpl.me/faq>, if any of these dont resolve your issue we have a chat for support in <#789735295120703499>'
	},
	{
		name: 'How to contact Wooting for basic enquirees',
		value: 'contactbasic',
		text: 'If you need help with anything that cannot be done via Discord please contact us via our email social@wooting.io. Please give us a few days to respond, thank you for your patience'
	},
	{
		name: 'How to contact Wooting for more in depth issues',
		value: 'contactdetail',
		text: 'Hey there, as suggested, please sent an email to social@wooting.io using the email address associated with your order.\n\n**Please include;**\nName\nOrder Number\nDescription of the situation\n\nPlease give Wooting a couple of (business) days to respond'
	},
	{
		name: `Where is my Wooting or when will i get delivery updates?`,
		value: 'delivery',
		text: 'Please check <#517576648242233345> for regular updates, in here will always be the latest information'
	},
	{
		name: `No cookie for quin!`,
		value: 'cookie',
		text: 'No cookies for <@195174881464156161>'
	},
	{
		name: `My computer wont detect my Wooting`,
		value: 'detect',
		text: 'Hey there! Here is a guide to diagnose Wootility not detecting your keyboard.\n<https://help.wooting.io/en/article/issue-wootility-doesnt-detect-my-wooting-keyboard-ytcqfq/>'
	},
	{
		name: 'How do I disable XInput',
		value: 'disablexinput',
		text: 'Hey there! it has been brought to my attention you need a link on how to disable Xinput, here you go! :)\n<https://help.wooting.io/en/article/wootility-how-to-turn-off-xinput-xbox-controller-7hrkzs/>, you can also see in the image below where to find the option.'
	},
	{
		name: 'I have driver issues...',
		value: 'driver',
		text: 'Hey there! If you\'re having an issue with drivers check this guide out, you can also see the Gif attached below.\n<https://help.wooting.io/en/article/issue-windows-doesnt-load-wooting-driver-yellow-triangle-in-device-manager-1mte40x/>'
	},
	{
		name: 'How do I remove keycaps',
		value: 'keycap',
		text: 'Hey there! it has been brought to my attention you need a link for safely removing keycaps, here you go! :)\n<https://help.wooting.io/en/article/technical-how-to-safely-remove-the-keycaps-and-switches-fphje5/>'
	},
	{
		name: 'I want to make my own layout',
		value: 'layout',
		text: 'Hey there! it has been brought to my attention you need a link for making your own layout, here you go! :)\n<https://help.wooting.io/en/article/guide-how-to-create-a-wooting-keyboard-in-your-language-19ogshg/>'
	},
	{
		name: 'Wooting 60he quickstart guide',
		value: '60hequickstart',
		text: 'Got your 60he? awesome, need some help? check out the Wooting 60he quickstart guide https://s.mrpl.me/60hequickstart'
	},
	{
		name: 'I need to restore my Wooting(TM) keyboard',
		value: 'restore',
		text: 'Sometimes a quick restore can fix your Wooting, so here is how to restore: <https://s.mrpl.me/wootrestore>'
	},
	{
		name: 'My right keyboard half RGB wont work',
		value: 'rightside',
		text: 'Hey there! it has been brought to my attention you need a link for right side leds not working, here you go! :)\n<https://help.wooting.io/en/article/issue-the-right-part-of-my-leds-go-out-sometimes-lohmit/>'
	},
	{
		name: 'Wooting social media links',
		value: 'social',
		text: 'Hey there! you can find our social links here.\n\nTwitter:<https://twitter.com/WootingKB>\nFacebook: <https://www.facebook.com/wootingkb>\nTwitch: <https://www.twitch.tv/wooting_live>'
	},
	{
		name: 'How do I remove my stabilizers',
		value: 'stabilizer',
		text: 'Hey there! it has been brought to my attention you need a link on how to safely remove stabilizers, here you go! :) \n<https://help.wooting.io/en/article/technical-how-to-safely-remove-stabilizers-cqdadh/>'
	},
	{
		name: 'How to troubleshoot a Wooting keyboard',
		value: 'troubleshoot',
		text: 'Here are a few links that might help you troubleshoot.\n<https://help.wooting.io/en/category/wooting-keyboards-1eyldhd/>'
	},
	{
		name: 'What about the warranty',
		value: 'warranty',
		text: 'Your Wooting has a 2 (6 years for the Wooting 60he) year Warrenty inside and outside of the EU, read more here: <https://wooting.io/warrantyreturn>'
	}
]

export {
	StringArraySettings,
	BooleanSettings,
	NumberSettings,
	TopicSettings,
	AllSettings,
	SettingsOptionsStringArray,
	SettingsOptionBoolean,
	SettingsOptionNumber,
	SettingsOptionTopic,
	ActionOptions,
	UpdateData,
	Topic,
	initialTopics
}
