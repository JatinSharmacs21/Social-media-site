import React from "react";

export const HeartIcon = ({ filled = true }) => (
  <svg
    viewBox="0 0 24 24"
    className="w-[20px] h-[20px]"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const CommentIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-[20px] h-[20px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  </svg>
);

export const ShareIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-[20px] h-[20px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" />
    <path d="M16 6l-4-4-4 4" />
    <path d="M12 2v14" />
  </svg>
);

export const BookmarkIcon = ({ saved }) => (
  <svg
    viewBox="0 0 24 24"
    className="w-[20px] h-[20px]"
    fill={saved ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);