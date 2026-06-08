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

export const isConversationPinned = (conversation, currentUserId) =>
  Array.isArray(conversation?.pinnedBy) &&
  conversation.pinnedBy.some((id) => String(id?._id || id) === String(currentUserId));

export const sortConversations = (items = [], currentUserId = getUserId()) =>
  [...items].sort((a, b) => {
    const pinnedA = isConversationPinned(a, currentUserId) ? 1 : 0;
    const pinnedB = isConversationPinned(b, currentUserId) ? 1 : 0;
    if (pinnedA !== pinnedB) return pinnedB - pinnedA;
    return new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0);
  });

export const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "V";

export const getMessageSenderId = (message) => message?.sender?._id || message?.sender || "";

export const getDisplayMessageText = (message, currentUserId) => {
  if (!message?.text) return "";
  const mine = String(getMessageSenderId(message)) === String(currentUserId);
  return `${mine ? "You: " : ""}${message.text}`;
};

const whisperHelpers = {
  getUserId,
  formatWhisperTime,
  getOtherParticipant,
  sortConversations,
  isConversationPinned,
  getInitials,
  getMessageSenderId,
  getDisplayMessageText,
};

export default whisperHelpers;
