const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

let W, H, cx, cy;
const COLS = 90;
const ROWS = 65;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  cx = W / 2;
  cy = H / 2;
}
window.addEventListener("resize", resize);
resize();

function project(x3d, y3d, z3d) {
  const fov = 950;
  const scale = fov / (fov + z3d);
  return { x: cx + x3d * scale, y: cy * 0.92 + y3d * scale, s: scale };
}

const points = [];
const gridW = 2600;
const gridH = 1500;
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const x = (col / (COLS - 1) - 0.5) * gridW;
    const z = (row / (ROWS - 1)) * gridH - 420;
    points.push({ x, z });
  }
}

const PITCH = 0.6;
function applyPitch(x, y, z) {
  return {
    x,
    y: y * Math.cos(PITCH) - z * Math.sin(PITCH),
    z: y * Math.sin(PITCH) + z * Math.cos(PITCH),
  };
}

let t = 0;

function getWaveY(x, z, t) {
  const nx = x / 650,
    nz = z / 420;
  const w1 = Math.sin(nx * 1.7 + t * 0.85) * Math.cos(nz * 0.85 - t * 0.45);
  const w2 = Math.sin(nx * 0.65 - t * 0.38 + nz * 1.15) * 0.55;
  const w3 =
    Math.cos(nx * 2.4 + t * 0.55) * Math.sin(nz * 0.48 + t * 0.28) * 0.28;
  return (w1 + w2 + w3) * 105 * Math.max(0, 1 - Math.abs(nx) * 0.55);
}

function getColor(waveY, z) {
  const depth = (z + 420) / gridH;
  const brightness = Math.max(0, 1 - depth * 0.75);
  const lift = Math.max(0, waveY / 105);
  const r = Math.round(lift * 30 * brightness);
  const g = Math.round(80 + lift * 132 * brightness + brightness * 30);
  const b = Math.round(190 + lift * 65 * brightness);
  return `rgba(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)},${(brightness * 0.78 + 0.08).toFixed(2)})`;
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(
    cx,
    H * 0.28,
    0,
    cx,
    H * 0.28,
    Math.max(W, H) * 0.9,
  );
  bg.addColorStop(0, "#0c1630");
  bg.addColorStop(0.45, "#080e22");
  bg.addColorStop(1, "#040910");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const bloom = ctx.createRadialGradient(
    cx,
    cy * 0.7,
    0,
    cx,
    cy * 0.7,
    W * 0.38,
  );
  bloom.addColorStop(0, "rgba(0,200,255,0.02)");
  bloom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  t += 0.011;

  const projected = points.map((p) => {
    const waveY = getWaveY(p.x, p.z, t);
    const { x, y, z } = applyPitch(p.x, waveY - 200, p.z);
    return { ...project(x, y, z), waveY, rawZ: p.z };
  });

  for (let i = 0; i < projected.length; i++) {
    const p = projected[i];
    const depth = (points[i].z + 420) / gridH;
    if (p.y < -60 || p.y > H + 20 || p.x < -120 || p.x > W + 120) continue;
    const size = Math.max(0.35, p.s * 4.8 * (1 - depth * 0.28));
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fillStyle = getColor(p.waveY, points[i].z);
    ctx.fill();
    if (p.waveY > 55 && depth < 0.55) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,230,255,${(Math.max(0, p.waveY / 105) * 0.18 * (1 - depth)).toFixed(2)})`;
      ctx.fill();
    }
  }

  const vBot = ctx.createLinearGradient(0, H * 0.68, 0, H);
  vBot.addColorStop(0, "rgba(4,9,16,0)");
  vBot.addColorStop(1, "rgba(4,9,16,0.96)");
  ctx.fillStyle = vBot;
  ctx.fillRect(0, 0, W, H);

  requestAnimationFrame(draw);
}

draw();
