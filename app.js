import { getRound } from "./round-service.js?v=20260925-1";

const form = document.querySelector("#joinForm");
const input = document.querySelector("#roundCode");
const message = document.querySelector("#joinMessage");
const normalizeCode = (value) => value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);

input.addEventListener("input", () => { input.value = normalizeCode(input.value); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const code = normalizeCode(input.value);
  if (code.length < 5) { message.textContent = "Escribe el código completo de la ronda."; message.dataset.tone = "error"; return; }
  message.textContent = "Buscando la ronda..."; message.dataset.tone = "";
  try {
    const round = await getRound(code);
    if (!round) throw new Error("⚠ No encontramos una ronda con ese código.");
    if (round.status === "CLOSED") throw new Error("Esta ronda ya está cerrada.");
    window.location.href = `room.html?code=${encodeURIComponent(code)}`;
  } catch (error) { message.textContent = error.message || "No pudimos conectar con la ronda."; message.dataset.tone = "error"; }
});
