import React from "react";
import { formatWhisperTime, getInitials } from "../../utils/whisperHelpers";

function WhisperMessageBubble({ message, mine, activePerson }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[82%] gap-2 md:max-w-[68%] ${mine ? "flex-row-reverse" : "flex-row"}`}>
        {!mine && (
          <div className="mt-auto hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-[10px] font-black text-zinc-400 sm:flex">
            {getInitials(activePerson?.name || activePerson?.username)}
          </div>
        )}

        <div
          className={`group relative px-4 py-3 shadow-lg transition md:max-w-[620px] ${
            mine
              ? "rounded-[26px] rounded-br-[12px] bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-pink-500/18"
              : "rounded-[26px] rounded-bl-[12px] border border-white/10 bg-white/[0.085] text-zinc-100 shadow-lg shadow-black/25 backdrop-blur-xl"
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-relaxed md:text-[15px]">{message.text}</p>
          <p className={`mt-1.5 text-right text-[10px] font-black ${mine ? "text-white/72" : "text-zinc-500"}`}>
            {formatWhisperTime(message.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default WhisperMessageBubble;
