import React from "react";

function MediaGallery({
  galleryPost,
  activeGalleryMedia,
  closeMediaGallery,
  galleryIndex,
  galleryMedia,
  setSharePost,
  galleryDirection,
  handleGalleryTouchStart,
  handleGalleryTouchMove,
  handleGalleryTouchEnd,
  isImageMedia,
  getMediaUrl,
  loadedMedia,
  markMediaLoaded,
  goToGalleryMedia,
  formatVybeTime,
  setGalleryIndex,
}) {
  if (!galleryPost || !activeGalleryMedia) return null;

  return (
    <div
      onClick={closeMediaGallery}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[520px] max-h-[94vh] rounded-[34px] border border-white/10 bg-zinc-950/95 overflow-hidden shadow-2xl shadow-black/70"
      >
        <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          <button
            type="button"
            onClick={closeMediaGallery}
            className="w-11 h-11 rounded-full bg-black/45 border border-white/10 backdrop-blur-xl text-white text-xl hover:bg-white/10 transition-all"
          >
            ←
          </button>

          <div className="rounded-full bg-black/45 border border-white/10 backdrop-blur-xl px-4 py-2 text-sm font-black text-white">
            {galleryIndex + 1} / {galleryMedia.length}
          </div>

          <button
            type="button"
            onClick={() => setSharePost(galleryPost)}
            className="w-11 h-11 rounded-full bg-black/45 border border-white/10 backdrop-blur-xl text-white text-xl hover:bg-white/10 transition-all"
          >
            ⋯
          </button>
        </div>

        <div
          key={`${galleryIndex}-${galleryDirection || "still"}`}
          className={`relative aspect-[4/5] bg-black flex items-center justify-center touch-pan-y select-none overflow-hidden ${
            galleryDirection === "next"
              ? "animate-gallery-next"
              : galleryDirection === "prev"
              ? "animate-gallery-prev"
              : ""
          }`}
          onTouchStart={handleGalleryTouchStart}
          onTouchMove={handleGalleryTouchMove}
          onTouchEnd={handleGalleryTouchEnd}
        >
          {isImageMedia(activeGalleryMedia) ? (
            <>
              {!loadedMedia[getMediaUrl(activeGalleryMedia)] && (
                <div className="absolute inset-0 z-10 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-pink-500/[0.08] animate-pulse" />
              )}
              <img
                src={getMediaUrl(activeGalleryMedia)}
                alt=""
                onLoad={() => markMediaLoaded(activeGalleryMedia)}
                className={`h-full w-full object-cover transition-opacity duration-300 ${loadedMedia[getMediaUrl(activeGalleryMedia)] ? "opacity-100" : "opacity-0"}`}
              />
            </>
          ) : (
            <video
              src={getMediaUrl(activeGalleryMedia)}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-contain bg-black"
            />
          )}

          {galleryMedia.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goToGalleryMedia("prev")}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/45 border border-white/10 backdrop-blur-xl text-white text-2xl hover:bg-white/10 transition-all"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() => goToGalleryMedia("next")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/45 border border-white/10 backdrop-blur-xl text-white text-2xl hover:bg-white/10 transition-all"
              >
                ›
              </button>
            </>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/55 to-transparent p-4 pt-16">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={
                  galleryPost.user?.profilePic ||
                  "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                }
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />

              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">
                  {galleryPost.user?.name || "User"}
                </p>
                <p className="text-xs text-gray-400">
                  {formatVybeTime(galleryPost.createdAt)}
                </p>
              </div>
            </div>

            {(galleryPost.caption || galleryPost.content) && (
              <p className="text-sm text-gray-100 leading-relaxed line-clamp-2">
                {galleryPost.caption || galleryPost.content}
              </p>
            )}
          </div>
        </div>

        {galleryMedia.length > 1 && (
          <div className="p-4 border-t border-white/10 bg-black/35">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {galleryMedia.map((item, index) => (
                <button
                  key={`${getMediaUrl(item)}-${index}`}
                  type="button"
                  onClick={() => setGalleryIndex(index)}
                  className={`relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden border transition-all ${
                    galleryIndex === index
                      ? "border-pink-400 shadow-lg shadow-pink-500/25"
                      : "border-white/10 opacity-65 hover:opacity-100"
                  }`}
                >
                  {isImageMedia(item) ? (
                    <img src={getMediaUrl(item)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={getMediaUrl(item)} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute bottom-1 right-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[9px] font-black text-white">
                    {index + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaGallery;
