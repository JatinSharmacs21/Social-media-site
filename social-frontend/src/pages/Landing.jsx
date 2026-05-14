import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Landing() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // login | register | forgot | reset
  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("resetToken");

    if (token) {
      setResetToken(token);
      setMode("reset");
    }
  }, []);

  const cleanUsername = (value) => value.toLowerCase().trim().replace(/^@/, "").replace(/\s/g, "");

  const saveUserData = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data._id);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("username", data.username || "");
  };

  // LOGIN WITH USERNAME
  const handleLogin = async () => {
    const finalUsername = cleanUsername(username);

    if (!finalUsername || !password) {
      setMessage("Please enter username and password");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setSuccess("");

      const res = await API.post("/api/auth/login", {
        username: finalUsername,
        password,
      });

      saveUserData(res.data);
      navigate("/feed");
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const handleRegister = async () => {
    const finalUsername = cleanUsername(username);

    if (!name || !finalUsername || !email || !password) {
      setMessage("Please fill all fields");
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(finalUsername)) {
      setMessage("Username must be 3-20 characters. Use letters, numbers, or underscore only.");
      return;
    }

    if (!strongPasswordRegex.test(password)) {
      setMessage("Password must include alphabet, number, special character and be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setSuccess("");

      const res = await API.post("/api/auth/register", {
        name,
        username: finalUsername,
        email,
        password,
      });

      saveUserData(res.data);
      navigate("/feed");
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD
  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("Please enter your registered email");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setSuccess("");

      const res = await API.post("/api/auth/forgot-password", { email });
      setSuccess(res.data?.message || "Password reset link sent to your email.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not send reset link");
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD
  const handleResetPassword = async () => {
    if (!password) {
      setMessage("Please enter new password");
      return;
    }

    if (!strongPasswordRegex.test(password)) {
      setMessage("Password must include alphabet, number, special character and be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setSuccess("");

      const res = await API.post(`/api/auth/reset-password/${resetToken}`, { password });
      setSuccess(res.data?.message || "Password reset successful");
      setPassword("");
      window.history.replaceState({}, document.title, "/");
      setTimeout(() => setMode("login"), 1200);
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  // ENTER KEY
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;

    if (isLogin) handleLogin();
    if (isRegister) handleRegister();
    if (isForgot) handleForgotPassword();
    if (isReset) handleResetPassword();
  };

  const getTitle = () => {
    if (isLogin) return "Welcome Back ";
    if (isRegister) return "Join Vybeo 🚀";
    if (isForgot) return "Forgot Password 🔐";
    return "Reset Password 🔑";
  };

  const getSubtitle = () => {
    if (isLogin) return "Login with your username to continue.";
    if (isRegister) return "Create your account and start sharing.";
    if (isForgot) return "Enter your email and we will send a reset link.";
    return "Create a new strong password for your account.";
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
              <p className="text-gray-400 text-lg">Feel the social vibe.</p>
            </div>
          </div>

          {/* HERO SECTION */}
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">
              Connect with
              <br />
              your <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">people</span>.
            </h2>

            <p className="text-gray-400 text-lg md:text-2xl mt-8 leading-relaxed max-w-xl">
              Share photos, videos, thoughts and real moments with your friends,
              creators and communities around the world.
            </p>
          </div>

          {/* SOCIAL PREVIEW */}
          <div className="relative mt-16 h-[280px] hidden md:block">
            <div className="absolute left-0 top-10 rotate-[-10deg] bg-white/10 border border-white/10 backdrop-blur-xl rounded-[30px] p-3 w-[180px] shadow-2xl hover:scale-105 transition-all">
              <div className="h-[180px] rounded-[22px] bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500" />
              <div className="flex items-center justify-between mt-4">
                <div>
                  <h3 className="font-bold">@alex</h3>
                  <p className="text-sm text-gray-400">Weekend vibes ✨</p>
                </div>
                <span>❤️</span>
              </div>
            </div>

            <div className="absolute left-[140px] top-0 z-20 rotate-[4deg] bg-white/10 border border-white/10 backdrop-blur-xl rounded-[30px] p-3 w-[220px] shadow-2xl hover:scale-105 transition-all">
              <div className="h-[240px] rounded-[24px] bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 relative overflow-hidden">
                <div className="absolute bottom-4 left-4 bg-black/40 px-4 py-2 rounded-full text-sm backdrop-blur-md">🔥 Trending</div>
              </div>
            </div>

            <div className="absolute left-[320px] top-16 rotate-[10deg] bg-white/10 border border-white/10 backdrop-blur-xl rounded-[30px] p-3 w-[180px] shadow-2xl hover:scale-105 transition-all">
              <div className="h-[180px] rounded-[22px] bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600" />
              <div className="flex items-center justify-between mt-4">
                <div>
                  <h3 className="font-bold">@mia</h3>
                  <p className="text-sm text-gray-400">New reel 🎬</p>
                </div>
                <span>💜</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full lg:w-[520px] flex items-center justify-center p-6">
          <div className="w-full bg-white/[0.06] border border-white/10 backdrop-blur-2xl rounded-[40px] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.4)]">
            <div className="mb-6">
              <h2 className="text-4xl md:text-5xl font-black mb-3">{getTitle()}</h2>
              <p className="text-gray-400 text-lg">{getSubtitle()}</p>
            </div>

            {/* MESSAGE */}
            {message && <div className="mb-5 bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-2xl">{message}</div>}
            {success && <div className="mb-5 bg-green-500/20 border border-green-500/30 text-green-300 p-4 rounded-2xl">{success}</div>}

            {/* NAME */}
            {isRegister && (
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-5 rounded-2xl bg-black/40 border border-white/10 outline-none mb-5 focus:border-pink-500 transition-all"
              />
            )}

            {/* USERNAME */}
            {(isLogin || isRegister) && (
              <div className="relative mb-5">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(cleanUsername(e.target.value))}
                  onKeyDown={handleKeyDown}
                  className="w-full p-5 pl-10 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-pink-500 transition-all"
                />
              </div>
            )}

            {/* EMAIL */}
            {(isRegister || isForgot) && (
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-5 rounded-2xl bg-black/40 border border-white/10 outline-none mb-5 focus:border-pink-500 transition-all"
              />
            )}

            {/* PASSWORD */}
            {(isLogin || isRegister || isReset) && (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={isReset ? "New password" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-5 pr-16 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-purple-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-xl"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            )}

            {(isRegister || isReset) && (
              <p className="text-sm text-gray-400 mt-3">
                Password must be 8+ characters with alphabet, number and special character.
              </p>
            )}

            {/* FORGOT */}
            {isLogin && (
              <div className="flex justify-end mt-3 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setMessage("");
                    setSuccess("");
                    setPassword("");
                  }}
                  className="text-pink-400 hover:text-pink-300 text-sm transition-all"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* BUTTON */}
            <button
              onClick={isLogin ? handleLogin : isRegister ? handleRegister : isForgot ? handleForgotPassword : handleResetPassword}
              disabled={loading}
              className="w-full mt-7 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-5 rounded-2xl font-bold text-xl hover:scale-[1.02] transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.4)] disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login"
                : isRegister
                ? "Create Account"
                : isForgot
                ? "Send Reset Link"
                : "Reset Password"}
            </button>

            {/* TOGGLE */}
            <p className="text-center text-gray-400 mt-8">
              {isLogin && "Don't have an account?"}
              {isRegister && "Already have an account?"}
              {(isForgot || isReset) && "Remember your password?"}

              <button
                type="button"
                onClick={() => {
                  setMode(isLogin ? "register" : "login");
                  setMessage("");
                  setSuccess("");
                  setPassword("");
                }}
                className="text-pink-400 font-semibold ml-2 hover:text-pink-300"
              >
                {isLogin ? "Register" : "Login"}
              </button>
            </p>

            {/* FOOTER */}
            <div className="mt-12 pt-6 border-t border-white/10">
              <div className="flex items-center justify-center gap-6 text-gray-500 text-sm">
                <span>📸 Photos</span>
                <span>🎬 Reels</span>
                <span>💬 Chat</span>
              </div>

              <p className="text-center text-gray-600 text-sm mt-5">© 2026 Vybeo. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
