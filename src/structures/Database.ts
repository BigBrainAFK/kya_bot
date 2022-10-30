import { DataTypes, Sequelize } from '@sequelize/core';
import type { Model, ModelStatic } from '@sequelize/core';
import { initialTopics } from '../util/Constants.js';
import type { Guild } from 'discord.js';
import type { KyaClient } from './KyaClient.js';
import { container } from '@sapphire/framework';

type DatabaseOptions = {
	host: string,
	port?: number,
	database: string,
	username: string,
	password: string
}

class PostgresDatabase {
	private _client: KyaClient;
	private _dbConn: Sequelize;
	private _guilds;
	private _topic;

	constructor(client: KyaClient, options?: DatabaseOptions) {
		if (!options) {
			options = {
				host: process.env.HOST ?? '',
				database: process.env.DATABSE ?? '',
				username: process.env.USERNAME ?? '',
				password: process.env.PASSWORD ?? ''
			}
		}
		
		this._dbConn = new Sequelize(
			{
				...options,
				dialect: 'postgres',
				logging: false
			}
		)

		this._client = client;

		this._guilds = this._dbConn.define('guilds', {
			// Guild ID
			id: {
				type: DataTypes.STRING,
				primaryKey: true,
				allowNull: false
			},

			// Mod role list
			'roles-mod': {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: false,
				defaultValue: []
			},

			// Anti Invite active flag
			'antiInvite': {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},

			// whitelisted guilds for anti invite
			'antiInvite-whitelistedGuilds': {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: false,
				defaultValue: []
			},

			'antiScam': {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},

			// guarded URLs for scam detection
			'antiScam-guardedURLs': {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: false,
				defaultValue: []
			},

			// lower bound for similarity trigger
			'antiScam-urlLowerBound': {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: .35
			},

			// how many scam triggers per period
			'antiScam-scamLinksAllowed': {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 3
			},

			// ratelimit drip period in seconds
			'antiScam-timePeriod': {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 15
			}
		})

		this._topic = this._dbConn.define('topic', { // Per guild settings
			// name of the topic aka. short text
			'name': {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: ''
			},

			// value of the topic
			'value': {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: ''
			},

			// Text of the topic
			'text': {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: ''
			}
		})

		this.guilds.hasMany(this.topic, {
			foreignKey: 'guildId',
			as: 'topics',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE'
		});
		this.topic.belongsTo(this.guilds);

		this._dbConn.sync();
		this.checkConnection();
	}

	get conn(): Sequelize {
		return this._dbConn;
	}

	get topic(): ModelStatic<Model<any, any>> {
		return this._topic;
	}

	get guilds(): ModelStatic<Model<any, any>> {
		return this._guilds;
	}

	private async checkConnection() {
		try {
			await this._dbConn.authenticate();
			console.log('Connection has been established successfully.');
		} catch (error) {
			console.error('Unable to connect to the database:', error);
			process.exit(2);
		}
	}

	public async createGuild(guild: Guild): Promise<void> {
		await container.database.guilds.create({
			id: guild.id,
			topics: initialTopics
		}, {
			include: [{
				association: 'topics'
			}]
		}).catch(this._client.logger.error); // voided as it should be impossible to fail except for the dual/tripple creations
	}

	public async getGuildRow(guild: Guild): Promise<Model<any, any>> {
		const entry = await this._guilds.findByPk(guild.id, { include: [{ association: 'topics' }]});

		if (!entry) {
			await this.createGuild(guild);
			return this.getGuildRow(guild);
		}

		return entry;
	}
}

export {
	DatabaseOptions,
	PostgresDatabase
}
