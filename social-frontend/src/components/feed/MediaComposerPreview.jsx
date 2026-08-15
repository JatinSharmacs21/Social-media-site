import React from "react";
import Avatar from "../ui/Avatar";

function MediaComposerPreview({
  hasSelectedMedia,
  fullScreen,
  uploadError,
  mediaItems,
  isSelectedVideo,
  hasMediaEdits,
  activeMedia,
  getPreviewFrameClass,
  isSelectedImage,
  activePreviewSrc,
  preview,
  removeSelectedMedia,
  activeMediaIndex,
  loading,
  mediaUploadStage,
  mediaStudioOpen,
  setMediaStudioOpen,
  setMediaEditModalOpen,
  setMediaInputMode,
  mediaInputRef,
  selectMediaItem,
  removeMediaItem,
  mediaAspectOptions,
  mediaFilterOptions,
  mediaEditTab,
  setMediaEditTab,
  resetMediaEditor,
  mediaAspect,
  setMediaAspect,
  mediaZoom,
  setMediaZoom,
  mediaFilter,
  setMediaFilter,
  caption,
  setCaption,
  captionRef,
  createPost,
  selectedMood,
  setSelectedMood,
  moodPickerOpen,
  setMoodPickerOpen,
  moodPickerRef,
  moodChips,
  moodMeta,
  currentUser,
}) {
  if (!hasSelectedMedia && !uploadError) return null;

  return (
    <div
      className={
        fullScreen
          ? "flex-1 min-h-0 flex flex-col overflow-hidden"
          : "mb-4 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-cyan-500/[0.04] p-3 shadow-2xl shadow-black/40"
      }
    >
      <div
        className={
          fullScreen
            ? "shrink-0 flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-white/10 bg-black/25"
            : "flex items-center justify-between gap-3 mb-3"
        }
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar
            src={currentUser?.profilePic}
            name={currentUser?.name || "User"}
            size={fullScreen ? "md" : "lg"}
          />
          <h4 className="truncate text-[14px] font-black text-white">
            {currentUser?.name || "You"}
          </h4>
        </div>

        {hasSelectedMedia && (
          <span className="shrink-0 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] text-[11px] font-bold text-gray-300">
            {mediaItems.length > 1 ? `🧱 ${mediaItems.length} Moments` : isSelectedVideo ? "🎬 Clip" : hasMediaEdits() ? "✨ Edited" : "📸 Moment"}
          </span>
        )}
      </div>

      {uploadError && (
        <div className={fullScreen ? "shrink-0 mx-3 sm:mx-4 mt-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200" : "mb-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200"}>
          {uploadError}
        </div>
      )}

      {activeMedia && (
        <div className={fullScreen ? "flex-1 min-h-0 flex flex-col" : "space-y-3"}>
          <div
            className={
              fullScreen
                ? "flex-1 min-h-0 flex flex-col overflow-hidden bg-[#050508]"
                : "rounded-[28px] overflow-hidden border border-pink-400/15 bg-[#050508] shadow-[0_0_45px_rgba(236,72,153,0.10)] transition-all duration-300"
            }
          >
            <div className={`group relative overflow-hidden ${fullScreen ? "flex-1 min-h-0" : getPreviewFrameClass()}`}>
              {isSelectedImage ? (
                <>
                  <img
                    src={activePreviewSrc}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-35"
                  />

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.13),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.35))]" />

                  <img
                    src={activePreviewSrc}
                    alt="preview"
                    loading="lazy"
                    className="relative z-10 w-full h-full object-contain p-2.5 transition-all duration-300"
                  />
                </>
              ) : (
                <video
                  src={activeMedia?.preview || preview}
                  controls
                  playsInline
                  className="relative z-10 w-full h-full object-contain bg-black"
                />
              )}

              <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
                {mediaItems.length > 1 && (
                  <span className="rounded-full bg-black/65 border border-white/10 backdrop-blur-xl px-3 py-1.5 text-[10px] font-black text-white shadow-lg">
                    {activeMediaIndex + 1} / {mediaItems.length}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelectedMedia();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-500/20 px-3 py-1.5 text-[11px] font-black text-red-100 backdrop-blur-xl shadow-lg hover:bg-red-500/30 active:scale-95 transition-all"
                  title="Remove current media"
                >
                  ✕
                </button>
              </div>

              {mediaItems.length > 1 && (
                <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/45 border border-white/10 backdrop-blur-xl px-3 py-2">
                  {mediaItems.slice(0, 6).map((_, dotIndex) => (
                    <span
                      key={dotIndex}
                      className={`h-1.5 rounded-full transition-all ${
                        dotIndex === activeMediaIndex ? "w-5 bg-pink-400" : "w-1.5 bg-white/55"
                      }`}
                    />
                  ))}
                </div>
              )}

              {loading && hasSelectedMedia && (
                <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center px-6">
                  <div className="w-full max-w-xs text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 mx-auto mb-4 animate-pulse shadow-lg shadow-pink-500/30" />
                    <p className="font-black text-white">
                      {mediaUploadStage || "Preparing your vybe..."}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Please keep this screen open.</p>
                    <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-[uploadFlow_1.1s_ease-in-out_infinite]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={moodPickerRef} className={`relative shrink-0 flex items-end gap-2 border-t border-white/10 bg-white/[0.035] px-3 ${fullScreen ? "sm:px-4" : ""} py-2.5`}>
              <textarea
                ref={captionRef}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading) createPost();
                  }
                }}
                placeholder={isSelectedVideo ? "Write a caption for this clip..." : "Write a caption for this moment..."}
                rows={1}
                className="flex-1 min-w-0 overflow-y-auto no-scrollbar border outline-none transition-all text-white placeholder:text-gray-500 resize-none leading-5 bg-black/30 border-white/10 rounded-2xl px-3.5 py-2.5 focus:border-cyan-400/40 focus:bg-black/45 shadow-inner shadow-black/20"
                style={{ minHeight: "46px", maxHeight: fullScreen ? "84px" : "120px" }}
              />

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoodPickerOpen((prev) => !prev);
                  }}
                  className={`h-[46px] px-3.5 rounded-2xl border text-xs font-black transition-all ${
                    selectedMood !== "All"
                      ? `bg-gradient-to-r ${moodMeta[selectedMood]?.style} border-white/20 text-white`
                      : "bg-black/30 border-white/10 text-gray-300 hover:text-white hover:bg-black/45"
                  }`}
                >
                  <span className="block leading-none mb-0.5">{moodMeta[selectedMood]?.icon}</span>
                  {selectedMood === "All" ? "Mood" : selectedMood}
                </button>

                {moodPickerOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 bottom-[54px] z-30 w-[260px] rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl shadow-black/50 p-3"
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-[10px] tracking-[0.2em] text-pink-300 font-black">
                        SELECT VYBE
                      </p>

                      <button
                        type="button"
                        onClick={() => setMoodPickerOpen(false)}
                        className="text-gray-500 hover:text-white text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {moodChips.map((mood) => (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => {
                            setSelectedMood(mood);
                            setMoodPickerOpen(false);
                          }}
                          className={`px-3 py-2.5 rounded-2xl border text-sm font-bold text-left transition-all ${
                            selectedMood === mood
                              ? `bg-gradient-to-r ${moodMeta[mood]?.style} border-white/20 text-white`
                              : "bg-white/[0.035] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.07]"
                          }`}
                        >
                          <span className="mr-1">{moodMeta[mood]?.icon}</span>
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar ${fullScreen ? "px-3 sm:px-4 py-2.5 border-t border-white/10 bg-black/20" : "pb-1"}`}>
            {isSelectedImage && (
              <button
                type="button"
                onClick={() => {
                  setMediaStudioOpen(true);
                  setMediaEditModalOpen(true);
                }}
                className={`shrink-0 px-4 py-2.5 rounded-2xl border text-xs font-black transition-all ${
                  mediaStudioOpen
                    ? "bg-pink-500/15 border-pink-400/30 text-white"
                    : "bg-white/[0.05] border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                Edit
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMediaInputMode("add");
                mediaInputRef.current?.click();
              }}
              className="shrink-0 px-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.05] text-xs font-black text-gray-300 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              Add another
            </button>

            <button
              type="button"
              onClick={() => {
                setMediaInputMode("replace");
                mediaInputRef.current?.click();
              }}
              className="shrink-0 px-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.05] text-xs font-black text-gray-300 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              Replace current
            </button>
          </div>

          {false && isSelectedImage && mediaStudioOpen && (
            <div className="rounded-[24px] border border-white/10 bg-black/40 p-3 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs font-black text-white">Edit media</p>
                  <p className="text-[10px] text-gray-500">Crop and filters apply to preview and final upload.</p>
                </div>

                <button
                  type="button"
                  onClick={resetMediaEditor}
                  className="px-3 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-[11px] font-bold text-gray-400 hover:text-white"
                >
                  Reset
                </button>
              </div>

              <div className="flex items-center gap-1.5 rounded-2xl bg-white/[0.04] border border-white/10 p-1 mb-3 w-fit">
                {["Crop", "Filter"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMediaEditTab(tab)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                      mediaEditTab === tab
                        ? "bg-white/[0.1] text-white"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {mediaEditTab === "Crop" ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] tracking-[0.18em] text-gray-500 font-black">FRAME</p>
                      <span className="text-[10px] text-gray-600">{mediaAspect}</span>
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {mediaAspectOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setMediaAspect(option.value)}
                          className={`shrink-0 rounded-2xl border px-3.5 py-2.5 text-left transition-all ${
                            mediaAspect === option.value
                              ? "bg-pink-500/15 border-pink-400/30 text-white"
                              : "bg-white/[0.035] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <p className="text-[11px] font-black leading-none">{option.label}</p>
                          <p className="text-[9px] text-gray-500 mt-1">{option.hint}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] tracking-[0.18em] text-gray-500 font-black">ZOOM</p>
                      <span className="text-[10px] text-gray-500">{mediaZoom.toFixed(1)}x</span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.05"
                      value={mediaZoom}
                      onChange={(e) => setMediaZoom(Number(e.target.value))}
                      className="w-full accent-pink-500 h-2"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] tracking-[0.18em] text-gray-500 font-black mb-2">FILTER</p>

                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {mediaFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMediaFilter(option.value)}
                        className={`shrink-0 w-[72px] rounded-2xl border p-1.5 transition-all ${
                          mediaFilter === option.value
                            ? "bg-cyan-500/15 border-cyan-400/30 text-white"
                            : "bg-white/[0.035] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className={`h-9 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 ${option.className}`} />
                        <p className="text-[10px] font-bold mt-1 truncate">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {mediaItems.length > 1 && (
            <div className={fullScreen ? "shrink-0 px-3 sm:px-4 pb-2 pt-1" : ""}>
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[10px] tracking-[0.18em] text-pink-300 font-black">YOUR MOMENTS ({mediaItems.length})</p>
                <button
                  type="button"
                  onClick={() => {
                    setMediaInputMode("add");
                    mediaInputRef.current?.click();
                  }}
                  className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200"
                >
                  Add more
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {mediaItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectMediaItem(index)}
                    className={`relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden border transition-all ${
                      activeMediaIndex === index
                        ? "border-pink-400 shadow-lg shadow-pink-500/20"
                        : "border-white/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.editedPreview || item.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video src={item.preview} className="w-full h-full object-cover" />
                    )}
                    <span className="absolute bottom-1 right-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[9px] font-black text-white">
                      {index + 1}
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMediaItem(index);
                      }}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-red-400/25 bg-black/70 text-[10px] font-black text-red-100 backdrop-blur-md hover:bg-red-500/30"
                      title="Remove this media"
                    >
                      ×
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setMediaInputMode("add");
                    mediaInputRef.current?.click();
                  }}
                  className="shrink-0 w-16 h-16 rounded-2xl border border-dashed border-white/20 bg-white/[0.035] text-xl text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {isSelectedVideo && !fullScreen && (
            <div className="rounded-[20px] border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-black text-white">Clip preview</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Video editing is lightweight for speed. Add another clip or remove this one before posting.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MediaComposerPreview;