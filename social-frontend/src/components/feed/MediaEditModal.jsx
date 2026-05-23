import React from "react";

function MediaEditModal({
  open,
  activeMedia,
  isSelectedImage,
  onClose,
  getPreviewFrameClass,
  mediaAspect,
  activePreviewSrc,
  mediaEditTab,
  setMediaEditTab,
  mediaAspectOptions,
  setMediaAspect,
  mediaZoom,
  setMediaZoom,
  mediaFilterOptions,
  mediaFilter,
  setMediaFilter,
  resetMediaEditor,
}) {
  if (!open || !activeMedia || !isSelectedImage) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto no-scrollbar rounded-t-[30px] sm:rounded-[34px] border border-white/10 bg-zinc-950 pb-[calc(env(safe-area-inset-bottom)+18px)] shadow-2xl shadow-black/60"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-zinc-950/95 backdrop-blur-xl px-4 py-4">
          <div>
            <p className="text-[10px] tracking-[0.22em] text-pink-300 font-black">EDIT MEDIA</p>
            <h3 className="text-lg sm:text-xl font-black text-white">Crop & filters</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white hover:bg-white/[0.08]"
          >
            Done
          </button>
        </div>

        <div className="p-3.5 sm:p-4 space-y-4">
          <div className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-black ${getPreviewFrameClass(mediaAspect)} shadow-2xl shadow-black/40`}>
            <img
              src={activePreviewSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl opacity-30"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.16),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.6))]" />
            <img
              src={activePreviewSrc}
              alt="editing preview"
              className="relative z-10 h-full w-full object-contain p-3"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-2xl bg-white/[0.04] border border-white/10 p-1 w-fit">
            {["Crop", "Filter"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMediaEditTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  mediaEditTab === tab ? "bg-white/[0.1] text-white" : "text-gray-500 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {mediaEditTab === "Crop" ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] tracking-[0.18em] text-gray-500 font-black">FRAME</p>
                  <span className="text-[10px] text-gray-500">{mediaAspect}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {mediaAspectOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMediaAspect(option.value)}
                      className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                        mediaAspect === option.value
                          ? "bg-pink-500/15 border-pink-400/30 text-white"
                          : "bg-white/[0.035] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <p className="text-sm font-black leading-none">{option.label}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{option.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] tracking-[0.18em] text-gray-500 font-black">ZOOM</p>
                  <span className="text-xs text-gray-400">{mediaZoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.05"
                  value={mediaZoom}
                  onChange={(e) => setMediaZoom(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] tracking-[0.18em] text-gray-500 font-black mb-3">FILTER</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {mediaFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMediaFilter(option.value)}
                    className={`rounded-2xl border p-2 transition-all ${
                      mediaFilter === option.value
                        ? "bg-cyan-500/15 border-cyan-400/30 text-white"
                        : "bg-white/[0.035] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className={`h-14 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 ${option.className}`} />
                    <p className="text-[11px] font-bold mt-2 truncate">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={resetMediaEditor}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-gray-300 hover:text-white hover:bg-white/[0.08]"
            >
              Reset edits
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-pink-500/20"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaEditModal;
