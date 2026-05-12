import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Landing() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // LOGIN
  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post(
        "/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "token",
        res.data.token
      );
      localStorage.setItem("userId", res.data._id);
      localStorage.setItem("userName", res.data.name);

      navigate("/feed");

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Login failed"
      );

    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const handleRegister = async () => {
    if (!name || !email || !password) {
      setMessage("Please fill all fields");
      return;
    }

    if (password.length < 8) {
      setMessage(
        "Password must be at least 8 characters"
      );
      return;
    }

    try {
      setLoading(true);

      await API.post(
        "/api/auth/register",
        {
          name,
          email,
          password,
        }
      );

      setMessage(
        "Account created successfully"
      );

      setIsLogin(true);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Registration failed"
      );

    } finally {
      setLoading(false);
    }
  };

  // ENTER KEY
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      isLogin
        ? handleLogin()
        : handleRegister();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* BACKGROUND */}
      <div className="absolute top-[-150px] left-[-120px] w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-3xl" />

      <div className="absolute bottom-[-150px] right-[-120px] w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-3xl" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,0,128,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.08),transparent_30%)]" />

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">

        {/* LEFT SIDE */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 py-16">

          {/* LOGO */}
          <div className="flex items-center gap-4 mb-12">

            <div className="relative">

              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-indigo-500 blur-xl opacity-70 rounded-3xl" />

              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-2xl">

                {/* CAMERA ICON */}
                <div className="relative w-10 h-10 border-[4px] border-white rounded-2xl">

                  <div className="absolute top-[6px] left-[6px] w-4 h-4 border-[3px] border-white rounded-full" />

                  <div className="absolute top-[-6px] right-[-6px] w-3 h-3 bg-white rounded-full" />

                </div>

              </div>

            </div>

            <div>

              <h1 className="text-5xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                Vybeo
              </h1>

              <p className="text-gray-400 text-lg">
                Feel the social vibe.
              </p>

            </div>

          </div>

          {/* HERO SECTION */}
          <div className="max-w-2xl">

            <h2 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">

              Connect with

              <br />

              your{" "}

              <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                people
              </span>

              .

            </h2>

            <p className="text-gray-400 text-lg md:text-2xl mt-8 leading-relaxed max-w-xl">
              Share photos, videos, thoughts and
              real moments with your friends,
              creators and communities around
              the world.
            </p>

          </div>

          {/* SOCIAL PREVIEW */}
          <div className="relative mt-16 h-[280px] hidden md:block">

            {/* CARD 1 */}
            <div className="absolute left-0 top-10 rotate-[-10deg] bg-white/10 border border-white/10 backdrop-blur-xl rounded-[30px] p-3 w-[180px] shadow-2xl hover:scale-105 transition-all">

              <div className="h-[180px] rounded-[22px] bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500" />

              <div className="flex items-center justify-between mt-4">

                <div>
                  <h3 className="font-bold">
                    @alex
                  </h3>

                  <p className="text-sm text-gray-400">
                    Weekend vibes ✨
                  </p>
                </div>

                <span>❤️</span>

              </div>

            </div>

            {/* CARD 2 */}
            <div className="absolute left-[140px] top-0 z-20 rotate-[4deg] bg-white/10 border border-white/10 backdrop-blur-xl rounded-[30px] p-3 w-[220px] shadow-2xl hover:scale-105 transition-all">

              <div className="h-[240px] rounded-[24px] bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 relative overflow-hidden">

                <div className="absolute bottom-4 left-4 bg-black/40 px-4 py-2 rounded-full text-sm backdrop-blur-md">
                  🔥 Trending
                </div>

              </div>

            </div>

            {/* CARD 3 */}
            <div className="absolute left-[320px] top-16 rotate-[10deg] bg-white/10 border border-white/10 backdrop-blur-xl rounded-[30px] p-3 w-[180px] shadow-2xl hover:scale-105 transition-all">

              <div className="h-[180px] rounded-[22px] bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600" />

              <div className="flex items-center justify-between mt-4">

                <div>
                  <h3 className="font-bold">
                    @mia
                  </h3>

                  <p className="text-sm text-gray-400">
                    New reel 🎬
                  </p>
                </div>

                <span>💜</span>

              </div>

            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="w-full lg:w-[520px] flex items-center justify-center p-6">

          <div className="w-full bg-white/[0.06] border border-white/10 backdrop-blur-2xl rounded-[40px] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.4)]">

            <div className="mb-8">

              <h2 className="text-4xl md:text-5xl font-black mb-3">

                {isLogin
                  ? "Welcome Back 👋"
                  : "Join Vybeo 🚀"}

              </h2>

              <p className="text-gray-400 text-lg">

                {isLogin
                  ? "Login to continue your vibe."
                  : "Create your account and start sharing."}

              </p>

            </div>

            {/* MESSAGE */}
            {message && (
              <div className="mb-5 bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-2xl">
                {message}
              </div>
            )}

            {/* NAME */}
            {!isLogin && (
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                onKeyDown={handleKeyDown}
                className="w-full p-5 rounded-2xl bg-black/40 border border-white/10 outline-none mb-5 focus:border-pink-500 transition-all"
              />
            )}

            {/* EMAIL */}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              onKeyDown={handleKeyDown}
              className="w-full p-5 rounded-2xl bg-black/40 border border-white/10 outline-none mb-5 focus:border-pink-500 transition-all"
            />

            {/* PASSWORD */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={handleKeyDown}
              className="w-full p-5 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-purple-500 transition-all"
            />

            {!isLogin && (
              <p className="text-sm text-gray-400 mt-3">
                Use at least 8 characters for a strong password.
              </p>
            )}

            {/* FORGOT */}
            {isLogin && (
              <div className="flex justify-end mt-3 mb-6">

                <button className="text-pink-400 hover:text-pink-300 text-sm transition-all">
                  Forgot Password?
                </button>

              </div>
            )}

            {/* BUTTON */}
            <button
              onClick={
                isLogin
                  ? handleLogin
                  : handleRegister
              }
              disabled={loading}
              className="w-full mt-7 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-5 rounded-2xl font-bold text-xl hover:scale-[1.02] transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
            >

              {loading
                ? "Please wait..."
                : isLogin
                ? "Login"
                : "Create Account"}

            </button>

            {/* TOGGLE */}
            <p className="text-center text-gray-400 mt-8">

              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}

              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
                className="text-pink-400 font-semibold ml-2 hover:text-pink-300"
              >

                {isLogin
                  ? "Register"
                  : "Login"}

              </button>

            </p>

            {/* FOOTER */}
            <div className="mt-12 pt-6 border-t border-white/10">

              <div className="flex items-center justify-center gap-6 text-gray-500 text-sm">

                <span>📸 Photos</span>

                <span>🎬 Reels</span>

                <span>💬 Chat</span>

              </div>

              <p className="text-center text-gray-600 text-sm mt-5">
                © 2026 Vybeo. All rights reserved.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Landing;