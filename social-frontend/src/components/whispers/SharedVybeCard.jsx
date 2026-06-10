import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";

const TYPE_META = {
  Thought: {
    icon: "💭",
    label: "Shared a Thought",
    accent: "from-fuchsia-400/14 via-violet-400/10 to-cyan-300/8",
  },
  Moment: {
    icon: "📸",
    label: "Shared a Moment",
    accent: "from-amber-300/12 via-fuchsia-400/10 to-cyan-300/8",
  },
  Spark: {
    icon: "🎬",
    label: "Shared a Clip",
    accent: "from-cyan-300/12 via-violet-400/10 to-pink-400/8",
  },
};

const normalizeVybeType = (type) => {
  if (!type) return null;
  const normalized = String(type).toLowerCase();

  if (normalized.includes("moment") || normalized.includes("image")) return "Moment";
  if (
    normalized.includes("spark") ||
    normalized.includes("clip") ||
    normalized.includes("reel") ||
    normalized.includes("video")
  ) {
    return "Spark";
  }

  return "Thought";
};

const getVybeType = (sharedVybe = {}) => {
  const explicitType = normalizeVybeType(sharedVybe.type);
  if (explicitType) return explicitType;

  const mediaType = sharedVybe.media?.type;
  if (mediaType === "video") return "Spark";
  if (mediaType === "image") return "Moment";

  return "Thought";
};

function SharedVybeCard({ sharedVybe, mine }) {
  const navigate = useNavigate();

  if (!sharedVybe?.postId) return null;

  const vybeType = getVybeType(sharedVybe);
  const meta = TYPE_META[vybeType] || TYPE_META.Thought;

  const caption = sharedVybe.caption || "A quiet Vybe was shared.";
  const authorName = sharedVybe.author?.name || sharedVybe.author?.username || "Vybeo";
  const authorHandle = sharedVybe.author?.username ? `@${sharedVybe.author.username}` : "Vybe Flow";
  const media = sharedVybe.media || null;
  const hasMedia = Boolean(media?.url);

  const openVybe = (event) => {
    event.stopPropagation();
    navigate(`/feed?post=${sharedVybe.postId}&open=1`);
  };

  return (
    <div
      onClick={openVybe}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openVybe(event);
        }
      }}
      className={`group/shared relative w-[min(68vw,300px)] overflow-hidden rounded-[22px] border text-left shadow-xl transition hover:-translate-y-0.5 active:scale-[0.99] ${
        mine
          ? "border-white/14 bg-[#090b15]/95 shadow-violet-950/20"
          : "border-white/[0.08] bg-[#090b14]/95 shadow-black/35"
      }`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.accent}`} />
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/[0.075] blur-3xl" />

      <div className="relative p-3">
        <div className="mb-2.5 flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl border border-white/[0.09] bg-white/[0.065] text-base shadow-inner shadow-white/[0.025]">
            {meta.icon}
          </span>
          <p className="min-w-0 truncate text-[14px] font-bold leading-tight text-white">
            {meta.label}
          </p>
        </div>

        {hasMedia ? (
          <div className="mb-2.5 overflow-hidden rounded-[17px] border border-white/[0.085] bg-black/35">
            {media.type === "video" ? (
              <div className="relative h-40 w-full bg-black">
                <video
                  src={media.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 grid place-items-center bg-black/10">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/45 text-sm text-white backdrop-blur-xl">
                    ▶
                  </span>
                </div>
              </div>
            ) : (
              <img
                src={media.url}
                alt="Shared Vybe"
                loading="lazy"
                className="h-40 w-full object-cover"
              />
            )}
          </div>
        ) : null}

        <p
          className={`line-clamp-4 whitespace-pre-wrap break-words text-[14px] font-semibold leading-relaxed text-white/92 ${
            hasMedia
              ? "rounded-[17px] border border-white/[0.06] bg-white/[0.045] px-3 py-2.5"
              : "px-0.5 py-1"
          }`}
        >
          {caption}
        </p>

        <div className="mt-2.5 border-t border-white/[0.07] pt-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar src={sharedVybe.author?.profilePic} name={authorName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold leading-tight text-white/86">
                  {authorName}
                </p>
                <p className="truncate text-[10px] font-semibold text-white/42">
                  {authorHandle}
                </p>
              </div>
            </div>

            <span className="shrink-0 text-[11px] font-black text-white/78 transition group-hover/shared:text-white">
              Open →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SharedVybeCard;
