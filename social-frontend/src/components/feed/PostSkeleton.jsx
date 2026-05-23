import React from "react";

function PostSkeleton() {
  return (
    <div className="bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl animate-pulse">
      <div className="flex items-center gap-3 p-4">
        <div className="w-11 h-11 rounded-full bg-white/10"></div>

        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-white/10 rounded"></div>
          <div className="h-3 w-24 bg-white/10 rounded"></div>
        </div>
      </div>

      <div className="aspect-[4/5] bg-white/10"></div>

      <div className="p-4 flex gap-5">
        <div className="h-5 w-12 bg-white/10 rounded"></div>
        <div className="h-5 w-12 bg-white/10 rounded"></div>
        <div className="h-5 w-12 bg-white/10 rounded"></div>
      </div>
    </div>
  );
}

export default PostSkeleton;