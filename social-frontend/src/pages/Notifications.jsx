import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import logger from "../utils/logger";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [error, setError] = useState("");
  const [requestActionLoading, setRequestActionLoading] = useState(null);
  const [resolvedRequests, setResolvedRequests] = useState({});

  const signalFilters = useMemo(
    () => ["All", "Unread", "Felt", "Replies", "Circle"],
    []
  );

  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await API.get("/api/notifications");
        if (!mounted) return;

        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        logger.error(err.response?.data || err);
        if (mounted) setError("Signals load nahi ho paaye. Thoda refresh karke try kar.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Unread") return !notification.isRead;
      if (activeFilter === "Felt") return notification.type === "like";
      if (activeFilter === "Replies") {
        return notification.type === "comment" || notification.type === "reply";
      }
      if (activeFilter === "Circle") {
        return ["follow", "tune_request", "tune_accept"].includes(notification.type);
      }
      return true;
    });
  }, [activeFilter, notifications]);

  const groupedNotifications = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    filteredNotifications.forEach((notification) => {
      const createdAt = notification.createdAt ? new Date(notification.createdAt) : null;
      const now = new Date();

      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        groups.Earlier.push(notification);
        return;
      }

      const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startYesterday = new Date(startToday);
      startYesterday.setDate(startYesterday.getDate() - 1);

      if (createdAt >= startToday) {
        groups.Today.push(notification);
      } else if (createdAt >= startYesterday) {
        groups.Yesterday.push(notification);
      } else {
        groups.Earlier.push(notification);
      }
    });

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [filteredNotifications]);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/feed");
  };

  const broadcastUnreadCount = (count) => {
    window.dispatchEvent(
      new CustomEvent("vybeo:notifications-count", {
        detail: { count },
      })
    );
  };

  const markAllAsRead = async () => {
    if (actionLoading || unreadCount === 0) return;

    try {
      setActionLoading(true);
      await API.put("/api/notifications/read");

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      broadcastUnreadCount(0);
    } catch (err) {
      logger.error(err.response?.data || err);
      setError("Mark all read nahi ho paaya. Dobara try kar.");
    } finally {
      setActionLoading(false);
    }
  };

  const markOneAsRead = async (notificationId) => {
    if (!notificationId) return;

    setNotifications((prev) =>
      prev.map((notification) =>
        notification._id === notificationId ? { ...notification, isRead: true } : notification
      )
    );

    try {
      await API.put(`/api/notifications/${notificationId}/read`);
      broadcastUnreadCount(Math.max(unreadCount - 1, 0));
    } catch (err) {
      logger.error(err.response?.data || err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const target = notifications.find((notification) => notification._id === id);
      await API.delete(`/api/notifications/${id}`);

      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== id)
      );

      if (target && !target.isRead) {
        broadcastUnreadCount(Math.max(unreadCount - 1, 0));
      }
    } catch (err) {
      logger.error(err.response?.data || err);
      setError("Signal delete nahi ho paaya.");
    }
  };

  const respondToTuneRequest = async (notification, action) => {
    const requestId = notification.relatedId;
    if (!requestId || requestActionLoading) return;

    try {
      setRequestActionLoading(notification._id);
      await API.put(`/api/users/tune-requests/${requestId}`, { action });

      setResolvedRequests((prev) => ({
        ...prev,
        [requestId]: action === "accept" ? "accepted" : "declined",
      }));

      if (!notification.isRead) markOneAsRead(notification._id);
    } catch (err) {
      logger.error(err.response?.data || err);
      setError(err.response?.data?.message || "Tune-in request update nahi ho paaya.");
    } finally {
      setRequestActionLoading(null);
    }
  };

  const getPostKind = (post) => {
    const media = Array.isArray(post?.media) ? post.media : [];
    if (media.some((item) => item?.type === "video")) return "clip";
    if (media.some((item) => item?.type === "image")) return "moment";
    return "thought";
  };

  const openNotification = async (notification) => {
    if (!notification) return;

    if (!notification.isRead) {
      markOneAsRead(notification._id);
    }

    if (
      ["follow", "tune_request", "tune_accept"].includes(notification?.type) &&
      notification?.sender?._id
    ) {
      navigate(`/profile/${notification.sender._id}`);
      return;
    }

    if (notification?.post?._id) {
      const open = notification.type === "comment" || notification.type === "reply" ? "comments" : "post";
      navigate(`/feed?post=${notification.post._id}&open=${open}`);
      return;
    }

    if (notification?.sender?._id) {
      navigate(`/profile/${notification.sender._id}`);
    }
  };

  const getIcon = (type) => {
    if (type === "like") return "💗";
    if (type === "comment") return "💬";
    if (type === "follow") return "✨";
    if (type === "reply") return "↩️";
    if (type === "tune_request") return "🔒";
    if (type === "tune_accept") return "🔓";
    return "⚡";
  };

  const getSignalLabel = (type) => {
    if (type === "like") return "Felt";
    if (type === "comment") return "Commented";
    if (type === "follow") return "Circle";
    if (type === "reply") return "Replied";
    if (type === "tune_request") return "Tune Request";
    if (type === "tune_accept") return "Accepted";
    return "Signal";
  };

  const getSignalStyle = (type) => {
    if (type === "like") return "border-pink-400/25 bg-pink-500/10 text-pink-200";
    if (type === "comment") return "border-cyan-400/25 bg-cyan-500/10 text-cyan-200";
    if (type === "follow") return "border-purple-400/25 bg-purple-500/10 text-purple-200";
    if (type === "reply") return "border-amber-400/25 bg-amber-500/10 text-amber-200";
    if (type === "tune_request" || type === "tune_accept") {
      return "border-purple-400/25 bg-purple-500/10 text-purple-200";
    }
    return "border-white/10 bg-white/[0.05] text-gray-300";
  };

  const getMessage = (notification) => {
    const senderName = notification.sender?.name || notification.sender?.username || "Someone";
    const postKind = getPostKind(notification.post);
    const storedMessage = notification.message || "";

    if (notification.type === "like") return `${senderName} felt your ${postKind}`;
    if (notification.type === "comment") return `${senderName} commented on your ${postKind}`;
    if (notification.type === "follow") return `${senderName} tuned into your Vybe Space`;
    if (notification.type === "reply") return `${senderName} replied to your comment`;
    if (notification.type === "tune_request") return `${senderName} wants to tune into your Vybe Space`;
    if (notification.type === "tune_accept") return `${senderName} accepted your tune-in request`;

    return storedMessage || "A new signal just came in";
  };

  const formatSignalTime = (date) => {
    if (!date) return "";

    const createdAt = new Date(date).getTime();
    if (Number.isNaN(createdAt)) return "";

    const diff = Date.now() - createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  };

  const getAvatar = (sender) => {
    if (sender?.profilePic) return sender.profilePic;

    const name = sender?.name || sender?.username || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=8b5cf6&color=fff&bold=true`;
  };

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-6 pt-3 md:pt-8 pb-24">
      <div className="w-full max-w-[860px] mx-auto">
        <div className="sticky top-0 z-20 -mx-3 sm:mx-0 px-3 sm:px-0 pt-2 pb-3 bg-black/85 backdrop-blur-xl md:static md:bg-transparent md:backdrop-blur-0 md:p-0">
          <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-2 text-sm font-bold text-gray-200 hover:text-white hover:bg-white/[0.075] transition-all"
            >
              <span className="text-lg leading-none">←</span>
              Back
            </button>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || actionLoading}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-black transition-all ${
                unreadCount > 0
                  ? "border-pink-400/30 bg-gradient-to-r from-pink-500/20 to-purple-500/15 text-pink-100 hover:from-pink-500/30 hover:to-purple-500/25"
                  : "border-white/10 bg-white/[0.035] text-gray-500 cursor-not-allowed"
              }`}
            >
              <span>✓</span>
              {actionLoading ? "Marking..." : "Mark all read"}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Notifications
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-gray-500">
                {notifications.length} total · {unreadCount} unread
              </p>
            </div>

            <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 text-lg shadow-lg shadow-pink-500/20">
              ⚡
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 mt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {signalFilters.map((filter) => {
            const count =
              filter === "All"
                ? notifications.length
                : filter === "Unread"
                ? unreadCount
                : filter === "Felt"
                ? notifications.filter((n) => n.type === "like").length
                : filter === "Replies"
                ? notifications.filter((n) => n.type === "comment" || n.type === "reply").length
                : notifications.filter((n) => n.type === "follow").length;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border text-xs sm:text-sm font-semibold transition-all ${
                  activeFilter === filter
                    ? "bg-gradient-to-r from-pink-500/25 to-cyan-500/20 border-pink-400/30 text-white shadow-lg shadow-pink-500/10"
                    : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.07]"
                }`}
              >
                {filter}
                <span className="ml-1.5 text-[11px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-zinc-950/90 border border-white/10 rounded-[26px] p-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-44 bg-white/10 rounded" />
                    <div className="h-3 w-24 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="relative overflow-hidden bg-zinc-950/90 border border-white/10 rounded-[24px] p-6 sm:p-10 text-center shadow-xl shadow-black/30">
            <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-pink-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">⚡</div>

              <h2 className="text-lg sm:text-2xl font-bold mb-2">
                {activeFilter === "All" ? "No signals yet" : `No ${activeFilter} signals`}
              </h2>

              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Jab koi felt, comment, reply, follow ya interact karega to yahan clean signal card aayega.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-7">
            {groupedNotifications.map(([groupName, items]) => (
              <section key={groupName}>
                <div className="flex items-center gap-3 mb-2.5 sm:mb-3">
                  <h2 className="text-xs font-black tracking-[0.18em] text-gray-500 uppercase">
                    {groupName}
                  </h2>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {items.map((notification) => (
                    <div
                      key={notification._id}
                      className={`group relative overflow-hidden border rounded-2xl sm:rounded-[26px] p-3 sm:p-4 transition-all hover:bg-white/[0.055] shadow-lg shadow-black/20 ${
                        notification.isRead
                          ? "bg-zinc-950/80 border-white/10"
                          : "bg-gradient-to-r from-pink-500/[0.13] via-zinc-950 to-cyan-500/[0.08] border-pink-500/30 shadow-pink-500/10"
                      }`}
                    >
                      {!notification.isRead && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-pink-400 to-cyan-400" />
                      )}

                      <div className="flex items-start gap-2.5 sm:gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            notification.sender?._id &&
                            navigate(`/profile/${notification.sender._id}`)
                          }
                          className="relative shrink-0 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400/40"
                        >
                          <img
                            src={getAvatar(notification.sender)}
                            alt=""
                            className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover border border-white/10 bg-white/5"
                          />

                          <span className="absolute -right-1 -bottom-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-black border border-white/10 flex items-center justify-center text-[10px] sm:text-sm shadow-lg">
                            {getIcon(notification.type)}
                          </span>
                        </button>

                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => openNotification(notification)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") openNotification(notification);
                          }}
                          className="flex-1 min-w-0 text-left focus:outline-none cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-black tracking-wide ${getSignalStyle(
                                notification.type
                              )}`}
                            >
                              {getSignalLabel(notification.type)}
                            </span>

                            {!notification.isRead && (
                              <span className="px-1.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-[9px] sm:text-[10px] font-black text-pink-200">
                                NEW
                              </span>
                            )}

                            <span className="text-[11px] sm:text-xs text-gray-500">
                              {formatSignalTime(notification.createdAt)}
                            </span>
                          </div>

                          <p className="text-[13px] sm:text-base text-gray-100 leading-[1.35] sm:leading-6">
                            {getMessage(notification)}
                            {notification.sender?.username && (
                              <span className="ml-1.5 text-[11px] sm:text-xs font-medium text-gray-500">
                                @{notification.sender.username}
                              </span>
                            )}
                          </p>

                          {notification.post?.caption && (
                            <p className="text-xs text-gray-500 mt-1.5 sm:mt-2 truncate sm:line-clamp-2 sm:whitespace-normal overflow-hidden rounded-xl sm:rounded-2xl bg-white/[0.035] border border-white/5 px-2.5 py-1.5 sm:px-3 sm:py-2">
                              “{notification.post.caption}”
                            </p>
                          )}

                          {notification.type === "tune_request" &&
                            notification.relatedId &&
                            (() => {
                              const status = resolvedRequests[notification.relatedId];
                              const busy = requestActionLoading === notification._id;

                              if (status === "accepted") {
                                return (
                                  <p className="mt-2 inline-flex rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-[11px] font-black text-purple-200">
                                    Accepted — they're tuned in now
                                  </p>
                                );
                              }

                              if (status === "declined") {
                                return (
                                  <p className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-black text-gray-400">
                                    Declined
                                  </p>
                                );
                              }

                              return (
                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      respondToTuneRequest(notification, "accept");
                                    }}
                                    className="rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-3.5 py-1.5 text-xs font-black text-white transition active:scale-95 disabled:opacity-60"
                                  >
                                    {busy ? "..." : "Accept"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      respondToTuneRequest(notification, "decline");
                                    }}
                                    className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs font-black text-gray-200 transition hover:bg-white/[0.1] active:scale-95 disabled:opacity-60"
                                  >
                                    Decline
                                  </button>
                                </div>
                              );
                            })()}
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteNotification(notification._id)}
                          className="w-8 h-8 rounded-xl text-gray-500 hover:text-red-300 hover:bg-red-500/10 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                          title="Delete signal"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;