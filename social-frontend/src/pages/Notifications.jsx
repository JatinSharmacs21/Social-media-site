import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Notifications() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setNotifications(res.data);

        await API.put("/api/notifications/read", {}, authConfig);
      } catch (error) {
        console.log(error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
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
    if (type === "like") return "❤️";
    if (type === "comment") return "💬";
    if (type === "follow") return "👤";
    if (type === "reply") return "↩️";
    return "🔔";
  };

  const getMessage = (notification) => {
    const senderName = notification.sender?.name || "Someone";

    if (notification.type === "like") return `${senderName} liked your post`;
    if (notification.type === "comment") return `${senderName} commented on your post`;
    if (notification.type === "follow") return `${senderName} started following you`;
    if (notification.type === "reply") return `${senderName} replied to your comment`;

    return notification.message || "New notification";
  };

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-6 pt-20 md:pt-8 pb-24">
      <div className="w-full max-w-[760px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-gray-400 mt-1">
            Likes, comments, replies and follows will show here.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-zinc-950 border border-white/10 rounded-3xl p-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-44 bg-white/10 rounded" />
                    <div className="h-3 w-24 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-10 text-center">
            <div className="text-5xl mb-4">🔔</div>
            <h2 className="text-2xl font-bold mb-2">No notifications yet</h2>
            <p className="text-gray-400">
              When someone interacts with you, it will show here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`group bg-zinc-950 border rounded-3xl p-4 transition-all hover:bg-white/[0.04] ${
                  notification.isRead
                    ? "border-white/10"
                    : "border-pink-500/30 shadow-lg shadow-pink-500/10"
                }`}
              >
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
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />

                    <span className="absolute -right-1 -bottom-1 w-7 h-7 rounded-full bg-black border border-white/10 flex items-center justify-center text-sm">
                      {getIcon(notification.type)}
                    </span>
                  </div>

                  <div
                    onClick={() => openNotification(notification)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p className="text-sm sm:text-base text-gray-100 leading-6">
                      {getMessage(notification)}
                    </p>

                    {notification.post?.caption && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        “{notification.post.caption}”
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      {notification.createdAt
                        ? new Date(notification.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="text-gray-500 hover:text-red-400 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                    title="Delete"
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
