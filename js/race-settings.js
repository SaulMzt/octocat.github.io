export function participantCount(available, limit) {
  const value = Number(limit);
  return Number.isSafeInteger(value) && value > 0 ? Math.min(available, value) : available;
}
