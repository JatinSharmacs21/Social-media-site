import React, { useState } from "react";
import API from "../services/api";
import "./Login.css"; // reuse same CSS


function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    if (!name || !email || !password) {
      setMessage("Fill all fields ❌");
      return;
    }

    setLoading(true);

    API.post("/api/auth/register", {
      name, email, password
    })
    .then(() => {
      setLoading(false);
      setMessage("Registered successfully 🔥");

      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    })
    .catch(() => {
      setLoading(false);
      setMessage("Error ❌");
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2>Create Account 🚀</h2>

        {message && (
          <div className={`message ${message.includes("success") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <input placeholder="Name" onChange={(e)=>setName(e.target.value)} />
        <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} />

        <button onClick={handleRegister}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p>
          Already have an account?{" "}
          <span onClick={() => window.location.href = "/"}>
            Login
          </span>
        </p>

      </div>
    </div>
  );
}

export default Register;