import { Collection } from 'discord.js';

class RateLimit {
	public bucket: number;
	public cooldown: number;
	public time: number;
	public remaining: number;

	constructor(bucket: number, cooldown: number) {
		this.bucket = bucket;
		this.cooldown = cooldown;
		this.time = 0;
		this.remaining = 0;

		this.reset();
	}

	public get expired(): boolean {
		return this.remainingTime === 0;
	}

	public get limited(): boolean {
		return !(this.remaining > 0 || this.expired);
	}

	public get remainingTime(): number {
		return Math.max(this.time - Date.now(), 0);
	}

	public drip(): RateLimit {
		if (this.limited) throw new Error('Ratelimited');
		if (this.expired) this.reset();

		this.remaining--;
		return this;
	}

	public reset(): RateLimit {
		return this.resetRemaining().resetTime();
	}

	public resetRemaining(): RateLimit {
		this.remaining = this.bucket;

		return this;
	}

	public resetTime(): RateLimit {
		this.time = Date.now() + this.cooldown;

		return this;
	}
}

class RateLimitManager extends Collection<String, RateLimit> {
	private sweepInterval: NodeJS.Timer | null;
	private _bucket: number;
	private _cooldown: number;

	constructor(bucket: number, cooldown: number) {
		super();

		this.sweepInterval = null;
		this._bucket = bucket;
		this._cooldown = cooldown;
	}

	public get bucket(): number {
		return this._bucket;
	}

	public set bucket(value: number) {
		for (const ratelimit of this.values()) ratelimit.bucket = value;
		this._bucket = value;
	}

	public get cooldown(): number {
		return this._cooldown;
	}

	public set cooldown(value: number) {
		for (const ratelimit of this.values()) ratelimit.cooldown = value;
		this._cooldown = value;
	}

	public acquire(id: string): RateLimit {
		return this.get(id) || this.create(id);
	}

	public create(id: string): RateLimit {
		const rateLimit = new RateLimit(this._bucket, this._cooldown);
		this.set(id, rateLimit);
		return rateLimit;
	}

	public override set(id: string, rateLimit: RateLimit) {
		if (!(rateLimit instanceof RateLimit)) throw new TypeError('Invalid RateLimit');
		if (!this.sweepInterval) this.sweepInterval = setInterval(this.sweep.bind(this), 30000);
		return super.set(id, rateLimit);
	}

	public override sweep(fn: (value: RateLimit, key: String, collection: this) => boolean = (rl: RateLimit) => rl.expired, thisArg?: unknown): number {
		const amount = super.sweep(fn, thisArg);

		if (this.size === 0 && this.sweepInterval !== null) {
			clearInterval(this.sweepInterval!);
			this.sweepInterval = null;
		}

		return amount;
	}

	static get [Symbol.species](): typeof Collection {
		return Collection;
	}
}

export {
	RateLimit,
	RateLimitManager
}
