export function formatToLexwareDate(
  input: string | undefined
): string | undefined {
  if (!input) return undefined;
  let normalized = String(input).trim();
  if (!normalized) return undefined;

  // Replace space with T for safer parsing
  if (normalized.includes(" ") && !normalized.includes("T")) {
    normalized = normalized.replace(" ", "T");
  }

  // If only a date is provided, add midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized = `${normalized}T00:00:00`;
  }

  const date = new Date(normalized);
  if (isNaN(date.getTime())) {
    // If parsing fails, return original string to let API error surface
    return normalized;
  }

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const pad3 = (n: number) => String(n).padStart(3, "0");

  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  const millis = pad3(date.getMilliseconds());

  // Timezone offset for that date in minutes; positive east of UTC should be "+"
  const tzOffsetMinutes = -date.getTimezoneOffset();
  const sign = tzOffsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(tzOffsetMinutes);
  const offHours = pad2(Math.floor(abs / 60));
  const offMinutes = pad2(abs % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}${sign}${offHours}:${offMinutes}`;
}
