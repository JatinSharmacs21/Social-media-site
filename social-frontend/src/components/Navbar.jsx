import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const location = useLocation();

  const token = localStorage.getItem("token");

  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");

    navigate("/");
  };

  const navItemClass = (path) =>
    `cursor-pointer transition-all duration-300 hover:text-white ${
      location.pathname === path
        ? "text-white"
        : "text-gray-400"
    }`;

  return (
    <>
      {/* TOP NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10">

        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">

          {/* LOGO */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer"
          >

            {/* ICON */}
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20 overflow-hidden">

              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl" />

              <div className="relative z-10">

                <div className="relative">

                  <div className="w-5 h-5 rounded-full border-[2.5px] border-white" />

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white" />

                  <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-white" />

                </div>

              </div>

            </div>

            {/* TEXT */}
            <div>

              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Vybeo
              </h1>

            </div>

          </div>

          {/* DESKTOP MENU */}
          {!token ? (
            <div className="hidden md:flex items-center gap-4">

              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                Login
              </button>

              <button
                onClick={() => navigate("/register")}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:scale-105 transition-all duration-300 font-semibold"
              >
                Register
              </button>

            </div>
          ) : (
            <div className="hidden md:flex items-center gap-8 text-lg">

              <button
                onClick={() => navigate("/feed")}
                className={navItemClass("/feed")}
              >
                🏠
              </button>

              <button
                onClick={() => navigate("/search")}
                className={navItemClass("/search")}
              >
                🔍
              </button>

              <button
                onClick={() => navigate("/reels")}
                className={navItemClass("/reels")}
              >
                🎬
              </button>

              <button
                onClick={() => navigate("/profile")}
                className={navItemClass("/profile")}
              >
                👤
              </button>

              <button
                onClick={logout}
                className="px-5 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-300"
              >
                Logout
              </button>

            </div>
          )}

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-3xl"
          >
            ☰
          </button>

        </div>

      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden fixed top-[72px] left-0 w-full bg-black/95 backdrop-blur-2xl border-b border-white/10 z-50">

          <div className="flex flex-col p-6 gap-5">

            {!token ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10"
                >
                  Login
                </button>

                <button
                  onClick={() => navigate("/register")}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 font-semibold"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/feed")}
                  className="text-left text-lg"
                >
                  🏠 Home
                </button>

                <button
                  onClick={() => navigate("/search")}
                  className="text-left text-lg"
                >
                  🔍 Search
                </button>

                <button
                  onClick={() => navigate("/reels")}
                  className="text-left text-lg"
                >
                  🎬 Reels
                </button>

                <button
                  onClick={() => navigate("/profile")}
                  className="text-left text-lg"
                >
                  👤 Profile
                </button>

                <button
                  onClick={logout}
                  className="text-left text-red-400 text-lg"
                >
                  🚪 Logout
                </button>
              </>
            )}

          </div>

        </div>
      )}
    </>
  );
}

export default Navbar;