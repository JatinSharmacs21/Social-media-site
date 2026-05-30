export const getUserId = () => {
  try {
    const rawUser = localStorage.getItem("user");
    const parsedUser = rawUser ? JSON.parse(rawUser) : null;

    return (
      localStorage.getItem("userId") ||
      localStorage.getItem("_id") ||
      parsedUser?._id ||
      parsedUser?.id ||
      ""
    );
  } catch {
    return localStorage.getItem("userId") || localStorage.getItem("_id") || "";
  }
};

export const formatWhisperTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const getOtherParticipant = (conversation, currentUserId) =>
  conversation?.participants?.find((user) => String(user?._id) !== String(currentUserId)) ||
  conversation?.participants?.[0] ||
  null;

export const sortConversations = (items = []) =>
  [...items].sort(
    (a, b) => new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0)
  );

export const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "V";

const whisperHelpers = {
  getUserId,
  formatWhisperTime,
  getOtherParticipant,
  sortConversations,
  getInitials,
};

export default whisperHelpers;
