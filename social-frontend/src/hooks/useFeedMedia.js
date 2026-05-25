import { useEffect, useRef, useState } from "react";
import logger from "../utils/logger";

function useFeedMedia({ mediaFilterOptions, setComposerType }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editedPreview, setEditedPreview] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [mediaInputMode, setMediaInputMode] = useState("add");
  const [mediaEditModalOpen, setMediaEditModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [mediaFilter, setMediaFilter] = useState("Original");
  const [mediaAspect, setMediaAspect] = useState("Original");
  const [mediaZoom, setMediaZoom] = useState(1);
  const [mediaStudioOpen, setMediaStudioOpen] = useState(false);
  const [mediaEditTab, setMediaEditTab] = useState("Crop");
  const [mediaUploadStage, setMediaUploadStage] = useState("");
  const mediaInputRef = useRef(null);

const getSelectedFilter = (filterValue = mediaFilter) => {
  return mediaFilterOptions.find((item) => item.value === filterValue) || mediaFilterOptions[0];
};

const getAspectRatioValue = (aspectValue = mediaAspect) => {
  if (aspectValue === "Square") return 1;
  if (aspectValue === "Portrait") return 4 / 5;
  if (aspectValue === "Wide") return 16 / 9;
  return null;
};

const activeMedia = mediaItems[activeMediaIndex] || null;
const hasSelectedMedia = mediaItems.length > 0;
const activePreviewSrc = activeMedia?.editedPreview || activeMedia?.preview || editedPreview || preview;
const isSelectedImage = activeMedia?.type === "image" || selectedFile?.type?.startsWith("image");
const isSelectedVideo = activeMedia?.type === "video" || selectedFile?.type?.startsWith("video");

const getPreviewFrameClass = (aspectValue = mediaAspect) => {
  if (aspectValue === "Square") return "aspect-square max-h-[390px]";
  if (aspectValue === "Portrait") return "aspect-[4/5] max-h-[470px]";
  if (aspectValue === "Wide") return "aspect-video max-h-[310px]";
  return "h-[270px] sm:h-[340px]";
};

const hasMediaEdits = (item = activeMedia) => {
  return Boolean(
    item?.type === "image" &&
      (item.aspect !== "Original" || item.filter !== "Original" || item.zoom !== 1)
  );
};

const resetMediaEditor = () => {
  setMediaFilter("Original");
  setMediaAspect("Original");
  setMediaZoom(1);
  setMediaStudioOpen(false);
  setMediaEditTab("Crop");
  setMediaUploadStage("");
  setUploadError("");
};

const syncActiveMediaState = (item, index) => {
  if (!item) {
    setSelectedFile(null);
    setPreview("");
    setEditedPreview("");
    resetMediaEditor();
    return;
  }

  setActiveMediaIndex(index);
  setSelectedFile(item.file);
  setPreview(item.preview || "");
  setEditedPreview(item.editedPreview || "");
  setMediaFilter(item.filter || "Original");
  setMediaAspect(item.aspect || "Original");
  setMediaZoom(item.zoom || 1);
  setComposerType(item.type === "video" ? "Clip" : "Moment");
};

const selectMediaItem = (index) => {
  const item = mediaItems[index];
  if (!item) return;
  syncActiveMediaState(item, index);
  setMediaStudioOpen(false);
  setMediaEditModalOpen(false);
};

const revokeMediaItemUrls = (item) => {
  if (item?.preview) URL.revokeObjectURL(item.preview);
  if (item?.editedPreview) URL.revokeObjectURL(item.editedPreview);
};

const removeMediaItem = (index = activeMediaIndex) => {
  setMediaItems((prev) => {
    const removed = prev[index];
    if (removed) revokeMediaItemUrls(removed);

    const next = prev.filter((_, itemIndex) => itemIndex !== index);
    const nextIndex = Math.max(0, Math.min(index, next.length - 1));

    setTimeout(() => {
      if (next.length > 0) {
        syncActiveMediaState(next[nextIndex], nextIndex);
      } else {
        setActiveMediaIndex(0);
        setSelectedFile(null);
        setPreview("");
        setEditedPreview("");
        setComposerType("Thought");
        resetMediaEditor();
      }
    }, 0);

    return next;
  });

  if (mediaInputRef.current) mediaInputRef.current.value = "";
};

const removeSelectedMedia = () => removeMediaItem(activeMediaIndex);

const loadImageFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read selected image"));
    };

    image.src = url;
  });
};

const getCanvasFilter = (filterValue = mediaFilter) => {
  return getSelectedFilter(filterValue).css || "none";
};

const getProcessedImageBlob = async (item = activeMedia) => {
  if (!item?.file || item.type !== "image") return null;

  const image = await loadImageFromFile(item.file);
  const targetRatio = getAspectRatioValue(item.aspect || "Original");
  const itemZoom = item.zoom || 1;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;

  if (targetRatio) {
    const imageRatio = image.naturalWidth / image.naturalHeight;

    if (imageRatio > targetRatio) {
      sourceWidth = image.naturalHeight * targetRatio;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    } else {
      sourceHeight = image.naturalWidth / targetRatio;
      sourceY = (image.naturalHeight - sourceHeight) / 2;
    }
  }

  if (itemZoom > 1) {
    const zoomedWidth = sourceWidth / itemZoom;
    const zoomedHeight = sourceHeight / itemZoom;
    sourceX += (sourceWidth - zoomedWidth) / 2;
    sourceY += (sourceHeight - zoomedHeight) / 2;
    sourceWidth = zoomedWidth;
    sourceHeight = zoomedHeight;
  }

  const maxOutputSize = 1600;
  const outputRatio = sourceWidth / sourceHeight;
  let outputWidth = sourceWidth;
  let outputHeight = sourceHeight;

  if (outputWidth > maxOutputSize || outputHeight > maxOutputSize) {
    if (outputRatio >= 1) {
      outputWidth = maxOutputSize;
      outputHeight = maxOutputSize / outputRatio;
    } else {
      outputHeight = maxOutputSize;
      outputWidth = maxOutputSize * outputRatio;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(outputWidth);
  canvas.height = Math.round(outputHeight);

  const ctx = canvas.getContext("2d");
  ctx.filter = getCanvasFilter(item.filter || "Original");
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
};

const getProcessedImageFile = async (item = activeMedia) => {
  if (!item?.file || item.type !== "image") return item?.file;

  const blob = await getProcessedImageBlob(item);
  if (!blob) return item.file;

  const cleanName = item.file.name.replace(/\.[^/.]+$/, "");

  return new File([blob], `${cleanName}-vybeo.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
};

const patchActiveMedia = (patch) => {
  setMediaItems((prev) =>
    prev.map((item, index) =>
      index === activeMediaIndex
        ? {
            ...item,
            ...patch,
          }
        : item
    )
  );
};

useEffect(() => {
  if (!activeMedia || activeMedia.type !== "image") return;

  const patch = {
    aspect: mediaAspect,
    zoom: mediaZoom,
    filter: mediaFilter,
  };

  patchActiveMedia(patch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [mediaAspect, mediaZoom, mediaFilter]);

useEffect(() => {
  let cancelled = false;

  const buildEditedPreview = async () => {
    if (!activeMedia || activeMedia.type !== "image") {
      setEditedPreview("");
      return;
    }

    try {
      const workingItem = {
        ...activeMedia,
        aspect: mediaAspect,
        zoom: mediaZoom,
        filter: mediaFilter,
      };

      const blob = await getProcessedImageBlob(workingItem);
      if (!blob || cancelled) return;

      const nextUrl = URL.createObjectURL(blob);

      setMediaItems((prev) =>
        prev.map((item, index) => {
          if (index !== activeMediaIndex) return item;
          if (item.editedPreview) URL.revokeObjectURL(item.editedPreview);
          return {
            ...item,
            editedPreview: nextUrl,
            aspect: mediaAspect,
            zoom: mediaZoom,
            filter: mediaFilter,
          };
        })
      );

      setEditedPreview(nextUrl);
    } catch (error) {
      logger.error("Preview render failed:", error);
    }
  };

  buildEditedPreview();

  return () => {
    cancelled = true;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeMediaIndex, mediaAspect, mediaZoom, mediaFilter, activeMedia?.preview]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => file.type.startsWith("image") || file.type.startsWith("video"));

    if (validFiles.length !== files.length) {
      setUploadError("Please select only image or video files.");
      return;
    }

    const oversizedFile = validFiles.find((file) => file.size > 60 * 1024 * 1024);
    if (oversizedFile) {
      setUploadError("Media is too large. Please choose files under 60MB.");
      return;
    }

    const nextItems = validFiles.map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      editedPreview: "",
      type: file.type.startsWith("video") ? "video" : "image",
      filter: "Original",
      aspect: "Original",
      zoom: 1,
    }));

    setUploadError("");
    setMediaEditModalOpen(false);
    setMediaStudioOpen(false);

    if (mediaInputMode === "replace" && nextItems[0]) {
      setMediaItems((prev) => {
        const oldItem = prev[activeMediaIndex];
        if (oldItem) revokeMediaItemUrls(oldItem);

        const updated = [...prev];
        updated[activeMediaIndex] = nextItems[0];
        return updated;
      });

      syncActiveMediaState(nextItems[0], activeMediaIndex);

      nextItems.slice(1).forEach((item) => {
        URL.revokeObjectURL(item.preview);
      });
    } else {
      setMediaItems((prev) => {
        const startIndex = prev.length;
        const updated = [...prev, ...nextItems];

        setTimeout(() => {
          const targetIndex = startIndex;
          if (updated[targetIndex]) {
            syncActiveMediaState(updated[targetIndex], targetIndex);
          }
        }, 0);

        return updated;
      });
    }

    const hasVideo = nextItems.some((item) => item.type === "video");
    setComposerType(hasVideo ? "Clip" : "Moment");
    setMediaInputMode("add");

    if (mediaInputRef.current) {
      mediaInputRef.current.value = "";
    }
  };


  useEffect(() => {
    return () => {
      mediaItems.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
        if (item.editedPreview) URL.revokeObjectURL(item.editedPreview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    selectedFile,
    setSelectedFile,
    preview,
    setPreview,
    editedPreview,
    setEditedPreview,
    mediaItems,
    setMediaItems,
    activeMediaIndex,
    setActiveMediaIndex,
    mediaInputMode,
    setMediaInputMode,
    mediaEditModalOpen,
    setMediaEditModalOpen,
    uploadError,
    setUploadError,
    mediaFilter,
    setMediaFilter,
    mediaAspect,
    setMediaAspect,
    mediaZoom,
    setMediaZoom,
    mediaStudioOpen,
    setMediaStudioOpen,
    mediaEditTab,
    setMediaEditTab,
    mediaUploadStage,
    setMediaUploadStage,
    mediaInputRef,
    activeMedia,
    hasSelectedMedia,
    activePreviewSrc,
    isSelectedImage,
    isSelectedVideo,
    getPreviewFrameClass,
    hasMediaEdits,
    resetMediaEditor,
    syncActiveMediaState,
    selectMediaItem,
    revokeMediaItemUrls,
    removeMediaItem,
    removeSelectedMedia,
    getProcessedImageFile,
    handleFileChange,
  };
}

export default useFeedMedia;