import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">

      <Navbar />

      <div className="hero">

        <h1>
          Connect. Share. Explore. 🌍
        </h1>

        <p>
          Join the community and share your thoughts with the world.
        </p>

        <div className="hero-buttons">
          <button onClick={() => navigate("/register")} className="primary">
            Get Started 🚀
          </button>

          <button onClick={() => navigate("/login")} className="secondary">
            Login
          </button>
        </div>

      </div>

      <div className="features">

        <div className="card">
          <h3>📝 Create Posts</h3>
          <p>Share your thoughts with the community.</p>
        </div>

        <div className="card">
          <h3>❤️ Like & Engage</h3>
          <p>Interact with posts and connect with others.</p>
        </div>

        <div className="card">
          <h3>👤 Build Profile</h3>
          <p>Create your identity and showcase yourself.</p>
        </div>

      </div>

    </div>
  );
}

export default Landing;