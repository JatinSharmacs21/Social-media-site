export const moodChips = ["All", "Deep", "Funny", "Chaos", "Late Night", "Creative", "College"];

export const flowTabs = ["For You", "Tuned In", "Close Circle"];

export const mediaAspectOptions = [
  { value: "Original", label: "Original", hint: "Keep natural frame" },
  { value: "Square", label: "1:1", hint: "Square post" },
  { value: "Portrait", label: "4:5", hint: "Feed portrait" },
  { value: "Wide", label: "16:9", hint: "Landscape" },
];

export const mediaFilterOptions = [
  { value: "Original", label: "Original", css: "none", className: "" },
  { value: "Warm", label: "Warm", css: "saturate(1.1) sepia(0.18)", className: "saturate-150 sepia" },
  { value: "Cool", label: "Cool", css: "saturate(1.05) hue-rotate(18deg)", className: "hue-rotate-15" },
  { value: "Mono", label: "Mono", css: "grayscale(1)", className: "grayscale" },
  { value: "Vintage", label: "Vintage", css: "sepia(0.45) contrast(0.95)", className: "sepia" },
  { value: "Soft", label: "Soft", css: "brightness(1.06) contrast(0.92)", className: "brightness-110" },
];

export const moodMeta = {
  All: {
    icon: "✨",
    style: "from-pink-500/25 to-cyan-500/20",
    placeholder: "Drop a real thought...",
    keywords: [],
  },
  Deep: {
    icon: "🌙",
    style: "from-indigo-500/30 to-purple-500/20",
    placeholder: "Drop something deep...",
    keywords: ["deep", "thought", "life", "real", "night", "feel"],
  },
  Funny: {
    icon: "😂",
    style: "from-yellow-500/25 to-orange-500/20",
    placeholder: "Drop the funny moment...",
    keywords: ["funny", "laugh", "lol", "meme", "joke", "crazy"],
  },
  Chaos: {
    icon: "🔥",
    style: "from-red-500/25 to-pink-500/20",
    placeholder: "Drop the chaos...",
    keywords: ["chaos", "wild", "random", "mess", "crazy", "drama"],
  },
  "Late Night": {
    icon: "🖤",
    style: "from-zinc-500/30 to-blue-500/20",
    placeholder: "Late night thoughts?",
    keywords: ["late", "night", "sleep", "alone", "miss", "overthink"],
  },
  Creative: {
    icon: "🎨",
    style: "from-cyan-500/25 to-pink-500/20",
    placeholder: "Drop your creative vybe...",
    keywords: ["creative", "art", "design", "music", "edit", "idea"],
  },
  College: {
    icon: "🎓",
    style: "from-emerald-500/25 to-cyan-500/20",
    placeholder: "Drop the college scene...",
    keywords: ["college", "class", "exam", "hostel", "campus", "friends"],
  },
};
