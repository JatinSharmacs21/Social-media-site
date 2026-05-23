import React from "react";

function Avatar({
  src,
  name = "User",
  size = "md",
  className = "",
  onClick,
}) {
  const sizes = {
    xs: "w-7 h-7 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-11 h-11 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const baseClass = `${className} ${
    sizes[size] || sizes.md
  } relative isolate shrink-0 overflow-hidden rounded-full border border-white/15 bg-zinc-900 flex items-center justify-center text-white font-black shadow-lg shadow-black/25`;

  const content = src ? (
    <img
      src={src}
      alt={name}
      className="relative z-10 h-full w-full rounded-full object-cover"
      loading="lazy"
    />
  ) : (
    <>
      <span className="absolute inset-0 bg-gradient-to-br from-pink-500/45 via-purple-500/35 to-cyan-500/45" />
      <span className="absolute inset-[2px] rounded-full bg-black/35 backdrop-blur-sm" />
      <span className="absolute -right-2 -top-2 h-1/2 w-1/2 rounded-full bg-cyan-400/30 blur-lg" />
      <span className="absolute -bottom-2 -left-2 h-1/2 w-1/2 rounded-full bg-pink-400/30 blur-lg" />
      <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
        {initial}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}

export default Avatar;