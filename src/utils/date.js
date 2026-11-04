export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(typeof value === "string" ? value.replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T") : value);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
