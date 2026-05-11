import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      setMessage("Please fill all fields ❌");
      return;
    }

    setLoading(true);
    setMessage("");

    axios.post("http://localhost:5000/api/auth/login", { email, password })
      .then(res => {
        setLoading(false);

        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          setMessage("Login successful 🔥");

          setTimeout(() => {
            window.location.href = "/feed";
          }, 800);
        } else {
          setMessage("Login failed ❌");
        }
      })
      .catch(() => {
        setLoading(false);
        setMessage("Invalid credentials ❌");
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2>Welcome Back 👋</h2>

        {message && (
          <div className={`message ${message.includes("successful") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account?{" "}
          <span onClick={() => window.location.href = "/register"}>
            Register
          </span>
        </p>

      </div>
    </div>
  );
}

export default Login;