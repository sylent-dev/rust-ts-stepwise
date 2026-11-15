# Sound sources

The sources of the sounds compared on the mock-up at step 11b, and their terms, checked on 2026-11-15. The application ships none of these files: it synthesizes its sounds with the Web Audio API (see [Technical choices](technical-choices.md), Sounds, and [specs.md](../specs.md#sounds)), so that no license applies to them. The files not chosen were removed from the mock-up once the sounds were decided; the commits of pull request #45 keep them.

## Kenney, under CC0

Twelve files from three packs by Kenney Vleugels (kenney.nl), numbered 43 to 46, 50 to 53 and 57 to 60 on the mock-up, renamed `kenney-*.ogg`, none of them chosen:

| Pack | Page | License |
|---|---|---|
| Interface Sounds (1.0, 2020) | [opengameart.org/content/interface-sounds](https://opengameart.org/content/interface-sounds) | CC0 |
| 85 Short Music Jingles | [opengameart.org/content/85-short-music-jingles](https://opengameart.org/content/85-short-music-jingles) | CC0 |
| RPG Sound Pack | [opengameart.org/content/50-rpg-sound-effects](https://opengameart.org/content/50-rpg-sound-effects) | CC0 |

- The page of each pack on OpenGameArt and the license file in each archive say [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/): free to use, change and publish, in personal, educational and commercial projects, without a credit. Kenney asks for a credit as a kindness, not a condition: this note gives it.
- They were downloaded from OpenGameArt, which gives direct links. The site of Kenney asks for a session to download, which was not worked around.
- Risk: none known. CC0 waives every right the author could waive; a paid version (see the [backlog](backlog.md), Distribution) could use them as well.

## Made for Stepwise

- **Synthesized in the browser** (40 to 42, 47 to 49, 54 to 56, 90, 91): recipes of the Web Audio API in `docs/mockups/world-elements/sound.js`, written for Stepwise, under the license of the code. The four sounds chosen are among them (41, 48, 90, 91).
- **Made by a script** (61 to 89): `docs/mockups/world-elements/make-sounds.py`, written for Stepwise, Python's standard library and ffmpeg (to encode Ogg Vorbis), the same files at each run. It stays as the workshop for new sounds: a sound chosen among its files is ported to the Web Audio API with the same curves and level, as 77 and 88 were (90 and 91, heard the same on 2026-11-15, within 0.6 dB). It keeps the recipes of these two alone, whose files stay beside their ports on the mock-up.
