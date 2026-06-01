export function formatWhisperLastSeen(value) {
  if (!value) return "Last seen unavailable";

  const seenAt = new Date(value).getTime();
  if (Number.isNaN(seenAt)) return "Last seen unavailable";

  const diffMs = Date.now() - seenAt;
  if (diffMs < 0) return "Last seen just now";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < minute) return "Last seen just now";

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `Last seen ${minutes}m ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `Last seen ${hours}h ago`;
  }

  if (diffMs < 2 * day) return "Last seen yesterday";

  if (diffMs < 4 * week) {
    const weeks = Math.max(1, Math.floor(diffMs / week));
    return `Last seen ${weeks}w ago`;
  }

  return `Last seen ${new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
}
