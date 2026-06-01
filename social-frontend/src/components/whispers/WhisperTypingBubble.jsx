import React from "react";

function WhisperTypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-[22px] rounded-bl-[8px] border border-white/[0.065] bg-white/[0.06] px-4 py-3 shadow-lg shadow-black/24 backdrop-blur-xl">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:240ms]" />
        </span>
      </div>
    </div>
  );
}

export default WhisperTypingBubble;
