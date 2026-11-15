// Written by make-sounds.py: the sounds it made, by kind, with their file, their mean level in dB
// and their length in seconds. Run it again rather than editing this file.

const MADE_SOUNDS = {
  success: {
    made61: { title: "61. Chirps", source: "made", temperature: "high", file: "made-61-chirps.ogg", mean: -20.0, length: 0.47 },
    made62: { title: "62. Coin and sparkle", source: "made", temperature: "high", file: "made-62-coin-and-sparkle.ogg", mean: -20.0, length: 0.5 },
    made63: { title: "63. Robot voice: wa-hoo", source: "made", temperature: "high", file: "made-63-robot-voice-wa-hoo.ogg", mean: -20.0, length: 0.55 },
    made64: { title: "64. Kalimba and echo", source: "made", temperature: "high", file: "made-64-kalimba-and-echo.ogg", mean: -20.0, length: 0.94 },
    made65: { title: "65. Fireworks", source: "made", temperature: "explosive", file: "made-65-fireworks.ogg", mean: -20.0, length: 1.1 },
    made66: { title: "66. Laser fanfare", source: "made", temperature: "explosive", file: "made-66-laser-fanfare.ogg", mean: -20.0, length: 1.04 },
    made67: { title: "67. Glitter spiral", source: "made", temperature: "explosive", file: "made-67-glitter-spiral.ogg", mean: -20.0, length: 1.31 },
    made68: { title: "68. Supersaw stab", source: "made", temperature: "explosive", file: "made-68-supersaw-stab.ogg", mean: -20.0, length: 0.8 },
  },
  failure: {
    made69: { title: "69. Robot voice: uh-oh", source: "made", temperature: "high", file: "made-69-robot-voice-uh-oh.ogg", mean: -20.0, length: 0.51 },
    made70: { title: "70. Deflating blips", source: "made", temperature: "high", file: "made-70-deflating-blips.ogg", mean: -20.0, length: 0.71 },
    made71: { title: "71. Kalimba down", source: "made", temperature: "high", file: "made-71-kalimba-down.ogg", mean: -20.0, length: 0.75 },
    made72: { title: "72. Little sigh", source: "made", temperature: "high", file: "made-72-little-sigh.ogg", mean: -20.0, length: 0.57 },
    made73: { title: "73. Power down", source: "made", temperature: "explosive", file: "made-73-power-down.ogg", mean: -20.0, length: 0.74 },
    made74: { title: "74. Glitch stutter", source: "made", temperature: "explosive", file: "made-74-glitch-stutter.ogg", mean: -20.0, length: 1.02 },
    made75: { title: "75. Wobble droop", source: "made", temperature: "explosive", file: "made-75-wobble-droop.ogg", mean: -20.0, length: 0.79 },
    made76: { title: "76. Tape stop", source: "made", temperature: "explosive", file: "made-76-tape-stop.ogg", mean: -20.0, length: 0.76 },
  },
  bump: {
    made77: { title: "77. Spring", source: "made", temperature: "high", file: "made-77-spring.ogg", mean: -20.0, length: 0.41 },
    made78: { title: "78. Tin clank", source: "made", temperature: "high", file: "made-78-tin-clank.ogg", mean: -20.0, length: 0.23 },
    made79: { title: "79. Cartoon bonk", source: "made", temperature: "high", file: "made-79-cartoon-bonk.ogg", mean: -20.0, length: 0.06 },
    made80: { title: "80. Squeak", source: "made", temperature: "high", file: "made-80-squeak.ogg", mean: -20.0, length: 0.15 },
    made81: { title: "81. Crash and bolts", source: "made", temperature: "explosive", file: "made-81-crash-and-bolts.ogg", mean: -20.0, length: 0.63 },
    made82: { title: "82. Crushed smash", source: "made", temperature: "explosive", file: "made-82-crushed-smash.ogg", mean: -20.0, length: 0.24 },
    made83: { title: "83. Electric zap", source: "made", temperature: "explosive", file: "made-83-electric-zap.ogg", mean: -24.3, length: 0.29 },
    made84: { title: "84. Gong", source: "made", temperature: "explosive", file: "made-84-gong.ogg", mean: -20.0, length: 0.87 },
  },
  move: {
    made85: { title: "85. Soft whirr", source: "made", temperature: "calm", parts: { forward: { file: "made-85-soft-whirr-forward.ogg", mean: -20.0 }, turn: { file: "made-85-soft-whirr-turn.ogg", mean: -20.0 } }, length: 0.3 },
    made86: { title: "86. Servo", source: "made", temperature: "calm", parts: { forward: { file: "made-86-servo-forward.ogg", mean: -20.0 }, turn: { file: "made-86-servo-turn.ogg", mean: -20.0 } }, length: 0.3 },
    made87: { title: "87. Tracks", source: "made", temperature: "calm", parts: { forward: { file: "made-87-tracks-forward.ogg", mean: -20.0 }, turn: { file: "made-87-tracks-turn.ogg", mean: -21.5 } }, length: 0.29 },
    made88: { title: "88. Tiny blip", source: "made", temperature: "calm", parts: { forward: { file: "made-88-tiny-blip-forward.ogg", mean: -20.0 }, turn: { file: "made-88-tiny-blip-turn.ogg", mean: -20.0 } }, length: 0.04 },
    made89: { title: "89. Hover hum", source: "made", temperature: "calm", parts: { forward: { file: "made-89-hover-hum-forward.ogg", mean: -20.0 }, turn: { file: "made-89-hover-hum-turn.ogg", mean: -20.0 } }, length: 0.3 },
  },
};
