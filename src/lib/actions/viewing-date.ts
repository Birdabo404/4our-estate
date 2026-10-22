const MANILA_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in Manila as `YYYY-MM-DD`, the format `<input type="date">` submits. */
export function manilaToday(now: Date = new Date()): string {
  return MANILA_DAY.format(now);
}

export function viewingDateError(value: unknown, today: string = manilaToday()): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value < today ? "Choose today or a later date." : undefined;
}
