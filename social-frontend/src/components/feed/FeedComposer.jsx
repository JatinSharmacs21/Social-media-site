import React from "react";
import Avatar from "../ui/Avatar";
import MediaComposerPreview from "./MediaComposerPreview";

function FeedComposer({
  composerOpen,
  setComposerOpen,
  hasSelectedMedia,
  caption,
  setCaption,
  currentUser,
  selectedMood,
  setSelectedMood,
  moodPickerOpen,
  setMoodPickerOpen,
  composerType,
  setComposerType,
  moodPickerRef,
  captionRef,
  createPost,
  isSelectedVideo,
  isSelectedImage,
  activePreviewSrc,
  preview,
  uploadError,
  mediaItems,
  hasMediaEdits,
  activeMedia,
  getPreviewFrameClass,
  removeSelectedMedia,
  activeMediaIndex,
  loading,
  mediaUploadStage,
  mediaStudioOpen,
  setMediaStudioOpen,
  setMediaEditModalOpen,
  setMediaInputMode,
  mediaInputRef,
  handleFileChange,
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
  moodChips,
  moodMeta,
  mediaInputMode,
}) {
  return (
    <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading) createPost();
            }}
            className={`relative overflow-visible w-full mb-3.5 sm:mb-6 transition-all duration-300 ${
              composerOpen || hasSelectedMedia || caption.trim()
                ? `bg-zinc-950/90 border border-white/10 rounded-[22px] sm:rounded-[28px] p-2.5 sm:p-4 shadow-xl shadow-black/30 ${
                    selectedMood !== "All" ? "shadow-pink-500/10" : ""
                  }`
                : ""
            }`}
          >
            {!composerOpen && !hasSelectedMedia && !caption.trim() && (
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.035] px-3 py-2.5 text-left transition hover:border-pink-400/25 hover:bg-white/[0.055] active:scale-[0.99]"
              >
                <Avatar
  src={currentUser?.profilePic}
  name={currentUser?.name || "User"}
  size="lg"
  className="rounded-full"
/>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] sm:text-[14px] font-black text-white">Drop a vybe...</p>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold text-gray-500">Thought • Moment • Clip</p>
                </div>
                <span className="rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-1.5 text-[10px] sm:text-[11px] font-black text-pink-100 shadow-lg shadow-pink-500/10 transition group-hover:border-cyan-300/25 group-hover:text-white">
                  + Start
                </span>
              </button>
            )}

            {(composerOpen || hasSelectedMedia || caption.trim()) && (
              <>
            <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {["Thought", "Moment", "Clip"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setComposerType(type)}
                    className={`shrink-0 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                      composerType === type
                        ? "bg-gradient-to-r from-pink-500/25 to-cyan-500/20 border-pink-400/30 text-white"
                        : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {!hasSelectedMedia && !caption.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setComposerOpen(false);
                    setMoodPickerOpen(false);
                  }}
                  className="shrink-0 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] font-black text-gray-400 transition hover:border-pink-400/25 hover:bg-white/[0.055] hover:text-white"
                >
                  Hide
                </button>
              )}
            </div>
            
            <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
  <Avatar
  src={currentUser?.profilePic}
  name={currentUser?.name || "User"}
  size="lg"
/>

  <div ref={moodPickerRef} className="relative flex-1 min-w-0">
    {hasSelectedMedia && (
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] tracking-[0.18em] text-cyan-300 font-black">MEDIA CAPTION</p>
        <span className="text-[10px] text-gray-500">Shift + Enter for new line</span>
      </div>
    )}

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
      placeholder={
        hasSelectedMedia
          ? isSelectedVideo
            ? "Write a caption for this clip..."
            : "Write a caption for this moment..."
          : composerType === "Thought"
          ? moodMeta[selectedMood]?.placeholder || "Drop a real thought..."
          : composerType === "Moment"
          ? "Say something about this moment..."
          : "Add a caption to your clip..."
      }
      rows={1}
      className={`w-full min-w-0 overflow-y-auto no-scrollbar border outline-none transition-all text-white placeholder:text-gray-400 resize-none leading-6 ${
        hasSelectedMedia
          ? "bg-black/35 border-cyan-400/15 rounded-[22px] px-4 py-3 pr-4 focus:border-cyan-400/40 focus:bg-black/45 shadow-inner shadow-black/30"
          : "bg-white/5 border-white/10 rounded-2xl px-4 py-3 pr-24 focus:border-pink-500 focus:bg-white/[0.07]"
      }`}
      style={{ minHeight: hasSelectedMedia ? "50px" : "52px", maxHeight: "170px" }}
    />

    <button
      type="button"
      onClick={() => setMoodPickerOpen((prev) => !prev)}
      className={`${hasSelectedMedia ? "hidden" : "absolute"} right-2 top-2 h-9 px-3 rounded-xl border text-xs font-black transition-all ${
        selectedMood !== "All"
          ? `bg-gradient-to-r ${moodMeta[selectedMood]?.style} border-white/20 text-white`
          : "bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
      }`}
    >
      <span className="mr-1">{moodMeta[selectedMood]?.icon}</span>
      {selectedMood === "All" ? "Mood" : selectedMood}
    </button>

    {hasSelectedMedia && (
      <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
        <span className="text-[10px] font-black tracking-[0.18em] text-gray-500">MOOD</span>
        <button
          type="button"
          onClick={() => setMoodPickerOpen((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black transition-all ${
            selectedMood !== "All"
              ? `bg-gradient-to-r ${moodMeta[selectedMood]?.style} border-white/20 text-white`
              : "bg-black/35 border-white/10 text-gray-400 hover:text-white"
          }`}
        >
          <span>{moodMeta[selectedMood]?.icon}</span>
          {selectedMood === "All" ? "Choose mood" : selectedMood}
        </button>
      </div>
    )}

    {moodPickerOpen && (
      <div className={`absolute right-0 ${hasSelectedMedia ? "top-[124px]" : "top-12"} z-30 w-[260px] rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl shadow-black/50 p-3`}>
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

            <MediaComposerPreview
              hasSelectedMedia={hasSelectedMedia}
              uploadError={uploadError}
              mediaItems={mediaItems}
              isSelectedVideo={isSelectedVideo}
              hasMediaEdits={hasMediaEdits}
              activeMedia={activeMedia}
              getPreviewFrameClass={getPreviewFrameClass}
              isSelectedImage={isSelectedImage}
              activePreviewSrc={activePreviewSrc}
              preview={preview}
              removeSelectedMedia={removeSelectedMedia}
              activeMediaIndex={activeMediaIndex}
              loading={loading}
              mediaUploadStage={mediaUploadStage}
              mediaStudioOpen={mediaStudioOpen}
              setMediaStudioOpen={setMediaStudioOpen}
              setMediaEditModalOpen={setMediaEditModalOpen}
              setMediaInputMode={setMediaInputMode}
              mediaInputRef={mediaInputRef}
              selectMediaItem={selectMediaItem}
              removeMediaItem={removeMediaItem}
              mediaAspectOptions={mediaAspectOptions}
              mediaFilterOptions={mediaFilterOptions}
              mediaEditTab={mediaEditTab}
              setMediaEditTab={setMediaEditTab}
              resetMediaEditor={resetMediaEditor}
              mediaAspect={mediaAspect}
              setMediaAspect={setMediaAspect}
              mediaZoom={mediaZoom}
              setMediaZoom={setMediaZoom}
              mediaFilter={mediaFilter}
              setMediaFilter={setMediaFilter}
            />

            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple={mediaInputMode === "add"}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {!hasSelectedMedia && (
                <button
                  type="button"
                  onClick={() => {
                    setMediaInputMode("add");
                    mediaInputRef.current?.click();
                  }}
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 sm:py-3 rounded-2xl text-sm font-semibold transition-all"
                >
                  {composerType === "Clip" ? "🎬 Add Clip" : "📎 Add Moment"}
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto sm:ml-auto bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 px-7 py-2.5 sm:py-3 rounded-2xl font-black hover:scale-[1.02] transition-all shadow-lg shadow-pink-500/15 disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading
                  ? hasSelectedMedia
                    ? "Preparing media..."
                    : "Dropping..."
                  : composerType === "Thought"
                  ? "Drop Thought"
                  : composerType === "Moment"
                  ? "Drop Moment"
                  : "Drop Clip"}
              </button>
            </div>
                        </>
            )}
    </form>
  );
}

export default FeedComposer;