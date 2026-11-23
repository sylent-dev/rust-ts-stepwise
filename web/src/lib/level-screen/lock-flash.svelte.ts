// The flash of the status bar when the learner tries to change a locked code (see Level screen
// in specs.md): the reason held on the amber, then the amber fading under the state. Each new try
// starts it again; it stops once the code is free, so that the reason never shows over a code
// that can be changed. The bar plays it (status-bar.svelte) and says where it stands.

/** Where the flash stands: the reason held on the amber, then the amber fading under the state. */
export type FlashPhase = 'hold' | 'fade';

export class LockFlash {
	/**
	 * The number of the flash shown, which each try changes, so that the bar starts it again;
	 * 0 while none shows.
	 */
	number = $state(0);
	/** Where the flash shown stands. */
	phase = $state<FlashPhase>('hold');
	/** The tries so far, which number the flashes. */
	#tries = 0;

	/** The learner tried to change the locked code: a flash starts, from its hold. */
	refuse(): void {
		this.#tries += 1;
		this.number = this.#tries;
		this.phase = 'hold';
	}

	/** The hold of the flash shown has ended: the amber fades under the state. */
	held(): void {
		if (this.number > 0) this.phase = 'fade';
	}

	/**
	 * Ends the flash shown, once it has faded, or once the code is free again: none shows, and
	 * none comes back with the next lock.
	 */
	end(): void {
		this.number = 0;
	}
}
