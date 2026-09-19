import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

export async function readSpreadsheet(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (!rows.length) throw new Error("El archivo está vacío.");
  const columns = rows[0].map((label, index) => String(label || `Columna ${index + 1}`).trim());
  const data = rows.slice(1).filter((row) => row.some((value) => String(value).trim()));
  if (!data.length) throw new Error("El archivo no tiene registros para importar.");
  return { columns, data };
}
export const valuesForColumn = (source, index) => source.data.map((row) => String(row[index] ?? "").trim()).filter(Boolean);
export async function readPublishedSheet(url) {
  const response = await fetch(toCsvUrl(url));
  if (!response.ok) throw new Error("No pudimos leer la hoja. Verifica que esté publicada como CSV.");
  const workbook = XLSX.read(await response.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (!rows.length) throw new Error("La hoja está vacía.");
  return { columns: rows[0].map((value, index) => String(value || `Columna ${index + 1}`)), data: rows.slice(1).filter((row) => row.some((value) => String(value).trim())) };
}
function toCsvUrl(url) {
  if (url.includes("output=csv")) return url;
  const match = url.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) return url;
  const gid = new URL(url).searchParams.get("gid") || "0";
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}
