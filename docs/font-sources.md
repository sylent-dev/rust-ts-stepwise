# Font sources

The three fonts of the interface, where their files come from, and their terms, checked on 2026-11-16 (step 12b). The files are committed in [`web/static/fonts/`](../web/static/fonts/), one folder per font, each file beside its license. The application and the mock-ups load these files and nothing from another server. Their roles, sizes and weights are in the [design system](design-system.md#typography).

## The files

One variable file per font: it holds every weight.

| Font | File | Version | Weights | Characters | Size |
|---|---|---|---|---|---|
| Fredoka | `fredoka/fredoka-latin.woff2` | 2.001 | 300 to 700, without its width axis | Latin subset, 217 | 29,732 bytes |
| Manrope | `manrope/manrope-latin.woff2` | 4.505 | 200 to 800 | Latin subset, 218 | 24,532 bytes |
| Source Code Pro | `source-code-pro/source-code-pro.woff2` | 1.026 | 200 to 900, upright | Complete, 1,334 | 90,124 bytes |

| File | Downloaded from | SHA-256 |
|---|---|---|
| `fredoka-latin.woff2` | `https://fonts.gstatic.com/s/fredoka/v17/X7n64b87HvSqjb_WIi2yDCRwoQ_k7367_DWu89U.woff2`, the Latin file of `https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700` | `99d6c78e043710d4f83ed90716779798b7b04eb690f73e0ad0e8f32d1f0e98c2` |
| `manrope-latin.woff2` | `https://fonts.gstatic.com/s/manrope/v23/xn7gYHE41ni1AdIRggexSg.woff2`, the Latin file of `https://fonts.googleapis.com/css2?family=Manrope:wght@200..800` | `8c2def024c1bf31aacf3624ae3c4d701269b4ec3dc765c04830839f0d36b2d9e` |
| `source-code-pro.woff2` | `WOFF2/VF/SourceCodeVF-Upright.ttf.woff2` of [adobe-fonts/source-code-pro](https://github.com/adobe-fonts/source-code-pro/tree/release), branch `release` at `803b7e2` | `d95dc751b4d82141259f5c00c9838addaadd3b4eac30dd7db4a0da4921d77792` |

- Google Fonts answers with these variable files only to a recent browser: the style sheets were asked with the `User-Agent` of a current Chrome.
- The Latin subset of Google Fonts covers English and French (`é è ê ë à â ç î ï ô û ù ü ÿ œ æ « » ’ … – —` and the no-break space): `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`. A character outside it (another alphabet in a text printed by a learner) falls back to a font of the system.
- Neither subset has `← → ✓` nor the narrow no-break space (`U+202F`), and Fredoka has no arrow at all: the interface draws its arrows and its check marks as icons, never as characters.
- Manrope has figures of one width (`tnum`), Fredoka and Source Code Pro none (every character of Source Code Pro has one width). Manrope draws `->`, `<-` and `--` as one sign by default (`liga`): code is never set in Manrope.

## The licenses

The three fonts are under the [SIL Open Font License 1.1](https://openfontlicense.org/) (OFL): free to use, bundle, redistribute and modify, in a paid product as well; the font can't be sold alone, and a modified version stays under the OFL.

| Font | Copyright notice | Reserved font name | License file, from |
|---|---|---|---|
| Fredoka | Copyright 2016 The Fredoka Project Authors (https://github.com/hafontia/Fredoka-One) | None | `fredoka/OFL.txt`: `ofl/fredoka/OFL.txt` of [google/fonts](https://github.com/google/fonts), `main` at `7af0d90` |
| Manrope | Copyright 2018 The Manrope Project Authors (https://github.com/googlefonts/manrope) | None | `manrope/OFL.txt`: `ofl/manrope/OFL.txt` of google/fonts, `main` at `7af0d90` |
| Source Code Pro | © 2023 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source' | **Source** | `source-code-pro/LICENSE.md`: `LICENSE.md` of adobe-fonts/source-code-pro, `release` at `803b7e2` |

What the license asks of a website that serves the files (the text of the license and the [OFL FAQ](https://openfontlicense.org/ofl-faq/), version 1.1-update8):

- **The copyright notice and the license go with each copy** (condition 2), as text files or in the fields of the font. Serving a font to the browsers with `@font-face` is a distribution, recommended and allowed (FAQ 2.1), and not an embedding (FAQ 2.10): the text of the license is due (FAQ 1.10). Each file has its notice in its fields; the license file beside it is deployed with it.
- **A modified version can't keep a reserved font name** without a written permission of the copyright holder (condition 3). Reducing a font to a subset is a modification (FAQ 2.6), and so is a change of format, except the WOFF compression of unchanged data (FAQ 2.2).
- **Fredoka and Manrope** reserve no name (no name is reserved by default, FAQ 5.7): their Latin subsets, made by Google Fonts, keep their names freely.
- **Source Code Pro** reserves *Source*. Google Fonts serves subsets of it under its name through an agreement with Adobe (the [guide of Google Fonts](https://googlefonts.github.io/gf-guide/license-file.html): *"a legal agreement needs to be made between Google Fonts and the copyright holders. This is the case for all Adobe's and SIL's fonts"*). Nothing public says that this agreement covers a website that hosts those subsets itself, and no public statement of Adobe allows it ([an open question](https://github.com/google/fonts/issues/9894) at google/fonts, without answer). The file of Stepwise is therefore the complete one that Adobe publishes itself, unmodified: an original version, to which the reserved name doesn't apply. It costs 68 kB more than the subset (22,044 bytes), downloaded once.

## Rejected

- **The npm packages of Fontsource** (`@fontsource-variable/fredoka` 5.3.0, `@fontsource-variable/manrope` 5.3.0, `@fontsource-variable/source-code-pro` 5.3.1): their files are the ones of Google Fonts, byte for byte for Fredoka and Source Code Pro, one version late for Manrope (4.504). Their style sheets set `font-display: swap` with no way to change it but to write our own `@font-face`, and bring every alphabet (6 files for Manrope, 7 for Source Code Pro). The license file of their Source Code Pro starts with *Google Inc.*, without the notice of Adobe nor its reserved name. Three dependencies for three files that seldom change.
- **One file per weight**: 8 files and 112,540 bytes for the weights the interface uses, against 76,612 for the three variable files in their Latin subsets.
- **The subset of Source Code Pro**, from Google Fonts or Fontsource: see above.

## Risks accepted by the owner

- **None known on the licenses**, with the complete file of Adobe (decided on 2026-11-16). This note is not legal advice: to have read by a professional before a paid release, with the [content license](../roadmap.md) of step 26.
- **The files are updated by hand.** A new version of a font is a new download from the same sources, its size, its checksum and its version written here, and the license file compared again.
