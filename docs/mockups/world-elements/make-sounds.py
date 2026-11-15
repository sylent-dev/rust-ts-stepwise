#!/usr/bin/env python3
"""Makes the sounds of the sheet that no library gives (step 11b): each sound is a small recipe of
oscillators, noise, filters and echoes, written to an Ogg Vorbis file in sounds/, and the list of the
sounds made to sounds-made.js, which the page reads. Python's standard library alone, and ffmpeg to
encode the files. From the repository root:

    python3 docs/mockups/world-elements/make-sounds.py

The same recipe always gives the same file: the noise is seeded by the name of the sound. Every
sound is brought to the same mean level (-20 dB), so that a louder sound doesn't win by its
loudness alone; the page plays the sounds of the moves quieter.
"""

import math
import pathlib
import random
import subprocess
import tempfile
import wave

SR = 44100
TAU = 2 * math.pi
HERE = pathlib.Path(__file__).parent
OUT = HERE / "sounds"
LEVEL = -20.0


# --- Building blocks -------------------------------------------------------------------------

def n_of(seconds):
    return int(round(seconds * SR))


def hz(name):
    """The frequency of a note such as "C5" or "F#4"."""
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    midi = 12 * (int(name[-1]) + 1) + names[name[:-1]]
    return 440 * 2 ** ((midi - 69) / 12)


def osc(dur, freq, shape="sine"):
    """An oscillator; `freq` is a number or a function of the time in seconds."""
    out = [0.0] * n_of(dur)
    phase = 0.0
    step = None if callable(freq) else freq / SR
    for i in range(len(out)):
        phase += step if step is not None else freq(i / SR) / SR
        phase -= math.floor(phase)
        if shape == "sine":
            out[i] = math.sin(TAU * phase)
        elif shape == "tri":
            out[i] = 4 * abs(phase - 0.5) - 1
        elif shape == "saw":
            out[i] = 2 * phase - 1
        else:
            out[i] = 1.0 if phase < 0.5 else -1.0
    return out


def env(dur, attack=0.005, curve=5.0, hold=0.0):
    """A level that rises in `attack`, holds, then dies out to zero at the end of `dur`."""
    attack = max(attack, 1 / SR)
    rest = max(dur - attack - hold, 1e-6)
    out = []
    for i in range(n_of(dur)):
        t = i / SR
        if t < attack:
            out.append(t / attack)
        elif t < attack + hold:
            out.append(1.0)
        else:
            x = min((t - attack - hold) / rest, 1.0)
            out.append(math.exp(-curve * x) * (1 - x))
    return out


def mul(a, b):
    return [x * y for x, y in zip(a, b)]


def gain(sig, g):
    return [x * g for x in sig]


def place(track, sig, at=0.0, level=1.0):
    """Adds `sig` into `track` from `at` seconds, growing the track as needed."""
    start = n_of(at)
    if len(track) < start + len(sig):
        track.extend([0.0] * (start + len(sig) - len(track)))
    for i, x in enumerate(sig):
        track[start + i] += x * level
    return track


def tone(dur, freq, shape="sine", attack=0.005, curve=5.0, hold=0.0):
    return mul(osc(dur, freq, shape), env(dur, attack, curve, hold))


def fm(dur, freq, ratio, index, attack=0.003, curve=5.0, index_curve=6.0):
    """A frequency-modulated tone, whose brightness (`index`) dies out faster than its level."""
    level = env(dur, attack, curve)
    out = []
    carrier = modulator = 0.0
    for i in range(len(level)):
        t = i / SR
        f = freq(t) if callable(freq) else freq
        carrier += f / SR
        modulator += f * ratio / SR
        depth = index * math.exp(-index_curve * t / dur)
        out.append(math.sin(TAU * carrier + depth * math.sin(TAU * modulator)) * level[i])
    return out


def noise(dur):
    return [random.uniform(-1, 1) for _ in range(n_of(dur))]


def lowpass(sig, cutoff):
    """A one-pole low-pass filter; `cutoff` is a number or a function of the time."""
    out = []
    y = 0.0
    for i, x in enumerate(sig):
        c = cutoff(i / SR) if callable(cutoff) else cutoff
        y += (1 - math.exp(-TAU * c / SR)) * (x - y)
        out.append(y)
    return out


def highpass(sig, cutoff):
    return [x - y for x, y in zip(sig, lowpass(sig, cutoff))]


def svf(sig, cutoff, q=1.0, mode="band"):
    """A resonant state-variable filter (Chamberlin): "low", "band" or "high"."""
    out = []
    low = band = 0.0
    damp = 1 / q
    for i, x in enumerate(sig):
        c = cutoff(i / SR) if callable(cutoff) else cutoff
        f = 2 * math.sin(math.pi * min(c, SR / 6) / SR)
        low += f * band
        high = x - low - damp * band
        band += f * high
        out.append(band if mode == "band" else low if mode == "low" else high)
    return out


def pluck(freq, dur, damping=0.996, bright=0.5):
    """A plucked string (Karplus-Strong): a burst of noise that a short delay tunes and softens."""
    period = max(2, int(SR / freq))
    buf = [random.uniform(-1, 1) for _ in range(period)]
    out = []
    for i in range(n_of(dur)):
        j = i % period
        out.append(buf[j])
        buf[j] = damping * (bright * buf[j] + (1 - bright) * buf[(j + 1) % period])
    return out


def echo(sig, delay, feedback=0.35, wet=0.4, tail=0.5):
    x = sig + [0.0] * n_of(tail)
    d = n_of(delay)
    y = list(x)
    for i in range(d, len(y)):
        y[i] += feedback * y[i - d]
    return [a + wet * (b - a) for a, b in zip(x, y)]


def reverb(sig, wet=0.25, tail=0.6):
    """A small room (Schroeder): four combs side by side, then two all-passes."""
    x = sig + [0.0] * n_of(tail)
    total = [0.0] * len(x)
    for delay, feedback in ((1557, 0.77), (1617, 0.75), (1491, 0.78), (1422, 0.76)):
        y = [0.0] * len(x)
        for i in range(len(x)):
            y[i] = x[i] + (feedback * y[i - delay] if i >= delay else 0.0)
            total[i] += y[i] / 4
    for delay in (225, 556):
        y = [0.0] * len(total)
        for i in range(len(total)):
            back = total[i - delay] if i >= delay else 0.0
            yb = y[i - delay] if i >= delay else 0.0
            y[i] = -0.5 * total[i] + back + 0.5 * yb
        total = y
    return [a + wet * b for a, b in zip(x, total)]


def crush(sig, bits, hold=1):
    """Fewer levels and a lower sample rate: the grain of old consoles."""
    steps = 2 ** (bits - 1)
    out = []
    v = 0.0
    for i, x in enumerate(sig):
        if i % hold == 0:
            v = round(x * steps) / steps
        out.append(v)
    return out


def drive(sig, amount):
    k = math.tanh(amount)
    return [math.tanh(amount * x) / k for x in sig]


def varispeed(sig, rate):
    """Reads `sig` at a speed that changes over time, as a tape: slower is lower."""
    out = []
    pos = 0.0
    while pos < len(sig) - 1:
        j = int(pos)
        frac = pos - j
        out.append(sig[j] * (1 - frac) + sig[j + 1] * frac)
        r = rate(len(out) / SR)
        if r <= 0.02:
            break
        pos += r
    return out


FORMANTS = {"a": (800, 1150, 2900), "e": (400, 1700, 2600), "i": (300, 2200, 3000), "o": (450, 800, 2800), "u": (330, 700, 2600)}


def voice(dur, pitch, vowels, vibrato=(5.5, 0.012)):
    """A small robot voice: a sawtooth through three formants, the vowel moving along `vowels`,
    a list of (fraction of the duration, vowel)."""
    rate, depth = vibrato
    source = osc(dur, lambda t: pitch(t) * (1 + depth * math.sin(TAU * rate * t)), "saw")

    def formant(k):
        def at(t):
            x = t / dur
            for (x0, v0), (x1, v1) in zip(vowels, vowels[1:]):
                if x <= x1:
                    w = 0 if x1 == x0 else max(0.0, (x - x0) / (x1 - x0))
                    return FORMANTS[v0][k] * (1 - w) + FORMANTS[v1][k] * w
            return FORMANTS[vowels[-1][1]][k]
        return at

    out = [0.0] * len(source)
    for k, level in ((0, 1.0), (1, 0.6), (2, 0.3)):
        place(out, svf(source, formant(k), q=8), 0, level)
    return mul(out, env(dur, 0.02, 2.5))


def clicks(dur, rate, click):
    """Clicks whose rate (per second, a function of the time) follows a speed."""
    track = [0.0] * n_of(dur)
    count = 0.0
    for i in range(len(track)):
        before = count
        count += rate(i / SR) / SR
        if math.floor(count) > math.floor(before):
            place(track, click(int(count)), i / SR)
    return track[: n_of(dur)]


# --- The sounds --------------------------------------------------------------------------------

# The speed of the robot during its action, from 0 to 1: a move starts and stops gently; a turn
# starts at once and settles (the easings of motion.js).
MOVE = 0.3
def forward_speed(t):
    return math.sin(math.pi * min(t / MOVE, 1)) ** 2
def turn_speed(t):
    return max(0.0, 1 - t / MOVE) ** 1.5


def success_chirps():
    out = []
    for index, (a, b) in enumerate([(880, 1320), (990, 1480), (1175, 1760), (1320, 2000)]):
        place(out, fm(0.06, lambda t, a=a, b=b: a + (b - a) * t / 0.06, 2, 2), 0.075 * index)
    place(out, fm(0.18, lambda t: 1760 * (1 + 0.03 * math.sin(TAU * 18 * t)), 2, 1.5, curve=3), 0.3)
    return out


def success_coin():
    out = place([], tone(0.07, hz("B5"), "square", hold=0.05, curve=1), 0, 0.5)
    place(out, tone(0.35, hz("E6"), "square", curve=4), 0.07, 0.5)
    return echo(lowpass(out, 5000), 0.09, 0.3, 0.35, 0.3)


def success_voice():
    out = place([], voice(0.18, lambda t: hz("C4") + 40 * t / 0.18, [(0, "u"), (0.6, "a"), (1, "a")]), 0)
    breath = mul(svf(noise(0.05), 1800, 2), env(0.05, 0.01, 3))
    place(out, breath, 0.19, 0.4)
    place(out, voice(0.36, lambda t: hz("E4") + (hz("A4") - hz("E4")) * min(t / 0.2, 1), [(0, "u"), (1, "u")], (6, 0.02)), 0.21)
    return out


def success_kalimba():
    out = []
    for index, note in enumerate(["C5", "E5", "G5", "C6"]):
        place(out, pluck(hz(note), 0.5, 0.997, 0.3), [0, 0.08, 0.16, 0.26][index], 1 if index < 3 else 1.2)
    return echo(out, 0.12, 0.35, 0.35, 0.3)


def success_fireworks():
    out = []
    rise = mul(svf(noise(0.35), lambda t: 400 * 15 ** (t / 0.35), 3), [(i / n_of(0.35)) ** 2 for i in range(n_of(0.35))])
    place(out, rise, 0, 0.6)
    place(out, tone(0.3, lambda t: 80 * 0.5 ** (t / 0.3), curve=4), 0.35, 1.0)
    place(out, mul(lowpass(noise(0.25), 1500), env(0.25, 0.002, 6)), 0.35, 0.8)
    for note in ("C6", "E6", "G6"):
        place(out, fm(0.7, hz(note), 3.5, 1.2, curve=4), 0.37, 0.25)
    for _ in range(45):
        at = 0.4 + 0.7 * random.random() ** 1.6
        crack = mul(highpass(noise(0.004), 3000), env(0.004, 0.0005, 3))
        place(out, crack, at, 0.9 * (1.1 - (at - 0.4) / 0.7))
    return out


def success_laser_fanfare():
    out = []
    for at, notes in ((0, ("C5", "E5", "G5")), (0.42, ("C6", "E6", "G6"))):
        for note in notes:
            f = hz(note)
            sweep = lambda t, f=f: f * (0.5 + 0.5 * min(t / 0.08, 1)) * (1 + 0.01 * math.sin(TAU * 6 * t))
            place(out, tone(0.4 if at == 0 else 0.5, sweep, "saw", 0.005, 3, 0.15), at, 0.3)
    out = lowpass(out, lambda t: 1200 + 5000 * min(t / 0.5, 1))
    return echo(crush(out, 6, 3), 0.11, 0.3, 0.35, 0.35)


def success_glitter():
    out = []
    sweep = osc(0.8, lambda t: 400 * 7.5 ** (t / 0.8))
    place(out, mul(mul(sweep, osc(0.8, 1700)), env(0.8, 0.05, 3)), 0, 0.5)
    scale = [hz(n) for n in ("C6", "D6", "E6", "G6", "A6", "C7", "D7", "E7")]
    for index in range(55):
        at = 0.9 * index / 55 + random.uniform(-0.02, 0.02)
        place(out, tone(0.03, random.choice(scale[index * len(scale) // 55:]), curve=4), max(at, 0), 0.35)
    return reverb(out, 0.3, 0.4)


def success_supersaw():
    out = []
    for note in ("C4", "E4", "G4", "C5"):
        for detune in (-0.012, -0.008, -0.004, 0, 0.004, 0.008, 0.012):
            place(out, osc(0.5, hz(note) * (1 + detune), "saw"), 0, 0.08)
    out = mul(out, env(0.5, 0.004, 1.2, 0.3))
    out = svf(out, lambda t: 300 + 7700 * min(t / 0.15, 1) - 5000 * max(0.0, min((t - 0.15) / 0.3, 1)), 1.4, "low")
    place(out, tone(0.08, lambda t: 150 * 0.3 ** (t / 0.08), curve=3), 0, 1.0)
    return reverb(out, 0.3, 0.5)


def failure_voice():
    out = place([], voice(0.16, lambda t: hz("E4"), [(0, "a"), (1, "u")]), 0)
    place(out, voice(0.32, lambda t: hz("C#4") - 10 * t / 0.32, [(0, "o"), (1, "o")], (5, 0.015)), 0.2)
    return out


def failure_deflate():
    out = []
    at = 0.0
    for index, (a, b) in enumerate([(660, 600), (520, 470), (400, 350), (300, 200)]):
        dur = 0.06 + 0.05 * index
        place(out, fm(dur, lambda t, a=a, b=b, d=dur: a + (b - a) * t / d, 1.5, 1.5, curve=3), at)
        at += dur + 0.03 * (index + 1)
    return out


def failure_kalimba():
    out = []
    for at, note in ((0, "A4"), (0.14, "F4"), (0.3, "D4")):
        place(out, pluck(hz(note), 0.45, 0.996, 0.35), at)
    return out


def failure_sigh():
    breath = mul(svf(noise(0.6), lambda t: 900 - 350 * t / 0.6, 4), env(0.6, 0.12, 3))
    hum = tone(0.6, lambda t: 300 - 100 * t / 0.6, attack=0.1, curve=3)
    return place(gain(breath, 0.8), hum, 0, 0.25)


def failure_power_down():
    f = lambda t: 520 * (30 / 520) ** (t / 0.8)
    out = place(osc(0.8, f, "saw"), osc(0.8, lambda t: f(t) / 2, "square"), 0, 0.5)
    out = mul(lowpass(out, lambda t: 4000 * (200 / 4000) ** (t / 0.8)), env(0.8, 0.005, 1.5))
    return crush(out, 7, 2)


def failure_glitch():
    phrase = place(tone(0.2, hz("G4"), "square", curve=2), tone(0.3, hz("E4"), "square", curve=2), 0.2)
    phrase = lowpass(phrase, 3000)
    slice_len = n_of(0.025)
    out = []
    pos = 0
    while pos < len(phrase):
        piece = phrase[pos: pos + slice_len]
        for _ in range(random.choice((1, 1, 2, 3))):
            out.extend(piece)
        if random.random() < 0.3:
            out.extend(varispeed(piece, lambda t: 0.6))
        pos += slice_len
    return crush(out, 5, 2)


def failure_wobble():
    lfo = lambda t: 8 - 5 * t / 0.8
    phase = [0.0]
    def cutoff(t):
        phase[0] += lfo(t) / SR
        return 200 + 1800 * (0.5 + 0.5 * math.sin(TAU * phase[0]))
    out = osc(0.8, lambda t: 110 * 0.5 ** (t / 0.8), "saw")
    out = drive(svf(out, cutoff, 6, "low"), 2.5)
    return mul(out, env(0.8, 0.01, 1.5, 0.2))


def failure_tape_stop():
    phrase = []
    for at, note in ((0, "C5"), (0.12, "E5"), (0.24, "G5")):
        place(phrase, tone(0.5, hz(note), "tri", curve=2), at, 0.6)
        place(phrase, tone(0.5, hz(note) * 2, "saw", curve=4), at, 0.08)
    return varispeed(phrase, lambda t: 1.0 if t < 0.3 else max(0.0, 1 - (t - 0.3) / 0.5) ** 1.5)


def bump_spring():
    out = tone(0.45, lambda t: 180 + 60 * math.exp(-7 * t) * math.sin(TAU * 18 * t), curve=4)
    place(out, tone(0.25, lambda t: 432 + 120 * math.exp(-8 * t) * math.sin(TAU * 18 * t), curve=5), 0, 0.3)
    place(out, mul(highpass(noise(0.005), 2000), env(0.005, 0.0005, 3)), 0, 0.5)
    return out


def bump_tin():
    return place(fm(0.3, 620, 1.41, 6, curve=6, index_curve=10), fm(0.25, 1130, 2.73, 3, curve=7), 0, 0.5)


def bump_bonk():
    knock = svf(mul(noise(0.005), env(0.005, 0.0005, 2)) + [0.0] * n_of(0.2), 900, 25)
    return place(gain(knock, 0.4), tone(0.06, lambda t: 520 - 190 * t / 0.06, curve=3), 0, 0.6)


def bump_squeak():
    pitch = lambda t: 900 + 400 * math.sin(math.pi * min(t / 0.1, 1)) - 300 * max(0.0, (t - 0.1) / 0.06)
    return voice(0.16, pitch, [(0, "i"), (1, "u")], (0, 0))


def bump_crash():
    out = tone(0.15, lambda t: 90 * 0.45 ** (t / 0.15), curve=3)
    place(out, mul(lowpass(noise(0.12), 2000), env(0.12, 0.002, 5)), 0, 0.8)
    for index in range(6):
        at = 0.1 + 0.5 * random.random()
        place(out, fm(0.06, random.uniform(2000, 5000), 1.6, 2, curve=6), at, 0.4 * (1 - index / 8))
    return out


def bump_smash():
    out = tone(0.3, lambda t: 70 * 0.6 ** (t / 0.3), curve=4)
    place(out, mul(lowpass(noise(0.25), 3000), env(0.25, 0.002, 5)), 0, 0.9)
    return crush(drive(out, 8), 4, 6)


def bump_zap():
    jitter = [120.0]
    def f(t):
        if int(t * SR) % n_of(0.005) == 0:
            jitter[0] = 120 * random.uniform(0.4, 1.6)
        return jitter[0]
    out = highpass(osc(0.3, f, "saw"), 300)
    out = mul(out, [1.0 if random.random() < 0.85 else 0.0 for _ in out])
    return mul(out, env(0.3, 0.002, 3))


def bump_gong():
    out = []
    for ratio, level, swell in ((1, 1.0, 0.003), (1.48, 0.6, 0.03), (2.19, 0.45, 0.06), (2.83, 0.3, 0.1), (3.6, 0.2, 0.12)):
        place(out, tone(0.9, 110 * ratio * random.uniform(0.997, 1.003), attack=swell, curve=3), 0, level)
    return out


def move_whirr(speed, base):
    def s(t):
        return speed(t)
    sig = place(osc(MOVE, lambda t: base + 60 * s(t), "tri"), osc(MOVE, lambda t: 2.02 * (base + 60 * s(t))), 0, 0.3)
    place(sig, lowpass(noise(MOVE), lambda t: 200 + 900 * s(t)), 0, 0.8)
    return mul(sig, [s(i / SR) ** 0.6 for i in range(n_of(MOVE))])


def move_servo(speed, base):
    sig = lowpass(osc(MOVE, lambda t: base + 260 * speed(t), "square"), 1800)
    place(sig, osc(MOVE, lambda t: 2 * (base + 260 * speed(t))), 0, 0.2)
    sig = mul(sig, [0.15 + 0.85 * speed(i / SR) ** 0.5 for i in range(n_of(MOVE))])
    return mul(sig, env(MOVE, 0.01, 1, 0.2))


def move_tracks(speed, alternate):
    def click(index):
        f = 2600 if alternate and index % 2 else 2000
        return gain(svf(mul(noise(0.004), env(0.004, 0.0005, 2)), f, 5), 0.6)
    sig = clicks(MOVE, lambda t: 40 * speed(t), click)
    rumble = mul(lowpass(noise(MOVE), 150), [speed(i / SR) for i in range(n_of(MOVE))])
    return place(sig, rumble, 0, 1.5)


def move_blip(notes):
    out = []
    for index, note in enumerate(notes):
        place(out, tone(0.04, lambda t, f=hz(note): f * (1 + 0.15 * t / 0.04), curve=4), 0.06 * index)
    return out + [0.0] * n_of(0.05)


def move_hover(speed, tilt):
    def f(t):
        return 110 * (1 + tilt * speed(t))
    sig = place(osc(MOVE, f), osc(MOVE, lambda t: f(t) * 1.013), 0, 0.8)
    place(sig, osc(MOVE, lambda t: 2 * f(t), "tri"), 0, 0.15)
    return mul(sig, env(MOVE, 0.04, 1, 0.15))


# The sounds made, by kind: [number, short title, temperature, recipe]. The moves have a sound for
# `forward()` and one for a turn.
SOUNDS = {
    "success": [
        (61, "Chirps", "high", success_chirps),
        (62, "Coin and sparkle", "high", success_coin),
        (63, "Robot voice: wa-hoo", "high", success_voice),
        (64, "Kalimba and echo", "high", success_kalimba),
        (65, "Fireworks", "explosive", success_fireworks),
        (66, "Laser fanfare", "explosive", success_laser_fanfare),
        (67, "Glitter spiral", "explosive", success_glitter),
        (68, "Supersaw stab", "explosive", success_supersaw),
    ],
    "failure": [
        (69, "Robot voice: uh-oh", "high", failure_voice),
        (70, "Deflating blips", "high", failure_deflate),
        (71, "Kalimba down", "high", failure_kalimba),
        (72, "Little sigh", "high", failure_sigh),
        (73, "Power down", "explosive", failure_power_down),
        (74, "Glitch stutter", "explosive", failure_glitch),
        (75, "Wobble droop", "explosive", failure_wobble),
        (76, "Tape stop", "explosive", failure_tape_stop),
    ],
    "bump": [
        (77, "Spring", "high", bump_spring),
        (78, "Tin clank", "high", bump_tin),
        (79, "Cartoon bonk", "high", bump_bonk),
        (80, "Squeak", "high", bump_squeak),
        (81, "Crash and bolts", "explosive", bump_crash),
        (82, "Crushed smash", "explosive", bump_smash),
        (83, "Electric zap", "explosive", bump_zap),
        (84, "Gong", "explosive", bump_gong),
    ],
    "move": [
        (85, "Soft whirr", "calm", (lambda: move_whirr(forward_speed, 70), lambda: move_whirr(turn_speed, 90))),
        (86, "Servo", "calm", (lambda: move_servo(forward_speed, 180), lambda: move_servo(turn_speed, 300))),
        (87, "Tracks", "calm", (lambda: move_tracks(forward_speed, False), lambda: move_tracks(turn_speed, True))),
        (88, "Tiny blip", "calm", (lambda: move_blip(["E5"]), lambda: move_blip(["G5", "E5"]))),
        (89, "Hover hum", "calm", (lambda: move_hover(forward_speed, 0.08), lambda: move_hover(turn_speed, 0.15))),
    ],
}


# --- Writing -----------------------------------------------------------------------------------

def finish(sig):
    """Trims the silence at the end, softens both ends, and brings the mean level to LEVEL."""
    peak = max(abs(x) for x in sig) or 1.0
    end = len(sig)
    while end > 0 and abs(sig[end - 1]) < peak * 0.002:
        end -= 1
    sig = sig[: max(end, 1)]
    fade_in, fade_out = n_of(0.002), min(n_of(0.01), len(sig))
    for i in range(min(fade_in, len(sig))):
        sig[i] *= i / fade_in
    for i in range(fade_out):
        sig[len(sig) - 1 - i] *= i / fade_out
    rms = math.sqrt(sum(x * x for x in sig) / len(sig)) or 1.0
    peak = max(abs(x) for x in sig) or 1.0
    g = min(10 ** (LEVEL / 20) / rms, 0.95 / peak)
    return gain(sig, g), 20 * math.log10(rms * g)


def write(sig, name):
    sig, mean = finish(sig)
    with tempfile.TemporaryDirectory() as tmp:
        path = pathlib.Path(tmp) / "sound.wav"
        with wave.open(str(path), "wb") as file:
            file.setnchannels(1)
            file.setsampwidth(2)
            file.setframerate(SR)
            file.writeframes(b"".join(int(max(-1, min(1, x)) * 32767).to_bytes(2, "little", signed=True) for x in sig))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-c:a", "libvorbis", "-q:a", "5", "-fflags", "+bitexact", "-flags:a", "+bitexact", "-serial_offset", "1", str(OUT / name)], check=True)
    return {"file": name, "mean": round(mean, 1), "length": round(len(sig) / SR, 2)}


def slug(title):
    return "".join(c if c.isalnum() else "-" for c in title.lower().replace(":", "")).strip("-").replace("--", "-")


def main():
    OUT.mkdir(exist_ok=True)
    lines = []
    for kind, sounds in SOUNDS.items():
        entries = []
        for number, title, temperature, recipe in sounds:
            name = f"made-{number}-{slug(title)}"
            random.seed(name)
            if kind == "move":
                forward, turn = recipe
                parts = {"forward": write(forward(), f"{name}-forward.ogg"), "turn": write(turn(), f"{name}-turn.ogg")}
                entry = f'parts: {{ forward: {{ file: "{parts["forward"]["file"]}", mean: {parts["forward"]["mean"]} }}, turn: {{ file: "{parts["turn"]["file"]}", mean: {parts["turn"]["mean"]} }} }}, length: {parts["forward"]["length"]}'
            else:
                made = write(recipe(), f"{name}.ogg")
                entry = f'file: "{made["file"]}", mean: {made["mean"]}, length: {made["length"]}'
            source = "made"
            entries.append(f'    made{number}: {{ title: "{number}. {title}", source: "{source}", temperature: "{temperature}", {entry} }},')
            print(f"{number} {title}")
        lines.append(f"  {kind}: {{\n" + "\n".join(entries) + "\n  },")
    (HERE / "sounds-made.js").write_text(
        "// Written by make-sounds.py: the sounds it made, by kind, with their file, their mean level in dB\n"
        "// and their length in seconds. Run it again rather than editing this file.\n\n"
        "const MADE_SOUNDS = {\n" + "\n".join(lines) + "\n};\n")


if __name__ == "__main__":
    main()
