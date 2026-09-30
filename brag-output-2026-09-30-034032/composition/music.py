"""Trilha do Reel em capítulos, sintetizada do zero (sem música de terceiros).

120 BPM, Ré menor → Fá maior. Groove desde o primeiro quadro (o formato da
referência já começa com energia), respiro no cartão amarelo, paradas de um
tempo antes de cada corte e resolução no CTA. Os efeitos vêm de
../work/events.json, que render.mjs exporta de index.html: som e imagem saem
da mesma lista.

    uv run --with numpy --with scipy python music.py   →   ../work/music-raw.wav
"""
import json
import os
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d, uniform_filter1d

SR = 48000
DUR = 24.0
N = int(SR * DUR)
BEAT = 0.5
BAR = 2.0
rng = np.random.default_rng(11)

HERE = Path(__file__).resolve().parent
WORK = HERE.parent / 'work'
EVENTS = json.loads((WORK / 'events.json').read_text())

# Trechos com bateria: [início, fim). Fora deles, respiro.
GROOVE = [(0.0, 5.25), (7.0, 11.75), (12.0, 15.75), (16.0, 19.25), (19.5, 22.0)]


def in_groove(t):
    return any(a <= t < b for a, b in GROOVE)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def sos(kind, freq, order=2):
    return signal.butter(order, freq, btype=kind, fs=SR, output='sos')


def pan_gains(p):
    return np.sqrt((1 - p) / 2), np.sqrt((1 + p) / 2)


class Bus:
    def __init__(self):
        self.x = np.zeros((N, 2))

    def add(self, t0, sig, gain=1.0, pan=0.0):
        i = int(round(t0 * SR))
        if i >= N or i + len(sig) <= 0:
            return
        if sig.ndim == 1:
            gl, gr = pan_gains(pan)
            sig = np.stack([sig * gl, sig * gr], axis=1)
        if i < 0:
            sig, i = sig[-i:], 0
        j = min(N, i + len(sig))
        self.x[i:j] += sig[: j - i] * gain


CHORDS = [
    [50, 57, 60, 64, 65],  # 0–2   Dm9       01 · Para quem é
    [46, 53, 57, 60, 62],  # 2–4   Bbmaj9
    [55, 58, 62, 65, 69],  # 4–6   Gm9       (cartão amarelo no 5,5)
    [48, 55, 58, 62, 65],  # 6–8   C9sus4    02 · O método entra no 7,0
    [53, 57, 60, 64, 67],  # 8–10  Fmaj9
    [48, 55, 62, 64, 67],  # 10–12 Cadd9
    [50, 57, 60, 64, 65],  # 12–14 Dm9       03 · Prova real
    [46, 53, 57, 60, 62],  # 14–16 Bbmaj9
    [55, 58, 62, 65, 69],  # 16–18 Gm9       04 · Próximo passo
    [48, 55, 58, 62, 65],  # 18–20 C9sus4    (CTA no 19,5)
    [53, 57, 60, 64, 67],  # 20–22 Fmaj9
    [53, 57, 60, 64, 67],  # 22–24 Fmaj9     acorde final
]
ROOTS = [38, 34, 43, 36, 41, 36, 38, 34, 43, 36, 41, 41]
EP_VOICINGS = [
    [62, 65, 69, 72], [62, 65, 69, 70], [62, 65, 67, 70], [62, 65, 67, 70],
    [64, 65, 69, 72], [64, 67, 72, 74], [62, 65, 69, 72], [62, 65, 69, 70],
    [62, 65, 67, 70], [62, 65, 67, 70], [64, 65, 69, 72], [64, 65, 69, 72],
]


def pad_cutoff(t):
    return np.interp(t, [0, 5.2, 5.45, 5.6, 6.9, 7.0, 19.2, 19.45, 19.55, 24],
                     [2200, 2600, 1100, 1800, 2000, 3200, 3200, 1400, 3400, 3600])


def pad_note(f, t0, t1, amp, attack=0.5, release=1.0):
    n = int((t1 - t0 + release) * SR)
    tt = np.arange(n) / SR
    env = np.minimum(1.0, tt / attack)
    held = t1 - t0
    env = env * np.where(tt < held, 1.0, np.exp(-(tt - held) / (release / 4)))
    fc = pad_cutoff(t0 + tt)
    out = np.zeros((n, 2))
    for cents, p in ((-8, -0.7), (0, 0.0), (8, 0.7)):
        fv = f * 2 ** (cents / 1200)
        vib = 0.0015 * np.sin(2 * np.pi * (0.23 + 0.05 * p) * tt + rng.uniform(0, 6.28))
        sig = np.zeros(n)
        ph0 = rng.uniform(0, 2 * np.pi)
        for h in range(1, 18):
            fh = fv * h
            if fh > 9000:
                break
            g = (1.0 / h) / np.sqrt(1 + (fh / fc) ** 4)
            sig += g * np.sin(2 * np.pi * fh * tt * (1 + vib) + ph0 * h)
        gl, gr = pan_gains(p)
        out[:, 0] += sig * gl
        out[:, 1] += sig * gr
    return out * (env * amp / 3)[:, None]


def ep_note(f, dur, vel=1.0):
    n = int((dur + 1.6) * SR)
    tt = np.arange(n) / SR
    idx = 1.5 * np.exp(-tt / 0.22) + 0.22
    car = np.sin(2 * np.pi * f * tt + idx * np.sin(2 * np.pi * f * tt))
    tine = 0.10 * np.exp(-tt / 0.045) * np.sin(2 * np.pi * f * 7.0 * tt)
    amp = np.minimum(1.0, tt / 0.004) * np.exp(-tt / 1.3)
    amp *= np.where(tt < dur, 1.0, np.exp(-(tt - dur) / 0.14))
    return (car + tine) * amp * vel


def bass_note(f, dur, vel=1.0):
    n = int((dur + 0.08) * SR)
    tt = np.arange(n) / SR
    ph = 2 * np.pi * f * tt
    sig = np.tanh(1.5 * (np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph)))
    env = np.minimum(1.0, tt / 0.005)
    env *= np.where(tt < dur, 1 - 0.3 * tt / max(dur, 1e-3), 0.7 * np.exp(-(tt - dur) / 0.025))
    return sig * env * vel


def kick(vel=1.0):
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    f = 52 + 110 * np.exp(-tt / 0.030)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16)
    body += 0.35 * np.sin(2 * np.pi * 150 * tt) * np.exp(-tt / 0.03)
    click = signal.sosfilt(sos('highpass', 2500), rng.standard_normal(n)) * np.exp(-tt / 0.004) * 0.18
    return (body + click) * vel


def clap(vel=1.0):
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    noise = signal.sosfilt(sos('bandpass', [900, 4800]), rng.standard_normal(n))
    env = np.zeros(n)
    for k, d in enumerate((0.0, 0.010, 0.021)):
        env += np.where(tt >= d, np.exp(-(tt - d) / 0.006), 0) * (0.8 if k < 2 else 1.0)
    env += np.where(tt >= 0.021, np.exp(-(tt - 0.021) / 0.085), 0) * 0.55
    return noise * env * vel


def hat(open_=False, vel=1.0):
    n = int((0.35 if open_ else 0.12) * SR)
    tt = np.arange(n) / SR
    noise = signal.sosfilt(sos('highpass', 7200, 4), rng.standard_normal(n))
    return noise * np.exp(-tt / (0.12 if open_ else 0.028)) * vel


def shaker(vel=1.0):
    n = int(0.1 * SR)
    tt = np.arange(n) / SR
    noise = signal.sosfilt(sos('bandpass', [4200, 11000]), rng.standard_normal(n))
    return noise * np.minimum(1.0, tt / 0.012) * np.exp(-tt / 0.035) * vel


def marimba(f, vel=1.0):
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    sig = (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.45)
           + 0.30 * np.sin(2 * np.pi * f * 3.93 * tt) * np.exp(-tt / 0.08)
           + 0.08 * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt / 0.03))
    return sig * np.minimum(1.0, tt / 0.002) * vel


def ui_click(vel=1.0, freq=2600):
    n = int(0.03 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * tt) * np.exp(-tt / 0.004) * vel


def bell(f, vel=1.0):
    n = int(3.0 * SR)
    tt = np.arange(n) / SR
    idx = 1.3 * np.exp(-tt / 0.35)
    sig = np.sin(2 * np.pi * f * tt + idx * np.sin(2 * np.pi * f * 3.5 * tt))
    return sig * np.minimum(1.0, tt / 0.003) * np.exp(-tt / 1.6) * vel


def sweep_noise(dur, f_from, f_to, shape='rise'):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    bands = np.geomspace(f_from, f_to, 9)
    centers = np.linspace(0, dur, len(bands))
    width = dur / len(bands) * 1.6
    for fc, tc in zip(bands, centers):
        lo, hi = fc / 1.5, min(fc * 1.5, SR / 2 * 0.95)
        layer = signal.sosfilt(sos('bandpass', [lo, hi]), rng.standard_normal(n))
        out += layer * np.exp(-0.5 * ((tt - tc) / (width / 2)) ** 2)
    env = (tt / dur) ** 2 if shape == 'rise' else np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.5
    return out * env / (np.abs(out).max() + 1e-9)


def boom(big=True):
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    b = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-tt / 0.12)) / SR) * np.exp(-tt / (0.5 if big else 0.3))
    b += 0.4 * np.sin(2 * np.pi * 110 * tt) * np.exp(-tt / 0.06)
    b += signal.sosfilt(sos('lowpass', 900), rng.standard_normal(n)) * np.exp(-tt / 0.18) * 0.08
    return b * (0.6 if big else 0.35)


# ---------------------------------------------------------------- arranjo
drums, bass, keys, pad, sfx, send = Bus(), Bus(), Bus(), Bus(), Bus(), Bus()

for b, chord in enumerate(CHORDS):
    t0 = b * BAR
    t1 = min(DUR, t0 + BAR + 0.15) if b < len(CHORDS) - 1 else DUR - 0.2
    for m in chord:
        x = pad_note(mtof(m), t0, t1, amp=0.10)
        pad.add(t0, x)
        send.add(t0, x, 0.35)

kick_times = []
for i in range(int(DUR / BEAT)):
    t = i * BEAT
    beat_in_bar = i % 4
    if in_groove(t):
        drums.add(t, kick(0.95))
        kick_times.append(t)
        if beat_in_bar in (1, 3):
            c = clap(0.32)
            drums.add(t, c, pan=0.05)
            send.add(t, c, 0.5)
        drums.add(t + 0.25, hat(True, 0.12), pan=0.2)
        for s16, v in ((0.0, 0.05), (0.125, 0.03), (0.375, 0.035)):
            drums.add(t + s16, hat(False, v), pan=0.3)
    if in_groove(t) or 5.5 <= t < 7.0:
        # No cartão amarelo só o chocalho segue: o pulso não some.
        for s16 in (0.0, 0.125, 0.25, 0.375):
            drums.add(t + s16, shaker(0.035 if s16 else 0.05), pan=-0.35)

tt_all = np.arange(N) / SR
duck = np.ones(N)
for tk in kick_times:
    i = int(tk * SR)
    seg = tt_all[i:i + int(0.35 * SR)] - tk
    duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], 1 - 0.30 * np.exp(-seg / 0.11))

for b, root in enumerate(ROOTS):
    t0 = b * BAR
    if b == len(ROOTS) - 1:
        bass.add(22.0, bass_note(mtof(root), 1.3, 0.9))
        continue
    for k in range(4):
        t = t0 + k * BEAT + 0.25
        if in_groove(t):
            note = root + (12 if k == 3 and b % 2 else 0)
            bass.add(t, bass_note(mtof(note), 0.2, 0.85))

for b, voicing in enumerate(EP_VOICINGS):
    t0 = b * BAR
    if b == len(EP_VOICINGS) - 1:
        for j, m in enumerate(voicing):
            x = ep_note(mtof(m), 1.4, 0.22)
            keys.add(22.0 + j * 0.012, x, pan=-0.3 + 0.2 * j)
            send.add(22.0 + j * 0.012, x, 0.5)
        continue
    for off, dur, vel in ((0.0, 0.9, 0.2), (2.5 * BEAT, 0.25, 0.13)):
        t = t0 + off
        if not in_groove(t):
            continue
        for j, m in enumerate(voicing):
            x = ep_note(mtof(m), dur, vel)
            keys.add(t + j * 0.008, x, pan=-0.3 + 0.2 * j)
            send.add(t + j * 0.008, x, 0.3)

# ---------------------------------------------------------------- efeitos
for ev in EVENTS:
    t, kind = ev['t'], ev['kind']
    if kind in ('pop', 'pluck'):
        x = marimba(mtof(ev['note']), 0.16 if kind == 'pluck' else 0.13)
        sfx.add(t, x, pan=0.0)
        send.add(t, x, 0.45)
        sfx.add(t, ui_click(0.05), pan=0.1)
    elif kind == 'whoosh':
        w = sweep_noise(0.40, 500, 6000, 'swell') * 0.07
        sfx.add(t - 0.12, w)
        send.add(t - 0.12, w, 0.4)
    elif kind == 'swell':
        w = sweep_noise(0.30, 300, 5000, 'rise') * 0.09
        sfx.add(t - 0.18, w)
        send.add(t - 0.18, w, 0.5)
    elif kind == 'impact':
        x = boom(big=not ev.get('soft'))
        sfx.add(t, x)
        send.add(t, x, 0.3)
    elif kind == 'ticks':
        n, dur = ev['n'], ev['dur']
        # Odômetro: cliques cada vez mais espaçados, como o contador desacelerando.
        times = t + dur * (1 - (1 - np.linspace(0, 1, n)) ** 2)
        for k, tk in enumerate(times):
            v = (0.025 if ev.get('soft') else 0.04) * (1 - 0.3 * k / n)
            sfx.add(tk, ui_click(v, 2200 + 60 * (k % 3)), pan=(-0.2 if k % 2 else 0.2))
    elif kind == 'swish':
        s = signal.sosfilt(sos('bandpass', [1400, 6500]), rng.standard_normal(int(0.2 * SR)))
        tt = np.arange(len(s)) / SR
        s *= np.minimum(1.0, tt / 0.02) * np.exp(-tt / 0.06) * 0.07
        sfx.add(t, s, pan=ev.get('pan', 0))
        send.add(t, s, 0.3)
    elif kind == 'stamp':
        n = int(0.25 * SR)
        tt = np.arange(n) / SR
        s = np.sin(2 * np.pi * 130 * tt) * np.exp(-tt / 0.05) * 0.22
        sfx.add(t, s)
        sfx.add(t, ui_click(0.06, 1800))
    elif kind == 'chime':
        for f, v in ((mtof(89), 0.045), (mtof(96), 0.022)):
            x = bell(f, v)
            sfx.add(t, x, pan=0.1)
            send.add(t, x, 0.7)
    elif kind == 'shimmer':
        n = int(1.5 * SR)
        tt = np.arange(n) / SR
        sh = sum(np.sin(2 * np.pi * mtof(m) * tt) for m in (89, 93, 96)) / 3
        sh *= np.sin(np.pi * tt / 1.5) ** 2 * 0.018
        gl, gr = pan_gains(np.linspace(-0.7, 0.7, n))
        st = np.stack([sh * gl, sh * gr], axis=1)
        sfx.add(t, st)
        send.add(t, st, 0.8)

# ---------------------------------------------------------------- mix
def make_ir(rt60=2.0, predelay=0.024):
    n = int(rt60 * 1.3 * SR)
    tt = np.arange(n) / SR
    decay = np.exp(-6.91 * tt / rt60) * (1 - np.exp(-tt / 0.012))
    irs = []
    for _ in range(2):
        raw = rng.standard_normal(n) * decay
        dark = signal.sosfilt(sos('lowpass', 3200), raw)
        w = np.clip(tt / (rt60 * 0.6), 0, 1)
        ir = np.concatenate([np.zeros(int(predelay * SR)), raw * (1 - w) + dark * w])
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    return irs


keys.x *= (duck[:, None] * 0.35 + 0.65)
pad.x *= duck[:, None]
bass.x = signal.sosfilt(sos('lowpass', 1100, 4), bass.x, axis=0) * (duck[:, None] * 0.3 + 0.7)
trem = 0.18 * np.sin(2 * np.pi * 3.2 * tt_all)
keys.x[:, 0] *= 1 + trem
keys.x[:, 1] *= 1 - trem

irL, irR = make_ir()
wet_in = send.x.mean(axis=1)
wet = np.stack([signal.fftconvolve(wet_in, irL)[:N], signal.fftconvolve(wet_in, irR)[:N]], axis=1)
wet = signal.sosfilt(sos('highpass', 180), wet, axis=0)

drums.x = signal.sosfilt(sos('highpass', 42), drums.x, axis=0)
mix = drums.x * 0.50 + bass.x * 0.36 + keys.x * 0.62 + pad.x * 1.0 + sfx.x * 1.0 + wet * 0.55

if os.environ.get('LEVELS'):
    def db(x):
        return 20 * np.log10(np.sqrt(np.mean(x[int(7 * SR):int(19 * SR)] ** 2)) + 1e-12)
    for name, x in (('bateria', drums.x * 0.50), ('baixo', bass.x * 0.36), ('piano', keys.x * 0.62),
                    ('pad', pad.x * 1.0), ('efeitos', sfx.x), ('reverb', wet * 0.55)):
        print(f'{name:8s} RMS 7–19s {db(x):6.1f} dBFS')

mix = signal.sosfilt(sos('highpass', 35), mix, axis=0)
fade = np.clip((DUR - tt_all) / 0.6, 0, 1) ** 1.5
mix *= fade[:, None]

peak = np.abs(mix).max(axis=1)
env = maximum_filter1d(peak, size=int(0.006 * SR))
gain = np.minimum(1.0, 0.7 / np.maximum(env, 1e-9))
gain = uniform_filter1d(gain, size=int(0.004 * SR))
gain = np.minimum(gain, np.roll(gain, int(0.003 * SR)))
mix *= gain[:, None]

wavfile.write(WORK / 'music-raw.wav', SR, mix.astype(np.float32))
print('ok', WORK / 'music-raw.wav', f'pico {np.abs(mix).max():.3f}')
