import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Resets scroll position to the top whenever the route changes, so
// switching tabs (Feed -> Discover -> Vybe -> Clips -> Space, etc.)
// always opens the new page fresh instead of keeping the previous
// page's scroll position.
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    // Some pages (Reels, Whispers) scroll an inner container instead of
    // the window — reset those too if one happens to be mounted.
    document.querySelectorAll("[data-scroll-reset]").forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname]);

  return null;
}

export default ScrollToTop;