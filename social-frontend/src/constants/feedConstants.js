export const moodChips = ["All", "Chill", "Happy", "Sad", "Excited", "Angry", "Loved"];

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
  Chill: {
    icon: "😌",
    style: "from-cyan-500/25 to-blue-500/20",
    placeholder: "Drop a calm vybe...",
    keywords: ["chill", "calm", "peace", "relax"],
  },
  Happy: {
    icon: "😊",
    style: "from-yellow-500/25 to-pink-500/20",
    placeholder: "Share what made you smile...",
    keywords: ["happy", "smile", "joy", "good"],
  },
  Sad: {
    icon: "😔",
    style: "from-blue-500/25 to-purple-500/20",
    placeholder: "Say what feels heavy...",
    keywords: ["sad", "low", "hurt", "miss"],
  },
  Excited: {
    icon: "⚡",
    style: "from-pink-500/25 to-orange-500/20",
    placeholder: "Drop the hype...",
    keywords: ["excited", "hype", "energy", "crazy"],
  },
  Angry: {
    icon: "😤",
    style: "from-red-500/25 to-orange-500/20",
    placeholder: "Vent it out...",
    keywords: ["angry", "mad", "annoyed", "rage"],
  },
  Loved: {
    icon: "💜",
    style: "from-purple-500/25 to-pink-500/20",
    placeholder: "Share the love...",
    keywords: ["love", "loved", "heart", "miss you"],
  },
};