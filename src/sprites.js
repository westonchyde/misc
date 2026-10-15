import { parseGIF, decompressFrames } from "gifuct-js";
const files = import.meta.glob("../assets/pokemon/*.gif", {
  eager: true,
  query: "?inline",
  import: "default",
});
export const spriteCache = new Map();
export let spriteStatus = {
  ready: false,
  loaded: 0,
  total: Object.keys(files).length,
  error: null,
};
export const spriteURL = (id) => files[`../assets/pokemon/${id}.gif`];
export async function loadSprites() {
  try {
    for (const [path, url] of Object.entries(files)) {
      const id = path.split("/").pop().replace(".gif", "");
      const raw = atob(url.split(",")[1]),
        bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
      const gif = parseGIF(bytes.buffer),
        decoded = decompressFrames(gif, true);
      const width = gif.lsd.width,
        height = gif.lsd.height;
      const surface = document.createElement("canvas");
      surface.width = width;
      surface.height = height;
      const context = surface.getContext("2d", { willReadFrequently: true });
      const patch = document.createElement("canvas"),
        pc = patch.getContext("2d");
      const frames = [],
        step = Math.max(1, Math.ceil(decoded.length / 28));
      let elapsed = 0,
        last = null,
        restore = null;
      for (let i = 0; i < decoded.length; i++) {
        const frame = decoded[i];
        if (last?.disposalType === 2)
          context.clearRect(
            last.dims.left,
            last.dims.top,
            last.dims.width,
            last.dims.height,
          );
        if (last?.disposalType === 3 && restore)
          context.putImageData(restore, 0, 0);
        if (frame.disposalType === 3)
          restore = context.getImageData(0, 0, width, height);
        patch.width = frame.dims.width;
        patch.height = frame.dims.height;
        pc.putImageData(
          new ImageData(frame.patch, frame.dims.width, frame.dims.height),
          0,
          0,
        );
        context.drawImage(patch, frame.dims.left, frame.dims.top);
        if (i % step === 0) {
          const copy = document.createElement("canvas");
          copy.width = width;
          copy.height = height;
          copy.getContext("2d").drawImage(surface, 0, 0);
          frames.push({ image: copy, start: elapsed });
        }
        elapsed += Math.max(40, frame.delay || 100);
        last = frame;
      }
      spriteCache.set(id, { width, height, frames, duration: elapsed });
      spriteStatus.loaded++;
      // Yield between species so the loading UI stays responsive.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    spriteStatus.ready = true;
  } catch (error) {
    spriteStatus.error = error.message;
    throw error;
  }
}
export function drawSprite(
  c,
  id,
  x,
  feet,
  scale = 1,
  facing = 1,
  time = 0,
  action = "idle",
  progress = 0,
  visual = "",
) {
  const sprite = spriteCache.get(id);
  if (!sprite) return;
  const t = (time * 1000) % sprite.duration;
  let frame = sprite.frames[0];
  for (const f of sprite.frames) if (f.start <= t) frame = f;
  const strike =
    action === "attack"
      ? Math.sin(Math.max(0, Math.min(1, progress)) * Math.PI)
      : 0;
  c.save();
  c.translate(x, feet);
  c.scale(scale, scale);
  c.imageSmoothingEnabled = false;
  let sx = 1,
    sy = 1,
    rotation = 0;
  if (action === "attack") {
    if (["body-slam", "dynamic-punch", "crunch"].includes(visual)) {
      sx += strike * 0.14;
      sy -= strike * 0.12;
      rotation = facing * strike * 0.14;
    } else if (["dragon-rush", "x-scissor", "bullet-punch"].includes(visual)) {
      rotation = facing * strike * 0.25;
      c.translate(facing * strike * 18, -strike * 8);
    } else if (["hurricane", "psychic", "psyshock"].includes(visual)) {
      c.translate(0, -strike * 18);
      rotation = Math.sin(time * 9) * strike * 0.08;
    } else if (
      ["earthquake", "eruption", "stone-edge", "dig"].includes(visual)
    ) {
      c.translate(0, -Math.abs(Math.sin(progress * Math.PI * 3)) * 8);
      sx += strike * 0.08;
      sy -= strike * 0.06;
    } else if (["hyper-beam", "solar-beam", "ice-beam"].includes(visual)) {
      c.translate(-facing * strike * 8, 0);
      sx -= strike * 0.07;
    } else {
      c.translate(-facing * strike * 5, -strike * 4);
      rotation = -facing * strike * 0.06;
    }
  }
  c.rotate(rotation);
  c.scale(-facing * sx, sy);
  // Uniform pixel scaling: preserve the actual sprite's native proportions.
  const maxHeight = 126,
    maxWidth = 145,
    ratio = Math.min(maxHeight / sprite.height, maxWidth / sprite.width);
  const w = Math.round(sprite.width * ratio),
    h = Math.round(sprite.height * ratio);
  c.drawImage(frame.image, Math.round(-w / 2), Math.round(-h), w, h);
  c.restore();
}
