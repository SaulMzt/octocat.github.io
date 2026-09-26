import { drawScene, drawMonster } from "./game-art.js?v=20260925-2";
const canvas = document.querySelector("#entryScene");
const ctx = canvas.getContext("2d", { alpha: false });
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let frame, last = 0;
function resize() { canvas.width = Math.min(innerWidth, 1920); canvas.height = innerHeight; render(0); }
function render(now) {
  if (now - last > 40 || now === 0) {
    last = now;
    drawScene(ctx,canvas.width,canvas.height,reduced.matches ? 0 : now / 1000,0);
    const scale = canvas.width < 600 ? .8 : 1.6;
    drawMonster(ctx,Math.min(canvas.width*.85,canvas.width-100*scale),canvas.height*.85,scale,reduced.matches ? 0 : now / 1000,"idle");
  }
  if (!reduced.matches && !document.hidden) frame = requestAnimationFrame(render);
}
window.addEventListener("resize", () => { cancelAnimationFrame(frame); resize(); });
document.addEventListener("visibilitychange", () => { cancelAnimationFrame(frame); if (!document.hidden) render(0); });
window.addEventListener("pagehide", () => cancelAnimationFrame(frame));
resize();
