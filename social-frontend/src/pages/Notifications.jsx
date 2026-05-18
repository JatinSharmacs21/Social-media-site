import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Notifications() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const signalFilters = useMemo(
    () => ["All", "Felt", "Replies", "Circle", "Unread"],
    []
  );

  const authConfig = {
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);

        const res = await API.get("/api/notifications", authConfig);
        setNotifications(Array.isArray(res.data) ? res.data : []);

        await API.put("/api/notifications/read", {}, authConfig);
      } catch (error) {
        console.log(error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/api/notifications/${id}`, authConfig);

      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== id)
      );
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const openNotification = (notification) => {
    if (notification?.post?._id) {
      navigate("/feed");
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
    return "⚡";
  };

  const getSignalLabel = (type) => {
    if (type === "like") return "Felt";
    if (type === "comment") return "Reply";
    if (type === "follow") return "Circle";
    if (type === "reply") return "Thread";
    return "Signal";
  };

  const getSignalStyle = (type) => {
    if (type === "like") return "border-pink-400/25 bg-pink-500/10 text-pink-200";
    if (type === "comment") return "border-cyan-400/25 bg-cyan-500/10 text-cyan-200";
    if (type === "follow") return "border-purple-400/25 bg-purple-500/10 text-purple-200";
    if (type === "reply") return "border-amber-400/25 bg-amber-500/10 text-amber-200";
    return "border-white/10 bg-white/[0.05] text-gray-300";
  };

  const getMessage = (notification) => {
    const senderName = notification.sender?.name || "Someone";

    if (notification.type === "like") return `${senderName} felt your vybe`;
    if (notification.type === "comment") return `${senderName} replied to your vybe`;
    if (notification.type === "follow") return `${senderName} tuned into your Vybe Space`;
    if (notification.type === "reply") return `${senderName} replied in your thread`;

    return notification.message || "A new signal just came in";
  };

  const formatSignalTime = (date) => {
    if (!date) return "";

    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !notification.isRead;
    if (activeFilter === "Felt") return notification.type === "like";
    if (activeFilter === "Replies") {
      return notification.type === "comment" || notification.type === "reply";
    }
    if (activeFilter === "Circle") return notification.type === "follow";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-6 pt-4 md:pt-8 pb-24">
      <div className="w-full max-w-[820px] mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-white/[0.045] border border-white/10 rounded-full px-4 py-2 text-xs font-black tracking-[0.18em] text-pink-300 mb-5">
            SIGNALS
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-zinc-950/90 p-5 sm:p-7 shadow-xl shadow-black/30">
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-pink-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Signals
                </h1>

                <p className="text-gray-400 mt-2 text-sm sm:text-base max-w-xl">
                  Pulses, replies, new Circle energy and activity from your Vybe Space.
                </p>
              </div>

              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 items-center justify-center text-2xl shadow-lg shadow-pink-500/20">
                ⚡
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-2 mt-6">
              <div className="rounded-2xl bg-white/[0.045] border border-white/10 p-3">
                <p className="text-xl font-black">{notifications.length}</p>
                <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                  Total Signals
                </p>
              </div>

              <div className="rounded-2xl bg-white/[0.045] border border-white/10 p-3">
                <p className="text-xl font-black">{unreadCount}</p>
                <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                  New
                </p>
              </div>

              <div className="rounded-2xl bg-white/[0.045] border border-white/10 p-3">
                <p className="text-xl font-black">
                  {notifications.filter((n) => n.type === "follow").length}
                </p>
                <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                  Circle
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {signalFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                activeFilter === filter
                  ? "bg-gradient-to-r from-pink-500/25 to-cyan-500/20 border-pink-400/30 text-white"
                  : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.07]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

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
          <div className="relative overflow-hidden bg-zinc-950/90 border border-white/10 rounded-[30px] p-10 text-center shadow-xl shadow-black/30">
            <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-pink-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
              <div className="text-5xl mb-4">⚡</div>

              <h2 className="text-2xl font-bold mb-2">
                {activeFilter === "All" ? "No signals yet" : `No ${activeFilter} signals`}
              </h2>

              <p className="text-gray-400">
                When someone feels, replies or tunes into your space, it will show here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`group relative overflow-hidden bg-zinc-950/90 border rounded-[26px] p-4 transition-all hover:bg-white/[0.045] shadow-xl shadow-black/20 ${
                  notification.isRead
                    ? "border-white/10"
                    : "border-pink-500/30 shadow-pink-500/10"
                }`}
              >
                {!notification.isRead && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-1 rounded-r-full bg-gradient-to-b from-pink-400 to-cyan-400" />
                )}

                <div className="flex items-start gap-4">
                  <div
                    onClick={() =>
                      notification.sender?._id &&
                      navigate(`/profile/${notification.sender._id}`)
                    }
                    className="relative cursor-pointer shrink-0"
                  >
                    <img
                      src={
                        notification.sender?.profilePic ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          notification.sender?.name || "User"
                        )}&background=8b5cf6&color=fff`
                      }
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                    />

                    <span className="absolute -right-1 -bottom-1 w-7 h-7 rounded-full bg-black border border-white/10 flex items-center justify-center text-sm">
                      {getIcon(notification.type)}
                    </span>
                  </div>

                  <div
                    onClick={() => openNotification(notification)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-black tracking-wide ${getSignalStyle(
                          notification.type
                        )}`}
                      >
                        {getSignalLabel(notification.type)}
                      </span>

                      <span className="text-xs text-gray-500">
                        {formatSignalTime(notification.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-gray-100 leading-6">
                      {getMessage(notification)}
                    </p>

                    {notification.post?.caption && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-1 rounded-2xl bg-white/[0.035] border border-white/5 px-3 py-2">
                        “{notification.post.caption}”
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="w-8 h-8 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                    title="Delete signal"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;