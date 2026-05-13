import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        if (!token) return;

        const res = await API.get("/api/notifications/unread-count", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        setUnreadCount(res.data.count || 0);
      } catch (error) {
        console.log(error.response?.data || error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [token, location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const go = (path) => {
    navigate(path);
    setSidebarOpen(false);

    if (path === "/notifications") {
      setUnreadCount(0);
    }
  };

  const navItems = [
    {
      label: "Home",
      path: "/feed",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 11.5L12 4l9 7.5" />
          <path d="M5 10.5V20h14v-9.5" />
          <path d="M9 20v-6h6v6" />
        </svg>
      ),
    },
    {
      label: "Search",
      path: "/search",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      ),
    },
    {
      label: "Reels",
      path: "/reels",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M9 4l3 6" />
          <path d="M15 4l3 6" />
          <path d="M4 10h16" />
          <path d="M10 14.5v3l3-1.5-3-1.5z" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      label: "Notifications",
      path: "/notifications",
      badge: unreadCount,
      icon: (
        <svg
  viewBox="0 0 24 24"
  className="w-6 h-6"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
  <path d="M10.5 21a1.5 1.5 0 0 0 3 0" />
</svg>
      ),
    },
    {
      label: "Profile",
      path: "/profile",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.7-4 5-6 8-6s6.3 2 8 6" />
        </svg>
      ),
    },
  ];

  const Logo = ({ compact = false }) => (
    <div
      onClick={() => go(token ? "/feed" : "/")}
      className="flex items-center gap-3 cursor-pointer select-none"
    >
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

      <h1
        className={`text-2xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent transition-all duration-500 ${
          compact
            ? "opacity-0 translate-x-[-8px] w-0 overflow-hidden"
            : "opacity-100 translate-x-0 w-auto"
        }`}
      >
        Vybeo
      </h1>
    </div>
  );

  const NavButton = ({ item, expanded = false, mobile = false }) => {
    const active = isActive(item.path);
    const showBadge = item.badge && item.badge > 0;

    if (mobile) {
      return (
        <button
          onClick={() => go(item.path)}
          className={`relative flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-2xl text-[11px] transition-all ${
            active
              ? "text-white bg-white/[0.06]"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <span className={active ? "text-pink-300" : ""}>{item.icon}</span>
          <span>{item.label}</span>

          {showBadge && (
            <span className="absolute top-1 right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}
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
            : "border border-transparent text-gray-400 hover:text-white hover:bg-white/[0.06]"
        }`}
        title={item.label}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-pink-400 to-cyan-400" />
        )}

        <span
          className={`relative shrink-0 transition-all duration-300 ${
            active ? "text-pink-300" : "group-hover:text-cyan-300"
          }`}
        >
          {item.icon}

          {showBadge && (
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}
        </span>

        <span
          className={`font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${
            expanded
              ? "opacity-100 translate-x-0 max-w-[150px]"
              : "opacity-0 -translate-x-2 max-w-0"
          }`}
        >
          {item.label}
        </span>

        {!expanded && (
          <span className="pointer-events-none absolute left-[64px] top-1/2 -translate-y-1/2 rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white opacity-0 shadow-xl group-hover:opacity-100 transition-opacity duration-200">
            {item.label}
          </span>
        )}
      </button>
    );
  };

  if (!token) {
    return (
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
              Register
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-[76px] backdrop-blur-2xl bg-black/75 border-b border-white/10">
        <div className="h-full px-4 flex items-center justify-between">
          <Logo />

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl border border-red-500/20 text-red-300 bg-red-500/5 hover:bg-red-500/10 transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      <aside
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className={`hidden md:flex fixed left-0 top-0 bottom-0 z-50 border-r border-white/10 bg-black/85 backdrop-blur-2xl transition-[width,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarOpen
            ? "w-[250px] shadow-2xl shadow-purple-500/10"
            : "w-[84px]"
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

          <div className="mt-auto">
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
                  sidebarOpen
                    ? "opacity-100 translate-x-0 max-w-[120px]"
                    : "opacity-0 -translate-x-2 max-w-0"
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-t border-white/10">
        <div className="grid grid-cols-5 px-1 py-2">
          {navItems.map((item) => (
            <NavButton key={item.path} item={item} mobile />
          ))}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
