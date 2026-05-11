import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="navbar">

      {/* LEFT LOGO */}
      <div className="logo" onClick={() => navigate("/")}>
         SocialApp
      </div>

      {/* RIGHT MENU */}
      <div className="nav-right">
        {!token ? (
          <>
            <button onClick={() => navigate("/login")} className="nav-btn login">
              Login
            </button>

            <button onClick={() => navigate("/register")} className="nav-btn register">
              Register
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate("/feed")} className="nav-icon">
              🏠
            </button>

            <button onClick={() => navigate("/search")} className="nav-icon">
              🔍
            </button>

            <button onClick={() => navigate("/reels")} className="nav-icon">
              🎬
            </button>

            <button onClick={() => navigate("/profile")} className="nav-icon">
              👤
            </button>

            <button onClick={logout} className="nav-btn logout">
              Logout
            </button>
          </>
        )}
      </div>

    </div>
  );
}

export default Navbar;