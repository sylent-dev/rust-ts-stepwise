// The player of the page: one audio context for every screen and the panel of the settings, made
// at the first sound. Who plays a sound checks the setting **Sounds** first.

import { SoundPlayer } from './sound-player.ts';

export const pageSounds = new SoundPlayer();
