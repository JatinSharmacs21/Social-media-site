import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Landing() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
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
    const tokenFromQuery = params.get("resetToken") || params.get("token");
const tokenFromPath = window.location.pathname.startsWith("/reset-password/")
  ? window.location.pathname.split("/reset-password/")[1]
  : "";

const token = tokenFromQuery || tokenFromPath;

    if (token) {
      setResetToken(token);
      setMode("reset");
    }
  }, []);

  const cleanUsername = (value) =>
    value.toLowerCase().trim().replace(/^@/, "").replace(/\s/g, "");

  const saveUserData = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data._id);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("username", data.username || "");
  };

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

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;

    if (isLogin) handleLogin();
    if (isRegister) handleRegister();
    if (isForgot) handleForgotPassword();
    if (isReset) handleResetPassword();
  };

  const getTitle = () => {
    if (isLogin) return "Welcome back";
    if (isRegister) return "Join Vybeo";
    if (isForgot) return "Forgot password";
    return "Reset password";
  };

  const getSubtitle = () => {
    if (isLogin) return "Tune back into your Vybe Flow.";
    if (isRegister) return "Create your Vybe Space and drop your first thought.";
    if (isForgot) return "Enter your email and we’ll send a reset link.";
    return "Create a new strong password for your account.";
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      <div className="absolute top-[-180px] left-[-140px] w-[430px] h-[430px] bg-pink-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-180px] right-[-140px] w-[430px] h-[430px] bg-cyan-500/15 rounded-full blur-3xl" />
      <div className="absolute top-[28%] right-[34%] w-[320px] h-[320px] bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_500px]">
        <section className="px-5 sm:px-8 md:px-14 lg:px-16 py-6 sm:py-8 lg:py-10 flex flex-col">
          <div className="flex items-center gap-3 mb-8 sm:mb-10 lg:mb-12">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-pink-500/25">
              <div className="relative w-7 h-7 rounded-full border-[3px] border-white">
                <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Vybeo
              </h1>
              <p className="text-[11px] sm:text-xs tracking-[0.28em] text-gray-500 font-bold">
                REAL VYBES
              </p>
            </div>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/[0.045] border border-white/10 rounded-full px-4 py-2 text-[11px] sm:text-xs font-black tracking-[0.18em] text-pink-300 mb-5 sm:mb-6">
              VIBE-FIRST SOCIAL SPACE
            </div>

            <h2 className="text-[52px] sm:text-6xl md:text-7xl font-black leading-[0.98] tracking-tight">
              Drop your
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                real vybe.
              </span>
            </h2>

            <p className="text-gray-400 text-base sm:text-xl md:text-2xl mt-6 leading-relaxed max-w-2xl">
              Thoughts, moments, drops and rooms — built around your current mood,
              not perfect content.
            </p>
          </div>

          <div className="hidden md:grid grid-cols-2 xl:grid-cols-4 gap-4 mt-10 lg:mt-auto lg:pt-10">
            {[
              ["Vybe Flow", "Real thoughts and moments in one clean feed.", "〰️"],
              ["Vybe Drops", "Daily prompts for honest conversations.", "✦"],
              ["Vybe Room", "Live public spaces for shared energy.", "💬"],
              ["Clips", "Short raw moments, separate from the Flow.", "🎬"],
            ].map(([title, text, icon]) => (
              <div
                key={title}
                className="relative overflow-hidden rounded-[24px] bg-zinc-950/70 border border-white/10 p-4 lg:p-5 shadow-xl shadow-black/25 min-h-[150px]"
              >
                <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-pink-500/10 blur-2xl" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-lg mb-3">
                    {icon}
                  </div>
                  <h3 className="font-black text-base lg:text-lg">{title}</h3>
                  <p className="text-xs lg:text-sm text-gray-400 mt-2 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-start lg:items-center justify-center px-5 sm:px-8 lg:pl-0 lg:pr-10 pb-8 lg:py-10">
          <div className="w-full max-w-[460px] relative overflow-hidden bg-zinc-950/85 border border-white/10 backdrop-blur-2xl rounded-[30px] sm:rounded-[38px] p-5 sm:p-7 lg:p-8 shadow-[0_0_60px_rgba(0,0,0,0.55)]">
            <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-pink-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
              <div className="mb-5">
                <p className="text-[11px] tracking-[0.22em] text-pink-300 font-black mb-2">
                  {isLogin ? "LOGIN" : isRegister ? "CREATE SPACE" : isForgot ? "RECOVER" : "RESET"}
                </p>
                <h2 className="text-3xl sm:text-4xl font-black mb-2">{getTitle()}</h2>
                <p className="text-gray-400 text-sm sm:text-base">{getSubtitle()}</p>
              </div>

              {message && (
                <div className="mb-4 bg-red-500/15 border border-red-500/30 text-red-200 p-3.5 rounded-2xl text-sm">
                  {message}
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-500/15 border border-green-500/30 text-green-200 p-3.5 rounded-2xl text-sm">
                  {success}
                </div>
              )}

              {isRegister && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none mb-3.5 focus:border-pink-500 transition-all"
                />
              )}

              {(isLogin || isRegister) && (
                <div className="relative mb-3.5">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(cleanUsername(e.target.value))}
                    onKeyDown={handleKeyDown}
                    className="w-full p-4 pl-10 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-pink-500 transition-all"
                  />
                </div>
              )}

              {(isRegister || isForgot) && (
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none mb-3.5 focus:border-pink-500 transition-all"
                />
              )}

              {(isLogin || isRegister || isReset) && (
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={isReset ? "New password" : "Password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-4 pr-14 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xl"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              )}

              {(isRegister || isReset) && (
                <p className="text-xs text-gray-500 mt-3">
                  Password must be 8+ characters with alphabet, number and special character.
                </p>
              )}

              {isLogin && (
                <div className="flex justify-end mt-3 mb-4">
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
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                onClick={
                  isLogin
                    ? handleLogin
                    : isRegister
                    ? handleRegister
                    : isForgot
                    ? handleForgotPassword
                    : handleResetPassword
                }
                disabled={loading}
                className="w-full mt-5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 p-4 rounded-2xl font-black text-lg hover:scale-[1.02] transition-all duration-300 shadow-[0_0_30px_rgba(236,72,153,0.25)] disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Enter Vybeo"
                  : isRegister
                  ? "Create Vybe Space"
                  : isForgot
                  ? "Send Reset Link"
                  : "Reset Password"}
              </button>

              <p className="text-center text-gray-400 mt-6 text-sm">
                {isLogin && "New to Vybeo?"}
                {isRegister && "Already have a Vybe Space?"}
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
                  {isLogin ? "Join now" : "Login"}
                </button>
              </p>

              <div className="mt-7 pt-5 border-t border-white/10">
                <div className="flex items-center justify-center gap-4 text-gray-500 text-xs sm:text-sm flex-wrap">
                  <span>〰️ Flow</span>
                  <span>✦ Drops</span>
                  <span>💬 Room</span>
                  <span>🎬 Clips</span>
                </div>

                <p className="text-center text-gray-600 text-xs mt-4">
                  © 2026 Vybeo. Real thoughts, real moments.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Landing;