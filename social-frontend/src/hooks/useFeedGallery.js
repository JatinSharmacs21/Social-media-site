import { useEffect, useRef, useState } from "react";

function useFeedGallery() {
  const [galleryPost, setGalleryPost] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryDirection, setGalleryDirection] = useState("");

  const galleryTouchStartX = useRef(null);
  const galleryTouchStartY = useRef(null);
  const galleryTouchEndX = useRef(null);

  const galleryMedia = galleryPost?.media || [];
  const activeGalleryMedia = galleryMedia[galleryIndex] || null;

  const closeMediaGallery = () => {
    setGalleryPost(null);
    setGalleryIndex(0);
  };

  const goToGalleryMedia = (direction) => {
    const mediaLength = galleryPost?.media?.length || 0;
    if (mediaLength <= 1) return;

    setGalleryDirection(direction);
    setGalleryIndex((prev) => {
      if (direction === "next") return (prev + 1) % mediaLength;
      return (prev - 1 + mediaLength) % mediaLength;
    });

    window.setTimeout(() => setGalleryDirection(""), 280);
  };

  const handleGalleryTouchStart = (event) => {
    galleryTouchStartX.current = event.touches[0].clientX;
    galleryTouchStartY.current = event.touches[0].clientY;
    galleryTouchEndX.current = event.touches[0].clientX;
  };

  const handleGalleryTouchMove = (event) => {
    galleryTouchEndX.current = event.touches[0].clientX;
  };

  const handleGalleryTouchEnd = () => {
    if (galleryMedia.length <= 1) return;
    if (galleryTouchStartX.current === null || galleryTouchEndX.current === null) return;

    const swipeDistance = galleryTouchStartX.current - galleryTouchEndX.current;
    const minSwipeDistance = 48;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      goToGalleryMedia(swipeDistance > 0 ? "next" : "prev");
    }

    galleryTouchStartX.current = null;
    galleryTouchStartY.current = null;
    galleryTouchEndX.current = null;
  };

  useEffect(() => {
    if (!galleryPost) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMediaGallery();
      if (event.key === "ArrowRight") goToGalleryMedia("next");
      if (event.key === "ArrowLeft") goToGalleryMedia("prev");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryPost, galleryIndex]);

  return {
    activeGalleryMedia,
    closeMediaGallery,
    galleryDirection,
    galleryIndex,
    galleryMedia,
    galleryPost,
    goToGalleryMedia,
    handleGalleryTouchEnd,
    handleGalleryTouchMove,
    handleGalleryTouchStart,
    setGalleryIndex,
    setGalleryPost,
  };
}

export default useFeedGallery;
