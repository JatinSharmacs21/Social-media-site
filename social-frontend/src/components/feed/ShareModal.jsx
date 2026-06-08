import React, { useEffect, useMemo, useState } from "react";
import Avatar from "../ui/Avatar";
import API from "../../services/api";
import logger from "../../utils/logger";
import { getOtherParticipant, getUserId } from "../../utils/whisperHelpers";

function ShareTarget({ user, label, sublabel, loading, onClick }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-2.5 text-left transition hover:border-cyan-200/18 hover:bg-white/[0.065] active:scale-[0.99] disabled:opacity-60"
    >
      <span className="rounded-full bg-white/[0.075] p-[2px] group-hover:bg-gradient-to-br group-hover:from-pink-400/28 group-hover:via-violet-400/25 group-hover:to-cyan-300/25">
        <Avatar src={user?.profilePic} name={label} size="md" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{label}</span>
        <span className="block truncate text-xs font-medium text-zinc-500">{sublabel}</span>
      </span>
      <span className="rounded-full border border-white/[0.08] bg-white/[0.055] px-3 py-1 text-[11px] font-semibold text-zinc-200 transition group-hover:text-white">
        {loading ? "Sending..." : "Send"}
      </span>
    </button>
  );
}

function ShareModal({
  post,
  copiedShare,
  getPostShareUrl,
  copyShareLink,
  nativeSharePost,
  onClose,
}) {
  const [whisperQuery, setWhisperQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [sendingTarget, setSendingTarget] = useState("");
  const [sentTarget, setSentTarget] = useState("");
  const [sendError, setSendError] = useState("");
  const currentUserId = getUserId();

  useEffect(() => {
    if (!post) return undefined;

    const loadConversations = async () => {
      try {
        const res = await API.get("/api/whispers/conversations");
        setConversations(res.data || []);
      } catch (error) {
        logger.error(error.response?.data || error);
      }
    };

    loadConversations();
    return undefined;
  }, [post]);

  useEffect(() => {
    const term = whisperQuery.trim();
    if (!term) {
      setUsers([]);
      return undefined;
    }

    const searchUsers = async () => {
      try {
        setLoadingTargets(true);
        const res = await API.get(`/api/users/search?q=${encodeURIComponent(term)}`);
        setUsers((res.data || []).filter((user) => String(user._id) !== String(currentUserId)));
      } catch (error) {
        logger.error(error.response?.data || error);
      } finally {
        setLoadingTargets(false);
      }
    };

    const timeout = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeout);
  }, [whisperQuery, currentUserId]);

  const recentTargets = useMemo(
    () =>
      conversations
        .map((conversation) => ({ conversation, user: getOtherParticipant(conversation, currentUserId) }))
        .filter((item) => item.user?._id)
        .slice(0, 5),
    [conversations, currentUserId]
  );

  if (!post) return null;

  const buildWhisperText = () => {
    const author = post.user?.name || post.user?.username || "someone";
    const caption = post.caption || post.content || "Vybeo vybe";
    const preview = caption.length > 150 ? `${caption.slice(0, 150)}...` : caption;
    return `Shared a vybe from ${author}\n\n${preview}\n\n${getPostShareUrl(post._id)}`;
  };

  const sendToConversation = async (conversationId, targetId) => {
    if (!conversationId || sendingTarget) return;
    try {
      setSendError("");
      setSentTarget("");
      setSendingTarget(targetId || conversationId);
      await API.post(`/api/whispers/conversations/${conversationId}/messages`, { text: buildWhisperText() });
      setSentTarget(targetId || conversationId);
    } catch (error) {
      logger.error(error.response?.data || error);
      setSendError("Could not send this vybe in Whisper.");
    } finally {
      setSendingTarget("");
    }
  };

  const sendToUser = async (user) => {
    if (!user?._id || sendingTarget) return;
    try {
      setSendError("");
      setSentTarget("");
      setSendingTarget(user._id);
      const conversationRes = await API.post("/api/whispers/conversations", { participantId: user._id });
      await API.post(`/api/whispers/conversations/${conversationRes.data._id}/messages`, { text: buildWhisperText() });
      setSentTarget(user._id);
      setConversations((prev) => [conversationRes.data, ...prev.filter((item) => item._id !== conversationRes.data._id)]);
    } catch (error) {
      logger.error(error.response?.data || error);
      setSendError("Could not send this vybe in Whisper.");
    } finally {
      setSendingTarget("");
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl animate-[fadeIn_0.2s_ease-in-out] sm:max-w-md sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Share this vybe</h3>

          <button type="button" onClick={onClose} className="text-xl text-gray-400 hover:text-white">
            ×
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar src={post.user?.profilePic} name={post.user?.name || "User"} size="lg" className="rounded-full" />

            <div>
              <p className="font-semibold text-white">{post.user?.name || "User"}</p>
              <p className="text-xs text-gray-500">Shared from Vybe Flow</p>
            </div>
          </div>

          <p className="line-clamp-2 text-sm text-gray-300">{post.caption || post.content || "Vybeo vybe"}</p>
          <p className="mt-2 truncate text-xs text-gray-500">{getPostShareUrl(post._id)}</p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" onClick={copyShareLink} className="rounded-2xl bg-white/10 px-4 py-3 font-medium transition-all hover:bg-white/15">
            {copiedShare ? "Copied ✅" : "Copy link"}
          </button>

          <button type="button" onClick={nativeSharePost} className="rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500 px-4 py-3 font-medium transition-all hover:scale-[1.02]">
            Share Vybe
          </button>
        </div>

        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Send in Whisper</p>
            {sentTarget && <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[11px] font-bold text-emerald-200">Sent ✓</span>}
          </div>

          <div className="mb-3 flex h-10 items-center gap-2 rounded-2xl border border-white/[0.075] bg-white/[0.035] px-3">
            <span className="text-zinc-500">⌕</span>
            <input
              value={whisperQuery}
              onChange={(event) => setWhisperQuery(event.target.value)}
              placeholder="Search people to whisper"
              className="w-full bg-transparent text-sm font-medium text-white placeholder:text-zinc-600 outline-none"
            />
          </div>

          {sendError && <p className="mb-2 rounded-2xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-100">{sendError}</p>}

          <div className="max-h-56 space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {whisperQuery.trim() ? (
              loadingTargets ? (
                <p className="py-4 text-center text-sm text-zinc-500">Searching...</p>
              ) : users.length ? (
                users.map((user) => (
                  <ShareTarget
                    key={user._id}
                    user={user}
                    label={user.name || user.username || "User"}
                    sublabel={`@${user.username || "vybeo"}`}
                    loading={sendingTarget === user._id}
                    onClick={() => sendToUser(user)}
                  />
                ))
              ) : (
                <p className="py-4 text-center text-sm text-zinc-500">No user found.</p>
              )
            ) : recentTargets.length ? (
              recentTargets.map(({ conversation, user }) => (
                <ShareTarget
                  key={conversation._id}
                  user={user}
                  label={user.name || user.username || "User"}
                  sublabel="Recent whisper"
                  loading={sendingTarget === user._id || sendingTarget === conversation._id}
                  onClick={() => sendToConversation(conversation._id, user._id)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.035] px-4 py-5 text-center">
                <p className="text-sm font-semibold text-white">No recent whispers yet</p>
                <p className="mt-1 text-xs text-zinc-500">Search a person above and send this vybe privately.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
