#!/usr/bin/env python3
"""Makes sounds for the sheet (step 11b), the workshop of new sounds: each sound is a small recipe
built from the blocks below (oscillators, frequency modulation, noise, filters, a plucked string, a
voice, echoes), written to an Ogg Vorbis file in sounds/, and the list of the sounds made to
sounds-made.js, which the page reads. Python's standard library alone, and ffmpeg to
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

# The two sounds chosen on 2026-11-15 among the ones this script made (the others are in the commits
# of pull request #45), ported to the Web Audio API in sound.js with the same curves and level.

def bump_spring():
    """77. Spring: a low tone and its partial that wobble 18 times a second and settle, and a click."""
    out = tone(0.45, lambda t: 180 + 60 * math.exp(-7 * t) * math.sin(TAU * 18 * t), curve=4)
    place(out, tone(0.25, lambda t: 432 + 120 * math.exp(-8 * t) * math.sin(TAU * 18 * t), curve=5), 0, 0.3)
    place(out, mul(highpass(noise(0.005), 2000), env(0.005, 0.0005, 3)), 0, 0.5)
    return out


def move_blip(notes):
    """88. Tiny blip: one short note per name, 60 ms apart, that rises a little."""
    out = []
    for index, note in enumerate(notes):
        place(out, tone(0.04, lambda t, f=hz(note): f * (1 + 0.15 * t / 0.04), curve=4), 0.06 * index)
    return out + [0.0] * n_of(0.05)


# The sounds made, by kind: [number, short title, recipe]. A move has a sound for `forward()` and one
# for a turn.
SOUNDS = {
    "bump": [
        (77, "Spring", bump_spring),
    ],
    "move": [
        (88, "Tiny blip", (lambda: move_blip(["E5"]), lambda: move_blip(["G5", "E5"]))),
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
        for number, title, recipe in sounds:
            name = f"made-{number}-{slug(title)}"
            random.seed(name)
            if kind == "move":
                forward, turn = recipe
                parts = {"forward": write(forward(), f"{name}-forward.ogg"), "turn": write(turn(), f"{name}-turn.ogg")}
                entry = f'parts: {{ forward: {{ file: "{parts["forward"]["file"]}", mean: {parts["forward"]["mean"]} }}, turn: {{ file: "{parts["turn"]["file"]}", mean: {parts["turn"]["mean"]} }} }}, length: {parts["forward"]["length"]}'
            else:
                made = write(recipe(), f"{name}.ogg")
                entry = f'file: "{made["file"]}", mean: {made["mean"]}, length: {made["length"]}'
            entries.append(f'    made{number}: {{ title: "{number}. {title}, file", {entry} }},')
            print(f"{number} {title}")
        lines.append(f"  {kind}: {{\n" + "\n".join(entries) + "\n  },")
    (HERE / "sounds-made.js").write_text(
        "// Written by make-sounds.py: the sounds it made, by kind, with their file, their mean level in dB\n"
        "// and their length in seconds. Run it again rather than editing this file.\n\n"
        "const MADE_SOUNDS = {\n" + "\n".join(lines) + "\n};\n")


if __name__ == "__main__":
    main()
