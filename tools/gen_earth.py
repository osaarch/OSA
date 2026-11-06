# Run from the project root:  python3 tools/gen_earth.py   (needs numpy + Pillow)
# Procedural, tileable earth textures for the Malwiya: baked-mud-brick and earth plaster (colour + bump).
import numpy as np
from PIL import Image, ImageFilter
rng = np.random.default_rng(20261106)
N = 1024

def pnoise(n=N, beta=2.0, sx=1.0, sy=1.0, seed=None):
    """Periodic fractal noise (random-phase spectrum ~ 1/f^beta); sx/sy stretch the spectrum for streaks."""
    r = np.random.default_rng(seed) if seed is not None else rng
    fx = np.fft.fftfreq(n)[None, :] * n
    fy = np.fft.fftfreq(n)[:, None] * n
    f = np.sqrt((fx / sx) ** 2 + (fy / sy) ** 2)
    f[0, 0] = 1
    amp = 1.0 / f ** (beta / 2)
    amp[0, 0] = 0
    ph = r.uniform(0, 2 * np.pi, (n, n))
    z = np.fft.ifft2(amp * np.exp(1j * ph)).real
    z -= z.mean()
    return z / (z.std() + 1e-9)

def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

def save(arr, path, q):
    arr = np.clip(arr, 0, 1)
    Image.fromarray((arr * 255 + 0.5).astype(np.uint8)).save(path, quality=q, optimize=True, subsampling=0 if arr.ndim == 3 else 0)

yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)

# ───────────────────────── baked mud brick ─────────────────────────
ROWS, BRICK_W = 8, 256            # 8 courses per tile (128 px), bricks 256 px long, running bond
CH = N // ROWS
row = (yy // CH).astype(int)
ly = yy - row * CH
off = (row % 2) * (BRICK_W // 2)
xs = (xx + off) % N
col = (xs // BRICK_W).astype(int)
lx = xs - col * BRICK_W
wob = pnoise(beta=2.6, seed=7) * 4.2 + pnoise(beta=1.2, seed=8) * 1.4   # wobbly, hand-laid joints
edge = np.minimum(np.minimum(lx, BRICK_W - lx), np.minimum(ly, CH - ly)) + wob
MORT = 7.0
face = smooth(edge, MORT - 1.5, MORT + 2.5)          # 0 = mortar joint, 1 = brick face
round_ = smooth(edge, MORT, MORT + 15)               # soft shoulder to the brick
bid = row * 7 + col
tone_b = np.random.default_rng(3).uniform(-1, 1, 8 * 9)[bid % 72]
tone_h = np.random.default_rng(4).uniform(-1, 1, 8 * 9)[(bid * 5) % 72]
# earth palette (sRGB 0–1): fired-clay brown with a little more red/yellow variation brick to brick
base = np.stack([0.585 + 0.050 * tone_b + 0.020 * tone_h,
                 0.470 + 0.045 * tone_b + 0.010 * tone_h,
                 0.345 + 0.040 * tone_b - 0.012 * tone_h], -1)
mid = pnoise(beta=2.2, seed=11)
fine = pnoise(beta=0.9, seed=12)
macro = pnoise(beta=3.0, seed=13)
streak = pnoise(beta=2.4, sx=0.35, sy=3.2, seed=14)     # vertical weathering
pits = smooth(pnoise(beta=0.6, seed=15), 1.35, 2.4)       # eroded pits and flaked spots
lum = 1 + 0.060 * mid + 0.060 * fine + 0.085 * macro + 0.060 * streak - 0.24 * pits
lum *= 1 - 0.20 * (1 - round_) * face                   # the shadowed rim of every brick
brick = base * lum[..., None]
mortar_base = np.array([0.700, 0.620, 0.485])
mortar = mortar_base[None, None, :] * (1 + 0.07 * mid + 0.09 * fine)[..., None] * (0.78 + 0.22 * smooth(edge, -6, MORT))[..., None]
rgb = brick * face[..., None] + mortar * (1 - face[..., None])
# a veil of wind-blown sand lying on the course ledges (top of every brick)
ledge = smooth(CH - ly, 0, 18) * 0 + smooth(ly, CH - 22, CH - 3) * face
sand = np.array([0.74, 0.64, 0.47])
rgb = rgb * (1 - 0.30 * ledge[..., None] * (0.5 + 0.5 * smooth(mid, -0.3, 0.8))[..., None]) + sand * 0.30 * ledge[..., None] * (0.5 + 0.5 * smooth(mid, -0.3, 0.8))[..., None]
save(rgb, 'src/assets/malwiya/brick.jpg', 84)

h = 0.18 + 0.82 * round_
h = h + 0.035 * fine + 0.03 * mid - 0.09 * pits
h *= face * 0.55 + 0.45
save(np.clip(h, 0, 1), '/tmp/osa_brick_bump_full.png', 90)
Image.open('/tmp/osa_brick_bump_full.png').convert('L').resize((512, 512), Image.LANCZOS).save('src/assets/malwiya/brick_bump.jpg', quality=82, optimize=True)

# ───────────────────────── earth plaster (the ramp and the platform tops) ─────────────────────────
mid = pnoise(beta=2.3, seed=21)
fine = pnoise(beta=0.8, seed=22)
macro = pnoise(beta=3.2, seed=23)
crack = np.abs(pnoise(beta=2.0, seed=24))
cr = 1 - smooth(crack, 0.0, 0.07)                        # hairline cracks of dried earth
grit = smooth(pnoise(beta=0.4, seed=25), 1.9, 2.8)       # pale sand grains
peb = smooth(pnoise(beta=0.5, seed=26), 2.0, 2.8)        # dark pebbles
base = np.array([0.700, 0.570, 0.415])
lum = 1 + 0.060 * macro + 0.050 * mid + 0.055 * fine - 0.22 * cr * 0.6 + 0.08 * grit - 0.12 * peb
pl = base[None, None, :] * lum[..., None]
save(pl, 'src/assets/malwiya/plaster.jpg', 84)
hp = 0.5 + 0.10 * macro + 0.08 * mid + 0.07 * fine - 0.25 * cr + 0.06 * grit + 0.05 * peb
save(np.clip(hp * 0.8 + 0.1, 0, 1), '/tmp/osa_pl_bump_full.png', 90)
Image.open('/tmp/osa_pl_bump_full.png').convert('L').resize((512, 512), Image.LANCZOS).save('src/assets/malwiya/plaster_bump.jpg', quality=82, optimize=True)
print('done')
