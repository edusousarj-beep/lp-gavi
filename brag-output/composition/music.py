"""Trilha do Reel, sintetizada do zero (sem música de terceiros).

120 BPM (1 compasso = 2s, os cortes de cena caem nos compassos), Ré menor →
Fá maior. Música e efeitos no mesmo tom e na mesma reverberação.

    uv run --with numpy --with scipy python music.py   →   ../work/music-raw.wav

Os tempos dos efeitos espelham a timeline de index.html.
"""
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d, uniform_filter1d

SR = 48000
DUR = 21.5
N = int(SR * DUR)
BEAT = 0.5
BAR = 2.0
rng = np.random.default_rng(7)

OUT = Path(__file__).resolve().parent.parent / 'work'


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
        """Soma um sinal mono (pan) ou estéreo em t0 segundos."""
        i = int(round(t0 * SR))
        if i >= N:
            return
        if sig.ndim == 1:
            gl, gr = pan_gains(pan)
            sig = np.stack([sig * gl, sig * gr], axis=1)
        j = min(N, i + len(sig))
        self.x[i:j] += sig[: j - i] * gain


# ---------------------------------------------------------------- harmonia
# Um acorde por compasso. Gancho em Ré menor (tensão), revelação em Fá.
CHORDS = [
    [50, 57, 60, 64, 65],  # 0–2   Dm9
    [46, 53, 57, 60, 62],  # 2–4   Bbmaj9
    [53, 57, 60, 64, 67],  # 4–6   Fmaj9   ("É mentoria.")
    [48, 55, 62, 64, 67],  # 6–8   Cadd9
    [50, 57, 60, 64, 65],  # 8–10  Dm9     (M.O.V.E.)
    [46, 53, 57, 60, 62],  # 10–12 Bbmaj9
    [55, 58, 62, 65, 69],  # 12–14 Gm9     (prova)
    [48, 55, 58, 62, 65],  # 14–16 C9sus4  (prepara o CTA)
    [53, 57, 60, 64, 67],  # 16–18 Fmaj9   (CTA)
    [46, 53, 57, 60, 62],  # 18–20 Bbmaj9
    [53, 57, 60, 64, 67],  # 20–   Fmaj9   (acorde final)
]
ROOTS = [38, 34, 41, 36, 38, 34, 43, 36, 41, 34, 41]
EP_VOICINGS = [
    [62, 65, 69, 72], [62, 65, 69, 70], [64, 65, 69, 72], [64, 67, 72, 74],
    [62, 65, 69, 72], [62, 65, 69, 70], [62, 65, 67, 70], [62, 65, 67, 70],
    [64, 65, 69, 72], [62, 65, 69, 70], [64, 65, 69, 72],
]


def pad_cutoff(t):
    """Brilho do pad: abre no gancho, respira antes do CTA, abre no fim."""
    fc = np.interp(t, [0, 3.9, 4.0, 15.0, 15.95, 16.0, 21.5],
                   [450, 2400, 3000, 3000, 1500, 3400, 3600])
    return fc


def pad_note(f, t0, t1, amp, attack=0.7, release=1.1):
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
    """Piano elétrico em FM: ataque brilhante que amacia."""
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
    env = np.minimum(1.0, tt / 0.012) * np.exp(-tt / 0.035)
    return noise * env * vel


def marimba(f, vel=1.0):
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    sig = (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.45)
           + 0.30 * np.sin(2 * np.pi * f * 3.93 * tt) * np.exp(-tt / 0.08)
           + 0.08 * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt / 0.03))
    return sig * np.minimum(1.0, tt / 0.002) * vel


def bell(f, vel=1.0):
    n = int(3.0 * SR)
    tt = np.arange(n) / SR
    idx = 1.3 * np.exp(-tt / 0.35)
    sig = np.sin(2 * np.pi * f * tt + idx * np.sin(2 * np.pi * f * 3.5 * tt))
    return sig * np.minimum(1.0, tt / 0.003) * np.exp(-tt / 1.6) * vel


def sweep_noise(dur, f_from, f_to, shape='rise'):
    """Ruído com a banda andando de f_from a f_to (camadas sobrepostas)."""
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
    if shape == 'rise':
        env = (tt / dur) ** 2
    else:
        env = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.5
    return out * env / (np.abs(out).max() + 1e-9)


# ---------------------------------------------------------------- arranjo
drums, bass, keys, pad, sfx = Bus(), Bus(), Bus(), Bus(), Bus()
send = Bus()  # envio para a reverberação

# Pad: o compasso inteiro, com sobreposição macia entre acordes.
for b, chord in enumerate(CHORDS):
    t0 = b * BAR
    t1 = min(DUR, t0 + BAR + 0.15) if b < len(CHORDS) - 1 else DUR - 0.2
    for m in chord:
        x = pad_note(mtof(m), t0, t1, amp=0.11)
        pad.add(t0, x)
        send.add(t0, x, 0.35)

# Bateria.
kick_times = []
for i in range(int(DUR / BEAT)):
    t = i * BEAT
    beat_in_bar = i % 4
    in_groove = (4.0 <= t < 15.5) or (16.0 <= t < 20.0)
    if t < 4.0 and beat_in_bar in (0, 2):
        # Gancho: pulso contido, como um coração acelerado.
        k = signal.sosfilt(sos('lowpass', 900), kick(0.55))
        drums.add(t, k)
        kick_times.append((t, 0.4))
    if in_groove:
        drums.add(t, kick(0.95))
        kick_times.append((t, 1.0))
        if beat_in_bar in (1, 3):
            c = clap(0.34)
            drums.add(t, c, pan=0.05)
            send.add(t, c, 0.5)
    # Chimbal: colcheias no gancho; contratempo aberto no groove.
    if t < 4.0:
        drums.add(t, hat(False, 0.10), pan=0.25)
        drums.add(t + 0.25, hat(False, 0.06), pan=0.25)
    elif in_groove:
        drums.add(t + 0.25, hat(True, 0.13), pan=0.2)
        for s16, v in ((0.0, 0.05), (0.125, 0.03), (0.375, 0.035)):
            drums.add(t + s16, hat(False, v), pan=0.3)
        for s16 in (0.0, 0.125, 0.25, 0.375):
            drums.add(t + s16, shaker(0.035 if s16 else 0.05), pan=-0.35)

# Pulso de sidechain: o resto abaixa um pouco a cada bumbo.
tt_all = np.arange(N) / SR
duck = np.ones(N)
for tk, depth in kick_times:
    i = int(tk * SR)
    seg = tt_all[i:i + int(0.35 * SR)] - tk
    duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], 1 - 0.32 * depth * np.exp(-seg / 0.11))

# Baixo no contratempo (o bumbo fica com o tempo forte).
for b, root in enumerate(ROOTS):
    t0 = b * BAR
    if b == len(ROOTS) - 1:
        bass.add(20.0, bass_note(mtof(root), 1.2, 0.9))
        continue
    for k in range(4):
        t = t0 + k * BEAT + 0.25
        if (4.0 <= t < 15.5) or (16.0 <= t < 20.0):
            note = root + (12 if k == 3 and b % 2 else 0)
            bass.add(t, bass_note(mtof(note), 0.2, 0.85))

# Piano elétrico: acorde no 1 e resposta curta no "e" do 3.
for b, voicing in enumerate(EP_VOICINGS):
    t0 = b * BAR
    if t0 < 4.0:
        continue
    if b == len(EP_VOICINGS) - 1:
        for j, m in enumerate(voicing):
            x = ep_note(mtof(m), 1.4, 0.2)
            keys.add(20.0 + j * 0.012, x, pan=-0.3 + 0.2 * j)
            send.add(20.0 + j * 0.012, x, 0.5)
        continue
    hits = [(0.0, 0.9, 0.22), (2.5 * BEAT, 0.25, 0.14)]
    if t0 == 14.0:
        hits = [(0.0, 1.4, 0.22)]  # respiro antes do CTA
    for off, dur, vel in hits:
        for j, m in enumerate(voicing):
            x = ep_note(mtof(m), dur, vel)
            keys.add(t0 + off + j * 0.008, x, pan=-0.3 + 0.2 * j)
            send.add(t0 + off + j * 0.008, x, 0.3)

# ---------------------------------------------------------------- efeitos
# Trocas do letreiro no gancho: marimba subindo dentro do Ré menor.
for t, m in ((0.38, 69), (1.53, 72), (2.68, 76)):
    x = marimba(mtof(m), 0.20)
    sfx.add(t, x, pan=0.0)
    send.add(t, x, 0.45)

# Transições entre cenas: sopro que termina no compasso.
for t_end in (4.0, 8.0, 12.0):
    w = sweep_noise(0.42, 500, 5000, 'swell') * 0.07
    sfx.add(t_end - 0.40, w, pan=0.0)
    send.add(t_end - 0.40, w, 0.4)

# Foto da Bruna: ar suave na revelação.
air = signal.sosfilt(sos('lowpass', 1800), rng.standard_normal(int(1.0 * SR)))
air *= np.sin(np.pi * np.linspace(0, 1, len(air))) ** 2 * 0.045
sfx.add(4.80, air)
send.add(4.80, air, 0.5)

# M.O.V.E.: uma nota por pilar (Fá, Lá, Dó, Mi = Fmaj7).
for t, m, p in ((8.83, 77, -0.35), (9.13, 81, 0.35), (9.43, 84, -0.35), (9.73, 88, 0.35)):
    x = marimba(mtof(m), 0.17)
    sfx.add(t, x, pan=p)
    send.add(t, x, 0.5)

# Prints entrando como cartas.
for t, p in ((12.43, -0.55), (12.58, 0.55), (12.73, 0.0)):
    s = signal.sosfilt(sos('bandpass', [1400, 6500]), rng.standard_normal(int(0.2 * SR)))
    tt = np.arange(len(s)) / SR
    s *= np.minimum(1.0, tt / 0.02) * np.exp(-tt / 0.06) * 0.07
    sfx.add(t, s, pan=p)
    send.add(t, s, 0.3)

# Subida para o CTA e o impacto no 16,0.
rise = sweep_noise(1.0, 300, 7000, 'rise') * 0.08
sfx.add(15.0, rise)
send.add(15.0, rise, 0.5)
n = int(1.6 * SR)
tt = np.arange(n) / SR
boom = np.sin(2 * np.pi * np.cumsum(38 + 34 * np.exp(-tt / 0.18)) / SR) * np.exp(-tt / 0.55) * 0.55
boom += signal.sosfilt(sos('lowpass', 600), rng.standard_normal(n)) * np.exp(-tt / 0.2) * 0.05
sfx.add(16.0, boom)
send.add(16.0, boom, 0.25)

# Botão entra: sino suave em Fá e Dó.
for f, v in ((mtof(89), 0.045), (mtof(96), 0.022)):
    x = bell(f, v)
    sfx.add(17.08, x, pan=0.1)
    send.add(17.08, x, 0.7)

# Reflexo atravessando o botão: brilho que anda da esquerda para a direita.
n = int(1.5 * SR)
tt = np.arange(n) / SR
shim = sum(np.sin(2 * np.pi * mtof(m) * tt) for m in (89, 93, 96)) / 3
shim *= np.sin(np.pi * tt / 1.5) ** 2 * 0.018
pan = np.linspace(-0.7, 0.7, n)
gl, gr = pan_gains(pan)
sfx.add(18.6, np.stack([shim * gl, shim * gr], axis=1))
send.add(18.6, np.stack([shim * gl, shim * gr], axis=1), 0.8)

# ---------------------------------------------------------------- mix
def make_ir(rt60=2.1, predelay=0.024):
    n = int(rt60 * 1.3 * SR)
    tt = np.arange(n) / SR
    decay = np.exp(-6.91 * tt / rt60) * (1 - np.exp(-tt / 0.012))
    irs = []
    for _ in range(2):
        raw = rng.standard_normal(n) * decay
        dark = signal.sosfilt(sos('lowpass', 3200), raw)
        w = np.clip(tt / (rt60 * 0.6), 0, 1)
        ir = raw * (1 - w) + dark * w
        irs.append(np.concatenate([np.zeros(int(predelay * SR)), ir]))
    return [ir / np.sqrt(np.sum(ir ** 2)) for ir in irs]


keys.x *= (duck[:, None] * 0.35 + 0.65)
pad.x *= duck[:, None]
bass.x = signal.sosfilt(sos('lowpass', 1100, 4), bass.x, axis=0) * (duck[:, None] * 0.3 + 0.7)

# Piano elétrico com leve autopan (trêmolo estéreo).
trem = 0.18 * np.sin(2 * np.pi * 3.2 * tt_all)
keys.x[:, 0] *= 1 + trem
keys.x[:, 1] *= 1 - trem

irL, irR = make_ir()
wet_in = send.x.mean(axis=1)
wet = np.stack([signal.fftconvolve(wet_in, irL)[:N], signal.fftconvolve(wet_in, irR)[:N]], axis=1)
wet = signal.sosfilt(sos('highpass', 180), wet, axis=0)

drums.x = signal.sosfilt(sos('highpass', 42), drums.x, axis=0)
mix = (drums.x * 0.50 + bass.x * 0.36 + keys.x * 0.62 + pad.x * 1.0 + sfx.x * 1.0 + wet * 0.55)

if __import__('os').environ.get('LEVELS'):
    def db(x):
        return 20 * np.log10(np.sqrt(np.mean(x[int(4 * SR):int(15 * SR)] ** 2)) + 1e-12)
    for name, x in (('bateria', drums.x * 0.50), ('baixo', bass.x * 0.36), ('piano', keys.x * 0.62),
                    ('pad', pad.x * 1.0), ('efeitos', sfx.x), ('reverb', wet * 0.55)):
        lows = signal.sosfilt(sos('lowpass', 80, 4), x, axis=0)
        print(f'{name:8s} RMS 4–15s {db(x):6.1f} dBFS   abaixo de 80 Hz {db(lows):6.1f} dBFS')
mix = signal.sosfilt(sos('highpass', 35), mix, axis=0)

# Fade final: o acorde soa e some no fim do vídeo.
fade = np.clip((DUR - tt_all) / 0.6, 0, 1) ** 1.5
mix *= fade[:, None]

# Limitador simples com look-ahead: nada estoura antes da normalização.
peak = np.abs(mix).max(axis=1)
env = maximum_filter1d(peak, size=int(0.006 * SR))
gain = np.minimum(1.0, 0.7 / np.maximum(env, 1e-9))
gain = uniform_filter1d(gain, size=int(0.004 * SR))
gain = np.minimum(gain, np.roll(gain, int(0.003 * SR)))
mix *= gain[:, None]

OUT.mkdir(parents=True, exist_ok=True)
wavfile.write(OUT / 'music-raw.wav', SR, mix.astype(np.float32))
print('ok', OUT / 'music-raw.wav', f'pico {np.abs(mix).max():.3f}')
