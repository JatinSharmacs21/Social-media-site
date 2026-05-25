import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import logger from "../utils/logger";
import { SOCKET_URL } from "../config/env";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [mobileVybeOpen, setMobileVybeOpen] = useState(false);
  const [spaceControlOpen, setSpaceControlOpen] = useState(false);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        if (!token) return;
        const res = await API.get("/api/notifications/unread-count");
        setUnreadCount(res.data.count || 0);
      } catch (error) {
        logger.error(error.response?.data || error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token, location.pathname]);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: {
        token,
      },
    });

    socket.on("connect", () => {
      socket.emit("register-user");
    });

    socket.on("new-notification", (data) => {
      if (location.pathname === "/notifications") return;

      setUnreadCount((prev) => Number(prev || 0) + 1);
      setToast({
        message: data?.message || "A new signal just came in",
        type: data?.type || "signal",
      });

      setTimeout(() => setToast(null), 4000);
    });

    return () => {
      socket.off("new-notification");
      socket.disconnect();
    };
  }, [token, location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const isVybeActive =
    location.pathname === "/vybe-drops" || location.pathname === "/vybe-room";

  const isProfilePage = location.pathname.startsWith("/profile");

  const go = (path) => {
    navigate(path);
    setSidebarOpen(false);
    setMobileVybeOpen(false);
    setSpaceControlOpen(false);

    if (path === "/notifications") {
      setUnreadCount(0);
    }
  };

  const navItems = [
    {
      label: "Vybe Flow",
      shortLabel: "Flow",
      path: "/feed",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 13c2.5-5 6.5-5 9-2s5.5 3 7-1" />
          <path d="M4 18c3-3 6-3 9 0s5 2.5 7 0" />
          <path d="M4 6h.01" />
        </svg>
      ),
    },
    {
      label: "Discover",
      shortLabel: "Discover",
      path: "/search",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      ),
    },
    {
      label: "Clips",
      shortLabel: "Clips",
      path: "/reels",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3.5" width="16" height="17" rx="4" />
          <path d="M9 3.5l3 6" />
          <path d="M15 3.5l3 6" />
          <path d="M4 9.5h16" />
          <path d="M10.5 14v3.5l3.5-1.75L10.5 14z" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      label: "Vybe Drops",
      shortLabel: "Drops",
      path: "/vybe-drops",
      special: true,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l2.3 5.1L20 10.4l-5.1 2.3L12.6 18 10.3 13 5 10.6l5.1-2.3L12 3z" />
          <path d="M19 17l.8 1.8L22 20l-2.2 1.2L19 23l-.8-1.8L16 20l2.2-1.2L19 17z" />
        </svg>
      ),
    },
    {
      label: "Vybe Room",
      shortLabel: "Room",
      path: "/vybe-room",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 9.5h10" />
          <path d="M8 14h5" />
          <path d="M5 4h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-6l-5 3v-3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
        </svg>
      ),
    },
    {
      label: "Signals",
      shortLabel: "Signals",
      path: "/notifications",
      badge: unreadCount,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      ),
    },
    {
      label: "Vybe Space",
      shortLabel: "Space",
      path: "/profile",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.7-4 5-6 8-6s6.3 2 8 6" />
        </svg>
      ),
    },
  ];

  const mobileNavItems = [
    navItems.find((item) => item.path === "/feed"),
    navItems.find((item) => item.path === "/search"),
    navItems.find((item) => item.path === "/reels"),
    navItems.find((item) => item.path === "/profile"),
  ].filter(Boolean);

  const Logo = ({ compact = false }) => (
    <div onClick={() => go(token ? "/feed" : "/")} className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/25 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl" />
        <div className="relative z-10">
          <div className="relative">
            <div className="w-5 h-5 rounded-full border-[2.5px] border-white" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-500 ${
          compact ? "opacity-0 translate-x-[-8px] w-0 overflow-hidden" : "opacity-100 translate-x-0 w-auto"
        }`}
      >
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Vybeo
        </h1>
        <p className="text-[10px] text-gray-500 -mt-1 tracking-[0.22em] font-bold whitespace-nowrap">
          REAL VYBES
        </p>
      </div>
    </div>
  );

  const NavButton = ({ item, expanded = false, mobile = false }) => {
    if (!item) return null;

    const active = isActive(item.path);
    const showBadge = item.label === "Signals" && Number(item.badge) > 0;

    if (mobile) {
      return (
        <button
          onClick={() => go(item.path)}
          className={`relative flex flex-col items-center justify-center h-14 rounded-2xl transition-all ${
            active ? "text-white bg-white/[0.06]" : "text-gray-500 hover:text-white"
          }`}
        >
          <span className={active ? "text-pink-300" : ""}>{item.icon}</span>

          {showBadge && (
            <span className="absolute top-2 right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}

          <span className="text-[10px] mt-0.5 font-semibold">
            {item.shortLabel}
          </span>
        </button>
      );
    }

    return (
      <button
        onClick={() => go(item.path)}
        className={`group relative flex items-center rounded-2xl transition-all duration-300 ease-out overflow-hidden ${
          expanded ? "w-full px-4 py-3 gap-4" : "w-12 h-12 justify-center gap-0"
        } ${
          active
            ? "bg-gradient-to-r from-pink-500/20 via-purple-500/10 to-cyan-500/20 border border-cyan-500/20 text-white shadow-lg shadow-cyan-500/10"
            : item.special
            ? "border border-pink-500/20 text-pink-200 bg-pink-500/5 hover:bg-pink-500/10"
            : "border border-transparent text-gray-400 hover:text-white hover:bg-white/[0.06]"
        }`}
        title={item.label}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-pink-400 to-cyan-400" />
        )}

        <span className={`relative shrink-0 transition-all duration-300 ${active ? "text-pink-300" : "group-hover:text-cyan-300"}`}>
          {item.icon}

          {showBadge && (
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}
        </span>

        <span
          className={`font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${
            expanded ? "opacity-100 translate-x-0 max-w-[170px]" : "opacity-0 -translate-x-2 max-w-0"
          }`}
        >
          {item.label}
        </span>

        {!expanded && (
          <span className="pointer-events-none absolute left-[64px] top-1/2 -translate-y-1/2 rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white opacity-0 shadow-xl group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            {item.label}
          </span>
        )}
      </button>
    );
  };

  const NotificationToast = () => {
    if (!toast) return null;

    return (
      <div className="fixed top-24 right-4 z-[9999] animate-[slideIn_.3s_ease]">
        <div className="min-w-[280px] max-w-[360px] rounded-2xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" />

          <div className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
              ⚡
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-white">New Signal</p>
              <p className="text-sm text-gray-300 mt-1 leading-relaxed">{toast.message}</p>
            </div>

            <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white transition-colors">
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MobileVybeSheet = () => {
    if (!token || !mobileVybeOpen) return null;

    return (
      <>
        <div
          onClick={() => setMobileVybeOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] animate-vybe-fade"
        />

        <div className="md:hidden fixed left-4 right-4 bottom-[86px] z-50 animate-vybe-sheet">
          <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl shadow-black/60">
            <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-pink-500/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative p-3.5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] tracking-[0.18em] text-pink-300 font-black">
                    DROP YOUR VYBE
                  </p>
                  <h3 className="text-xl leading-tight font-black text-white mt-0.5">
                    Choose a space
                  </h3>
                </div>

                <button
                  onClick={() => setMobileVybeOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => go("/vybe-drops")}
                  className={`relative overflow-hidden rounded-[22px] border p-3 text-left active:scale-[0.98] transition-all duration-300 ${
                    isActive("/vybe-drops")
                      ? "border-pink-400/35 bg-pink-500/12"
                      : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/15 blur-2xl rounded-full" />
                  <div className="relative">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center text-base shadow-lg shadow-pink-500/15">
                      🔥
                    </div>
                    <h4 className="text-white font-black mt-2 text-[15px]">Vybe Drops</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                      Prompts, anonymous replies, real thoughts.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => go("/vybe-room")}
                  className={`relative overflow-hidden rounded-[22px] border p-3 text-left active:scale-[0.98] transition-all duration-300 ${
                    isActive("/vybe-room")
                      ? "border-cyan-400/35 bg-cyan-500/12"
                      : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/15 blur-2xl rounded-full" />
                  <div className="relative">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center text-base shadow-lg shadow-cyan-500/15">
                      ✨
                    </div>
                    <h4 className="text-white font-black mt-2 text-[15px]">Vybe Room</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                      Live conversations, shared energy.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const MobileVybeIcon = ({ active = false }) => (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5l1.9 4.3 4.6 1.7-4.3 1.9-1.7 4.6-1.9-4.3-4.6-1.7 4.3-1.9 1.7-4.6z" />
      <path d="M18.5 15.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7.7-1.6z" />
      {active && <circle cx="12" cy="12" r="9.5" opacity="0.18" />}
    </svg>
  );

  const MobileVybeButton = () => (
    <button
      onClick={() => setMobileVybeOpen((prev) => !prev)}
      className={`relative flex flex-col items-center justify-center h-14 rounded-2xl transition-all duration-300 ${
        mobileVybeOpen || isVybeActive ? "text-pink-200" : "text-gray-500 hover:text-white"
      }`}
      aria-label="Open Vybe spaces"
    >
      <span
        className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border transition-all duration-300 ${
          mobileVybeOpen
            ? "bg-white/[0.08] border-pink-400/25 shadow-lg shadow-pink-500/10 scale-[0.96]"
            : isVybeActive
            ? "bg-white/[0.06] border-cyan-400/20 shadow-lg shadow-cyan-500/10"
            : "bg-white/[0.03] border-white/10"
        }`}
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-cyan-500/10" />
        <span className="relative">
          {mobileVybeOpen ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          ) : (
            <MobileVybeIcon active={isVybeActive} />
          )}
        </span>
      </span>

      <span className="text-[10px] mt-0.5 font-semibold">Vybe</span>

      {isVybeActive && !mobileVybeOpen && (
        <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
      )}
    </button>
  );



  const SpaceControlIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5l1.3 2.8 3 .5-2.1 2.2.5 3-2.7-1.4L9.3 12l.5-3-2.1-2.2 3-.5L12 3.5z" />
      <path d="M5.5 15.5h13" />
      <path d="M7.5 19h9" />
    </svg>
  );

  const SpaceControlButton = ({ compact = false }) => {
    if (!isProfilePage) return null;

    return (
      <button
        type="button"
        onClick={() => setSpaceControlOpen(true)}
        className={`group relative shrink-0 overflow-hidden rounded-2xl border transition-all duration-300 active:scale-[0.96] ${
          compact
            ? "flex h-11 w-11 items-center justify-center border-white/10 bg-white/[0.04] text-white shadow-inner shadow-white/5 hover:border-pink-300/25 hover:bg-white/[0.075]"
            : sidebarOpen
            ? "flex w-full items-center gap-4 border-white/10 bg-white/[0.035] px-4 py-3 text-white hover:border-pink-300/25 hover:bg-white/[0.065]"
            : "flex h-12 w-12 items-center justify-center border-white/10 bg-white/[0.035] text-white hover:border-pink-300/25 hover:bg-white/[0.065]"
        }`}
        title="Space Control"
        aria-label="Open Space Control"
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.16),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_44%)] opacity-70 transition group-hover:opacity-100" />
        <span className={`${compact ? "h-full w-full rounded-2xl" : "h-9 w-9 rounded-xl"} relative flex shrink-0 items-center justify-center border border-white/10 bg-black/25 text-pink-100 transition group-hover:text-cyan-100`}>
          <SpaceControlIcon />
        </span>

        {!compact && (
          <span
            className={`relative overflow-hidden whitespace-nowrap font-semibold tracking-wide transition-all duration-300 ${
              sidebarOpen ? "max-w-[170px] translate-x-0 opacity-100" : "max-w-0 -translate-x-2 opacity-0"
            }`}
          >
            Space Control
          </span>
        )}

        {!compact && !sidebarOpen && (
          <span className="pointer-events-none absolute left-[64px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
            Space Control
          </span>
        )}
      </button>
    );
  };

  const SpaceControlPanel = () => {
    if (!spaceControlOpen) return null;

    const SectionTitle = ({ children }) => (
      <p className="px-1 pt-4 pb-2 text-[10px] font-black uppercase tracking-[0.22em] text-pink-200/80">
        {children}
      </p>
    );

    const PanelItem = ({ title, subtitle, danger = false, disabled = false, onClick }) => (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`group w-full overflow-hidden rounded-[22px] border px-4 py-3 text-left transition-all active:scale-[0.99] ${
          danger
            ? disabled
              ? "cursor-not-allowed border-red-400/10 bg-red-500/[0.045] text-red-200/55"
              : "border-red-400/15 bg-red-500/[0.075] text-red-100 hover:bg-red-500/[0.12]"
            : disabled
            ? "cursor-not-allowed border-white/10 bg-white/[0.025] text-slate-500"
            : "border-white/10 bg-white/[0.04] text-white hover:border-pink-300/20 hover:bg-white/[0.07]"
        }`}
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{title}</p>
            {subtitle && <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{subtitle}</p>}
          </div>
          <span className={`shrink-0 text-lg transition ${disabled ? "text-slate-700" : danger ? "text-red-200" : "text-slate-500 group-hover:text-white"}`}>›</span>
        </div>
      </button>
    );

    return (
      <>
        <div
          onClick={() => setSpaceControlOpen(false)}
          className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-[3px] animate-vybe-fade"
        />

        <aside className="fixed bottom-0 right-0 top-0 z-[100] w-full max-w-[420px] animate-space-panel overflow-hidden border-l border-white/10 bg-[linear-gradient(180deg,rgba(8,8,12,0.98),rgba(12,10,18,0.98)_48%,rgba(7,7,10,0.99))] shadow-2xl shadow-black/70 backdrop-blur-2xl sm:top-3 sm:right-3 sm:bottom-3 sm:rounded-[32px] sm:border">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-pink-500/14 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_34%)]" />

          <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-pink-200">Vybeo</p>
                  <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-white">Space Control</h2>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">Account, safety and your vybes.</p>
                </div>
                <button
                  onClick={() => setSpaceControlOpen(false)}
                  className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] text-xl text-white transition hover:bg-white/[0.09] active:scale-95"
                  aria-label="Close Space Control"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="vybe-scrollless min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-5">
              <SectionTitle>Account</SectionTitle>
              <div className="space-y-2 overflow-hidden">
                <PanelItem
                  title="Open profile"
                  subtitle="Go back to your Vybe Space"
                  onClick={() => go("/profile")}
                />
                <PanelItem
                  title="Logout"
                  subtitle="Sign out from this device"
                  danger
                  onClick={logout}
                />
              </div>

              <SectionTitle>Privacy & Safety</SectionTitle>
              <div className="space-y-2 overflow-hidden">
                <PanelItem title="Blocked users" subtitle="Coming soon: view and unblock users" disabled />
                <PanelItem title="Muted users" subtitle="Coming soon: control muted spaces" disabled />
                <PanelItem title="Report history" subtitle="Coming soon: track reports and reviews" disabled />
              </div>

              <SectionTitle>Your Vybes</SectionTitle>
              <div className="space-y-2 overflow-hidden">
                <PanelItem title="Archived vybes" subtitle="Coming soon: restore hidden posts" disabled />
                <PanelItem title="Saved vybes" subtitle="Coming soon: revisit saved moments" disabled />
              </div>

              <SectionTitle>Danger Zone</SectionTitle>
              <div className="space-y-2 overflow-hidden">
                <PanelItem title="Delete account" subtitle="Coming soon: permanent account removal" danger disabled />
              </div>
            </div>
          </div>
        </aside>
      </>
    );
  };


  if (!token) {
    return (
      <>
        <NotificationToast />

        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-black/70 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Logo />

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="px-4 sm:px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                Login
              </button>

              <button
                onClick={() => navigate("/")}
                className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:scale-105 transition-all font-semibold"
              >
                Join Vybeo
              </button>
            </div>
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      <NotificationToast />
      <MobileVybeSheet />
      <SpaceControlPanel />

      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-[76px] backdrop-blur-2xl bg-black/75 border-b border-white/10">
        <div className="h-full px-4 flex items-center justify-between gap-3 overflow-hidden">
          <div className="min-w-0 shrink">
            <Logo />
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => go("/notifications")}
              className="relative w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-all"
              aria-label="Open Signals"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.9)]" />
              )}
            </button>

            <SpaceControlButton compact />
          </div>
        </div>
      </header>

      <aside
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className={`hidden md:flex fixed left-0 top-0 bottom-0 z-50 border-r border-white/10 bg-black/85 backdrop-blur-2xl transition-[width,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarOpen ? "w-[250px] shadow-2xl shadow-purple-500/10" : "w-[84px]"
        }`}
      >
        <div className="flex h-full w-full flex-col px-4 py-5 overflow-hidden">
          <div className="mb-8">
            <Logo compact={!sidebarOpen} />
          </div>

          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavButton key={item.path} item={item} expanded={sidebarOpen} />
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <SpaceControlButton />

            <button
              onClick={logout}
              className={`group relative flex items-center rounded-2xl transition-all duration-300 overflow-hidden ${
                sidebarOpen ? "w-full px-4 py-3 gap-4" : "w-12 h-12 justify-center"
              } text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20`}
              title="Logout"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 4v16" />
              </svg>

              <span
                className={`font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${
                  sidebarOpen ? "opacity-100 translate-x-0 max-w-[120px]" : "opacity-0 -translate-x-2 max-w-0"
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-t border-white/10">
        <div className="grid grid-cols-5 items-center px-2 py-2">
          <NavButton item={mobileNavItems[0]} mobile />
          <NavButton item={mobileNavItems[1]} mobile />
          <MobileVybeButton />
          <NavButton item={mobileNavItems[2]} mobile />
          <NavButton item={mobileNavItems[3]} mobile />
        </div>
      </nav>

      <style>
        {`
          @keyframes vybe-fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes vybe-sheet {
            from {
              opacity: 0;
              transform: translateY(18px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .animate-vybe-fade {
            animation: vybe-fade 180ms ease-out forwards;
          }

          @keyframes space-panel {
            from {
              opacity: 0;
              transform: translateX(22px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }

          .animate-vybe-sheet {
            animation: vybe-sheet 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          .animate-space-panel {
            animation: space-panel 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }


          .vybe-scrollless {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .vybe-scrollless::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }
        `}
      </style>
    </>
  );
}

export default Navbar;