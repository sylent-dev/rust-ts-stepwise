// What the tests of the sounds share: an audio context that plays nothing and writes down what it
// is asked, since Node, which runs the tests, has no Web Audio API. Used by the tests alone.

/** What a parameter of a node is asked: its value, set or ramped to, from `time` in seconds. */
export interface ParamEvent {
	kind: 'set' | 'ramp' | 'curve' | 'target';
	value: number;
	time: number;
}

/** A parameter of a node (`frequency`, `gain`), which writes down what it is asked. */
export class FakeParam {
	value: number;
	readonly events: ParamEvent[] = [];

	constructor(value: number) {
		this.value = value;
	}

	setValueAtTime(value: number, time: number): this {
		this.events.push({ kind: 'set', value, time });
		return this;
	}

	exponentialRampToValueAtTime(value: number, time: number): this {
		this.events.push({ kind: 'ramp', value, time });
		return this;
	}

	setValueCurveAtTime(values: Float32Array, time: number): this {
		this.events.push({ kind: 'curve', value: values[0] ?? Number.NaN, time });
		return this;
	}

	setTargetAtTime(value: number, time: number): this {
		this.events.push({ kind: 'target', value, time });
		return this;
	}
}

/** A node, which writes down where it is connected. */
export class FakeNode {
	readonly context: FakeAudioContext;
	readonly outputs: FakeNode[] = [];

	constructor(context: FakeAudioContext) {
		this.context = context;
	}

	connect<Node extends FakeNode>(node: Node): Node {
		this.outputs.push(node);
		return node;
	}
}

export class FakeGain extends FakeNode {
	readonly gain = new FakeParam(1);
}

/** What makes a sound: an oscillator, or the buffer of a burst of noise. */
export class FakeSource extends FakeNode {
	readonly kind: 'oscillator' | 'noise';
	type = 'sine';
	readonly frequency = new FakeParam(440);
	buffer: unknown;
	startedAt: number | undefined;
	stoppedAt: number | undefined;

	constructor(context: FakeAudioContext, kind: 'oscillator' | 'noise') {
		super(context);
		this.kind = kind;
	}

	start(time: number): void {
		this.startedAt = time;
	}

	stop(time: number): void {
		this.stoppedAt = time;
	}
}

export class FakeAudioContext {
	readonly sampleRate = 48_000;
	currentTime = 0;
	/** `interrupted` is a state of Safari alone, which the types of a browser don't know. */
	state: 'suspended' | 'running' | 'closed' | 'interrupted';
	resumed = 0;
	readonly destination: FakeNode;
	/** The sources made, in order. */
	readonly sources: FakeSource[] = [];
	/** The gains made, in order. */
	readonly gains: FakeGain[] = [];

	constructor(state: 'suspended' | 'running' = 'running') {
		this.state = state;
		this.destination = new FakeNode(this);
	}

	resume(): Promise<void> {
		this.resumed += 1;
		this.state = 'running';
		return Promise.resolve();
	}

	createGain(): FakeGain {
		const gain = new FakeGain(this);
		this.gains.push(gain);
		return gain;
	}

	createOscillator(): FakeSource {
		const source = new FakeSource(this, 'oscillator');
		this.sources.push(source);
		return source;
	}

	createBufferSource(): FakeSource {
		const source = new FakeSource(this, 'noise');
		this.sources.push(source);
		return source;
	}

	createBiquadFilter(): FakeNode & { type: string; frequency: FakeParam } {
		return Object.assign(new FakeNode(this), { type: 'lowpass', frequency: new FakeParam(350) });
	}

	createBuffer(_channels: number, length: number) {
		const data = new Float32Array(length);
		return { getChannelData: () => data };
	}

	/** The context as the Web Audio API types it, for what plays the sounds. */
	get typed(): AudioContext {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Node has no Web Audio API, and the sounds use only what this context writes down
		return this as unknown as AudioContext;
	}
}

/** A node of `context` as the Web Audio API types it, for a recipe to play into. */
export function typedNode(node: FakeNode): AudioNode {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- as `typed` above
	return node as unknown as AudioNode;
}

/** What a source started: an oscillator by its first frequency, a burst of noise by nothing. */
export interface Heard {
	kind: 'oscillator' | 'noise';
	/** The first frequency it was set to, rounded to the hertz; nothing for noise. */
	freq: number | undefined;
	/** When it starts, in milliseconds on the clock of the context, rounded. */
	at: number | undefined;
}

/** What the sources of `context` start, in the order they were made. */
export function heardIn(context: FakeAudioContext): Heard[] {
	return context.sources.map((source) => {
		const first = source.frequency.events[0];
		return {
			kind: source.kind,
			freq: source.kind === 'noise' || !first ? undefined : Math.round(first.value),
			at: source.startedAt === undefined ? undefined : Math.round(source.startedAt * 1000)
		};
	});
}
