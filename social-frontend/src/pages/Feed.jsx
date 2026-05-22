import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

function Feed() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editedPreview, setEditedPreview] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [mediaInputMode, setMediaInputMode] = useState("add");
  const [mediaEditModalOpen, setMediaEditModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [mediaFilter, setMediaFilter] = useState("Original");
  const [mediaAspect, setMediaAspect] = useState("Original");
  const [mediaZoom, setMediaZoom] = useState(1);
  const [mediaStudioOpen, setMediaStudioOpen] = useState(false);
  const [mediaEditTab, setMediaEditTab] = useState("Crop");
  const [mediaUploadStage, setMediaUploadStage] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);

  const [commentText, setCommentText] = useState({});
  const [replyText, setReplyText] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [replyingTo, setReplyingTo] = useState({});

  const [editingPostId, setEditingPostId] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const [composerType, setComposerType] = useState("Thought");
  const [selectedMood, setSelectedMood] = useState("All");
  const [moodPickerOpen, setMoodPickerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const socketUrl =
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

  const [heartPostId, setHeartPostId] = useState(null);
  const [heartCommentId, setHeartCommentId] = useState(null);

  const [savedPosts, setSavedPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("savedPosts") || "[]");
    } catch {
      return [];
    }
  });

  const [sharePost, setSharePost] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [galleryPost, setGalleryPost] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryDirection, setGalleryDirection] = useState("");
  const [loadedMedia, setLoadedMedia] = useState({});
  const [feedMediaIndexes, setFeedMediaIndexes] = useState({});
  const feedMediaTouchStartX = useRef(null);
  const feedMediaTouchEndX = useRef(null);
  const [commentsSheetPost, setCommentsSheetPost] = useState(null);
  const [confirmDeletePost, setConfirmDeletePost] = useState(null);

  const [likesModalPost, setLikesModalPost] = useState(null);
  const [followingUsers, setFollowingUsers] = useState({});
  const [activeMood, setActiveMood] = useState("All");
  const [activeFlowTab, setActiveFlowTab] = useState("For You");
  const moodPickerRef = useRef(null);
  const captionRef = useRef(null);
  const loadMoreRef = useRef(null);
  const feedSocketRef = useRef(null);
  const mediaInputRef = useRef(null);
  const galleryTouchStartX = useRef(null);
  const galleryTouchStartY = useRef(null);
  const galleryTouchEndX = useRef(null);

  const moodChips = ["All", "Deep", "Funny", "Chaos", "Late Night", "Creative", "College"];
  const flowTabs = ["For You", "Tuned In", "Close Circle"];

  const mediaAspectOptions = [
    { label: "Original", value: "Original", hint: "Keep natural frame" },
    { label: "Square", value: "Square", hint: "1:1 clean post" },
    { label: "Portrait", value: "Portrait", hint: "4:5 feed style" },
    { label: "Wide", value: "Wide", hint: "16:9 landscape" },
  ];

  const mediaFilterOptions = [
    { label: "Original", value: "Original", className: "", css: "none" },
    { label: "Soft", value: "Soft", className: "brightness-105 contrast-95 saturate-110", css: "brightness(1.05) contrast(0.95) saturate(1.1)" },
    { label: "Vivid", value: "Vivid", className: "brightness-105 contrast-110 saturate-150", css: "brightness(1.05) contrast(1.1) saturate(1.5)" },
    { label: "Mono", value: "Mono", className: "grayscale contrast-110", css: "grayscale(1) contrast(1.1)" },
    { label: "Warm", value: "Warm", className: "sepia-[.22] saturate-125 brightness-105", css: "sepia(0.22) saturate(1.25) brightness(1.05)" },
  ];
  const moodMeta = {
  All: {
    icon: "✨",
    placeholder: "What’s your vybe right now?",
    style: "from-zinc-500/20 to-zinc-700/20",
    keywords: [],
  },
  Deep: {
    icon: "🌊",
    placeholder: "What’s been sitting in your mind lately?",
    style: "from-indigo-500/25 to-purple-500/20",
    keywords: ["deep", "sad", "alone", "lonely", "overthink", "thinking", "lost", "empty", "2am", "miss", "heart"],
  },
  Funny: {
    icon: "😂",
    placeholder: "Drop the most unserious thing today.",
    style: "from-yellow-500/25 to-orange-500/20",
    keywords: ["funny", "meme", "lol", "lmao", "haha", "joke", "bro"],
  },
  Chaos: {
    icon: "⚡",
    placeholder: "What just happened?",
    style: "from-pink-500/25 to-red-500/20",
    keywords: ["chaos", "wild", "crazy", "wtf", "panic", "mess", "drama", "random"],
  },
  "Late Night": {
    icon: "🌙",
    placeholder: "Late night thoughts hit different...",
    style: "from-blue-500/25 to-indigo-500/20",
    keywords: ["night", "2am", "3am", "midnight", "sleep", "awake", "moon", "late night"],
  },
  Creative: {
    icon: "🎨",
    placeholder: "Share something you created or imagined.",
    style: "from-cyan-500/25 to-purple-500/20",
    keywords: ["art", "design", "creative", "music", "drawing", "edit", "idea", "project"],
  },
  College: {
    icon: "🎓",
    placeholder: "What’s happening around campus?",
    style: "from-emerald-500/25 to-cyan-500/20",
    keywords: ["college", "hostel", "campus", "assignment", "exam", "class", "semester", "attendance", "canteen"],
  },
};

  const authConfig = {
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  const showNotice = (message) => {
  setActionNotice(message);

  setTimeout(() => {
    setActionNotice("");
  }, 3000);
};

  const PostSkeleton = () => (
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

 const fetchPosts = async (page = 1) => {
  try {
    if (page === 1) {
      setInitialLoading(true);
    } else {
      setLoadingMoreFeed(true);
    }

   const res = await API.get(`/api/posts?page=${page}&limit=6`);

const nextPosts = Array.isArray(res.data)
  ? res.data
  : Array.isArray(res.data.posts)
  ? res.data.posts
  : [];

    setPosts((prev) => {
      if (page === 1) return nextPosts;

      const existingIds = new Set(prev.map((post) => post._id));
      const uniquePosts = nextPosts.filter((post) => !existingIds.has(post._id));

      return [...prev, ...uniquePosts];
    });

    setFeedPage(page);
    setHasMoreFeed(
  Array.isArray(res.data) ? nextPosts.length === 6 : Boolean(res.data?.hasMore)
);
  } catch (error) {
    console.log(error.response?.data || error);
  } finally {
    setInitialLoading(false);
    setLoadingMoreFeed(false);
  }
};


useEffect(() => {
  fetchPosts();

  const loadCurrentUser = async () => {
    try {
      if (!currentUserId) return;

      const res = await API.get(`/api/users/${currentUserId}`);
      setCurrentUser(res.data);
    } catch (error) {
      console.log(error.response?.data || error);

      const localUser = localStorage.getItem("user");
      if (localUser) {
        try {
          setCurrentUser(JSON.parse(localUser));
        } catch {
          setCurrentUser(null);
        }
      }
    }
  };

  loadCurrentUser();
}, [currentUserId]);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      moodPickerRef.current &&
      !moodPickerRef.current.contains(event.target)
    ) {
      setMoodPickerOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

useEffect(() => {
  if (!captionRef.current) return;

  captionRef.current.style.height = "58px";
  captionRef.current.style.height = `${Math.min(captionRef.current.scrollHeight, 180)}px`;
}, [caption, composerType]);

useEffect(() => {
  return () => {
    mediaItems.forEach((item) => {
      if (item.preview) URL.revokeObjectURL(item.preview);
      if (item.editedPreview) URL.revokeObjectURL(item.editedPreview);
    });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const updatePostInState = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const updatePostEverywhere = (updatedPost) => {
  updatePostInState(updatedPost);

  setCommentsSheetPost((current) =>
    current?._id === updatedPost._id ? updatedPost : current
  );

  setLikesModalPost((current) =>
    current?._id === updatedPost._id ? updatedPost : current
  );

  setGalleryPost((current) =>
    current?._id === updatedPost._id ? updatedPost : current
  );
};

  useEffect(() => {
  if (!token) return;

  const socket = io(socketUrl, {
    transports: ["websocket", "polling"],
    auth: {
      token,
    },
  });

  feedSocketRef.current = socket;

  socket.on("connect", () => {
    socket.emit("register-user");
  });

  socket.on("post-created", (newPost) => {
    setPosts((prevPosts) => {
      const alreadyExists = prevPosts.some((post) => post._id === newPost._id);
      if (alreadyExists) return prevPosts;

      return [newPost, ...prevPosts];
    });
  });

  socket.on("post-updated", (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );

    setCommentsSheetPost((current) =>
      current?._id === updatedPost._id ? updatedPost : current
    );

    setLikesModalPost((current) =>
      current?._id === updatedPost._id ? updatedPost : current
    );

    setGalleryPost((current) =>
      current?._id === updatedPost._id ? updatedPost : current
    );
  });

  socket.on("post-deleted", ({ postId }) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));

    setCommentsSheetPost((current) =>
      current?._id === postId ? null : current
    );

    setLikesModalPost((current) =>
      current?._id === postId ? null : current
    );

    setGalleryPost((current) =>
      current?._id === postId ? null : current
    );
  });

  return () => {
    socket.off("post-created");
    socket.off("post-updated");
    socket.off("post-deleted");
    socket.disconnect();
  };
}, [token, socketUrl]);

  const openUserProfile = (userId) => {
    if (!userId) return;
    navigate(userId === currentUserId ? "/profile" : `/profile/${userId}`);
  };

  const getPostShareUrl = (postId) => {
    return `${window.location.origin}/post/${postId}`;
  };

  const copyShareLink = async () => {
    if (!sharePost?._id) return;

    try {
      await navigator.clipboard.writeText(getPostShareUrl(sharePost._id));
      setCopiedShare(true);

      setTimeout(() => {
        setCopiedShare(false);
      }, 1500);
    } catch (error) {
      console.log("Copy failed:", error);
    }
  };

  const nativeSharePost = async () => {
    if (!sharePost?._id) return;

    const shareData = {
      title: "Check this post on Vybeo",
      text: sharePost.caption || sharePost.content || "Vybeo vybe",
      url: getPostShareUrl(sharePost._id),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyShareLink();
      }
    } catch (error) {
      console.log("Share cancelled or failed:", error);
    }
  };

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

  const toggleSavePost = (postId) => {
    setSavedPosts((prev) => {
      const updated = prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId];

      localStorage.setItem("savedPosts", JSON.stringify(updated));
      return updated;
    });
  };

  const isPostLikedByMe = (post) => {
    return post.likes?.some((like) => {
      if (typeof like === "string") return like === currentUserId;
      return like?._id === currentUserId;
    });
  };

  const isFollowingUser = (user) => {
    if (!user?._id) return false;

    if (followingUsers[user._id] !== undefined) {
      return followingUsers[user._id];
    }

    return user.followers?.some((follower) => {
      if (typeof follower === "string") return follower === currentUserId;
      return follower?._id === currentUserId;
    });
  };

  const toggleFollowUser = async (user) => {
    if (!user?._id || user._id.startsWith("demo")) {
      setFollowingUsers((prev) => ({
        ...prev,
        [user?._id || "demo"]: !prev[user?._id || "demo"],
      }));
      return;
    }

    try {
      const res = await API.put(`/api/users/follow/${user._id}`, {}, authConfig);

      setFollowingUsers((prev) => ({
        ...prev,
        [user._id]: res.data?.following ?? !prev[user._id],
      }));
    } catch (error) {
      console.log(error.response?.data || error);

      setFollowingUsers((prev) => ({
        ...prev,
        [user._id]: !prev[user._id],
      }));
    }
  };

  const getMediaUrl = (item) => {
    return item?.url || item?.secure_url || item?.mediaUrl || item?.src || "";
  };

  const markMediaLoaded = (item) => {
    const url = getMediaUrl(item);
    if (!url) return;
    setLoadedMedia((prev) => ({ ...prev, [url]: true }));
  };

  const getFeedMediaIndex = (post) => {
    const mediaLength = post?.media?.length || 0;
    if (mediaLength <= 0) return 0;
    const savedIndex = feedMediaIndexes[post._id] || 0;
    return Math.min(Math.max(savedIndex, 0), mediaLength - 1);
  };

  const slideFeedMedia = (postId, mediaLength, direction) => {
    if (!postId || mediaLength <= 1) return;

    setFeedMediaIndexes((prev) => {
      const currentIndex = prev[postId] || 0;
      const nextIndex =
        direction === "next"
          ? (currentIndex + 1) % mediaLength
          : (currentIndex - 1 + mediaLength) % mediaLength;

      return { ...prev, [postId]: nextIndex };
    });
  };

  const handleFeedMediaTouchStart = (event) => {
    feedMediaTouchStartX.current = event.touches[0].clientX;
    feedMediaTouchEndX.current = event.touches[0].clientX;
  };

  const handleFeedMediaTouchMove = (event) => {
    feedMediaTouchEndX.current = event.touches[0].clientX;
  };

  const handleFeedMediaTouchEnd = (postId, mediaLength) => {
    if (mediaLength <= 1) return;
    if (feedMediaTouchStartX.current === null || feedMediaTouchEndX.current === null) return;

    const swipeDistance = feedMediaTouchStartX.current - feedMediaTouchEndX.current;

    if (Math.abs(swipeDistance) > 45) {
      slideFeedMedia(postId, mediaLength, swipeDistance > 0 ? "next" : "prev");
    }

    feedMediaTouchStartX.current = null;
    feedMediaTouchEndX.current = null;
  };

  const isImageMedia = (item) => {
    const type = (item?.type || item?.resource_type || "").toLowerCase();
    const url = getMediaUrl(item).toLowerCase();

    return (
      type.includes("image") ||
      url.endsWith(".jpg") ||
      url.endsWith(".jpeg") ||
      url.endsWith(".png") ||
      url.endsWith(".webp") ||
      url.endsWith(".gif")
    );
  };

  const getPostKind = (post) => {
  const hasMedia = post.media && post.media.length > 0;

  if (!hasMedia) return "Thought";

  const hasVideo = post.media.some((item) => {
    const type = (item?.type || item?.resource_type || "").toLowerCase();
    const url = getMediaUrl(item).toLowerCase();

    return (
      type.includes("video") ||
      url.endsWith(".mp4") ||
      url.endsWith(".mov") ||
      url.endsWith(".webm")
    );
  });

  if (hasVideo) return "Clip";
  return "Moment";
};


const getHeartAnimationSize = (postKind) => {
  if (postKind === "Thought") {
    return "text-[54px] sm:text-[68px]";
  }

  if (postKind === "Moment") {
    return "text-[88px] sm:text-[115px]";
  }

  return "text-[78px] sm:text-[100px]";
};

const formatVybeTime = (date) => {
  if (!date) return "";

  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
};


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
      console.log("Preview render failed:", error);
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

  const createPost = async () => {
    try {
      if (!caption.trim() && mediaItems.length === 0) return;

      setLoading(true);
      setUploadError("");

      let media = [];

      if (mediaItems.length > 0) {
        for (let index = 0; index < mediaItems.length; index += 1) {
          const item = mediaItems[index];
          setMediaUploadStage(
            item.type === "image"
              ? `Preparing image ${index + 1}/${mediaItems.length}...`
              : `Preparing clip ${index + 1}/${mediaItems.length}...`
          );

          const fileToUpload = item.type === "image" ? await getProcessedImageFile(item) : item.file;

          setMediaUploadStage(`Uploading ${index + 1}/${mediaItems.length}...`);

          const formData = new FormData();
          formData.append("file", fileToUpload);

          const uploadRes = await API.post("/api/upload", formData, {
            headers: {
              Authorization: "Bearer " + token,
              "Content-Type": "multipart/form-data",
            },
          });

          media.push(uploadRes.data);
        }
      }

      setMediaUploadStage("Dropping vybe...");

      const newPost = await API.post(
        "/api/posts/create",
        {
          caption: caption.trim(),
          media,
          mood: selectedMood,
        },
        authConfig
      );

      setPosts((prevPosts) => [newPost.data, ...prevPosts]);
      setCaption("");

      mediaItems.forEach((item) => revokeMediaItemUrls(item));
      setMediaItems([]);
      setActiveMediaIndex(0);
      setSelectedFile(null);
      setPreview("");
      setEditedPreview("");
      setComposerType("Thought");
      setSelectedMood("All");
      setMoodPickerOpen(false);
      setComposerOpen(false);
      setMediaEditModalOpen(false);
      resetMediaEditor();

      if (mediaInputRef.current) {
        mediaInputRef.current.value = "";
      }
    } catch (error) {
      console.log(error.response?.data || error);
      setUploadError(error.response?.data?.message || "Could not upload your vybe. Please try again.");
    } finally {
      setLoading(false);
      setMediaUploadStage("");
    }
  };

const likePost = async (id) => {
  const userForLike =
    currentUser || {
      _id: currentUserId,
      name: "You",
      profilePic: "",
    };

  let previousPost = null;

  setPosts((prevPosts) =>
    prevPosts.map((post) => {
      if (post._id !== id) return post;

      previousPost = post;

      const alreadyLiked = post.likes?.some((like) => {
        if (typeof like === "string") return like === currentUserId;
        return like?._id === currentUserId;
      });

      const nextPost = {
        ...post,
        likes: alreadyLiked
          ? (post.likes || []).filter((like) => {
              if (typeof like === "string") return like !== currentUserId;
              return like?._id !== currentUserId;
            })
          : [...(post.likes || []), userForLike],
      };

      setLikesModalPost((current) =>
        current?._id === id ? nextPost : current
      );

      return nextPost;
    })
  );

  try {
    const res = await API.put(`/api/posts/like/${id}`, {}, authConfig);
    updatePostEverywhere(res.data);
  } catch (error) {
    console.log(error.response?.data || error);

    if (previousPost) {
      updatePostEverywhere(previousPost);
    }

    showNotice(error.response?.data?.message || "Could not update like");
  }
};

  const handlePostLikeWithAnimation = (postId) => {
    likePost(postId);
    setHeartPostId(postId);

    setTimeout(() => {
      setHeartPostId(null);
    }, 900);
  };

const addComment = async (postId) => {
  const text = commentText[postId];

  if (!text || !text.trim()) return;

  const tempComment = {
    _id: `temp-comment-${Date.now()}`,
    text: text.trim(),
    user:
      currentUser || {
        _id: currentUserId,
        name: "You",
        profilePic: "",
      },
    likes: [],
    replies: [],
    createdAt: new Date().toISOString(),
    isTemp: true,
  };

  let previousPost = null;

  setPosts((prevPosts) =>
    prevPosts.map((post) => {
      if (post._id !== postId) return post;

      previousPost = post;

      const nextPost = {
        ...post,
        comments: [...(post.comments || []), tempComment],
      };

      setCommentsSheetPost((current) =>
        current?._id === postId ? nextPost : current
      );

      return nextPost;
    })
  );

  setCommentText((prev) => ({
    ...prev,
    [postId]: "",
  }));

  setOpenComments((prev) => ({
    ...prev,
    [postId]: true,
  }));

  try {
    const res = await API.post(
      `/api/posts/comment/${postId}`,
      {
        text: text.trim(),
      },
      authConfig
    );

    updatePostEverywhere(res.data);
  } catch (error) {
    console.log(error.response?.data || error);

    if (previousPost) {
      updatePostEverywhere(previousPost);
    }

    setCommentText((prev) => ({
      ...prev,
      [postId]: text,
    }));

    showNotice(error.response?.data?.message || "Could not add comment");
  }
};

  const deleteComment = async (postId, commentId) => {
    try {
      const res = await API.delete(
        `/api/posts/comment/${postId}/${commentId}`,
        authConfig
      );

      updatePostInState(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

const likeComment = async (postId, commentId) => {
  const userForLike =
    currentUser || {
      _id: currentUserId,
      name: "You",
      profilePic: "",
    };

  let previousPost = null;

  setPosts((prevPosts) =>
    prevPosts.map((post) => {
      if (post._id !== postId) return post;

      previousPost = post;

      const nextPost = {
        ...post,
        comments: (post.comments || []).map((comment) => {
          if (comment._id !== commentId) return comment;

          const alreadyLiked = comment.likes?.some((like) => {
            if (typeof like === "string") return like === currentUserId;
            return like?._id === currentUserId;
          });

          return {
            ...comment,
            likes: alreadyLiked
              ? (comment.likes || []).filter((like) => {
                  if (typeof like === "string") return like !== currentUserId;
                  return like?._id !== currentUserId;
                })
              : [...(comment.likes || []), userForLike],
          };
        }),
      };

      setCommentsSheetPost((current) =>
        current?._id === postId ? nextPost : current
      );

      return nextPost;
    })
  );

  try {
    const res = await API.put(
      `/api/posts/comment/like/${postId}/${commentId}`,
      {},
      authConfig
    );

    updatePostEverywhere(res.data);
  } catch (error) {
    console.log(error.response?.data || error);

    if (previousPost) {
      updatePostEverywhere(previousPost);
    }

    showNotice(error.response?.data?.message || "Could not update comment like");
  }
};

  const handleCommentLikeWithAnimation = (postId, commentId) => {
    likeComment(postId, commentId);
    setHeartCommentId(commentId);

    setTimeout(() => {
      setHeartCommentId(null);
    }, 800);
  };

const addReply = async (postId, commentId) => {
  const key = `${postId}-${commentId}`;
  const text = replyText[key];

  if (!text || !text.trim()) return;

  const tempReply = {
    _id: `temp-reply-${Date.now()}`,
    text: text.trim(),
    user:
      currentUser || {
        _id: currentUserId,
        name: "You",
        profilePic: "",
      },
    likes: [],
    createdAt: new Date().toISOString(),
    isTemp: true,
  };

  let previousPost = null;

  setPosts((prevPosts) =>
    prevPosts.map((post) => {
      if (post._id !== postId) return post;

      previousPost = post;

      const nextPost = {
        ...post,
        comments: (post.comments || []).map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), tempReply],
              }
            : comment
        ),
      };

      setCommentsSheetPost((current) =>
        current?._id === postId ? nextPost : current
      );

      return nextPost;
    })
  );

  setReplyText((prev) => ({
    ...prev,
    [key]: "",
  }));

  setReplyingTo((prev) => ({
    ...prev,
    [key]: false,
  }));

  try {
    const res = await API.post(
      `/api/posts/comment/reply/${postId}/${commentId}`,
      {
        text: text.trim(),
      },
      authConfig
    );

    updatePostEverywhere(res.data);
  } catch (error) {
    console.log(error.response?.data || error);

    if (previousPost) {
      updatePostEverywhere(previousPost);
    }

    setReplyText((prev) => ({
      ...prev,
      [key]: text,
    }));

    showNotice(error.response?.data?.message || "Could not add reply");
  }
};

  const deleteReply = async (postId, commentId, replyId) => {
    try {
      const res = await API.delete(
        `/api/posts/comment/reply/${postId}/${commentId}/${replyId}`,
        authConfig
      );

      updatePostInState(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const startEditPost = (post) => {
    setEditingPostId(post._id);
    setEditCaption(post.caption || post.content || "");
    setOpenMenuId(null);
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditCaption("");
  };

  const saveEditPost = async (postId) => {
    try {
      const res = await API.put(
        `/api/posts/${postId}`,
        {
          caption: editCaption.trim(),
        },
        authConfig
      );

      updatePostInState(res.data);
      setEditingPostId(null);
      setEditCaption("");
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const deletePost = async (postId) => {
    try {
      if (!postId) return;

      await API.delete(`/api/posts/${postId}`, authConfig);

      setPosts((prevPosts) =>
        prevPosts.filter((post) => post._id !== postId)
      );

      setOpenMenuId(null);
      setConfirmDeletePost(null);
      showNotice("Vybe deleted");
    } catch (error) {
      console.log(error.response?.data || error);
      showNotice(error.response?.data?.message || "Could not delete vybe");
    }
  };

  const requestDeletePost = (post) => {
    setOpenMenuId(null);
    setConfirmDeletePost(post);
  };

  const HeartIcon = ({ filled = true }) => (
    <svg
      viewBox="0 0 24 24"
      className="w-[20px] h-[20px]"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  const CommentIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-[20px] h-[20px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );

  const ShareIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-[20px] h-[20px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );

  const BookmarkIcon = ({ saved }) => (
    <svg
      viewBox="0 0 24 24"
      className="w-[20px] h-[20px]"
      fill={saved ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );

  const safePosts = useMemo(() => (Array.isArray(posts) ? posts : []), [posts]);
  const fallbackUsers = useMemo(
    () =>
      [
        { _id: "demo1", name: "Aman Dev", profilePic: "", bio: "Frontend lover" },
        { _id: "demo2", name: "Rahul Vibes", profilePic: "", bio: "MERN developer" },
        { _id: "demo3", name: "Sneha UI", profilePic: "", bio: "UI designer" },
        { _id: "demo4", name: "Karan Reels", profilePic: "", bio: "Video creator" },
        { _id: "demo5", name: "Priya Codes", profilePic: "", bio: "Full stack dev" },
      ].sort(() => Math.random() - 0.5),
    []
  );

  const suggestedUsers = useMemo(() => {
    const users = safePosts
      .map((post) => post.user)
      .filter(Boolean)
      .filter((user) => user._id !== currentUserId)
      .filter((user, index, arr) => {
        return arr.findIndex((item) => item?._id === user?._id) === index;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    return users.length > 0 ? users : fallbackUsers.slice(0, 5);
  }, [safePosts, currentUserId, fallbackUsers]);

const hasVideoMedia = (post) => {
  return post.media?.some((item) => {
    const type = (item?.type || item?.resource_type || "").toLowerCase();
    const url = getMediaUrl(item).toLowerCase();

    return (
      type.includes("video") ||
      url.endsWith(".mp4") ||
      url.endsWith(".mov") ||
      url.endsWith(".webm")
    );
  });
};

const flowPosts = safePosts.filter((post) => {
  if (hasVideoMedia(post)) return false;

  if (activeMood !== "All") {
    const directMoodMatch = post.mood === activeMood;

    const content = `${post.caption || ""} ${post.content || ""}`.toLowerCase();
    const keywords = moodMeta[activeMood]?.keywords || [];
    const keywordMatch = keywords.some((word) => content.includes(word));

    if (!directMoodMatch && !keywordMatch) return false;
  }

  if (activeFlowTab === "Tuned In") {
    return currentUser?.following?.some((f) => {
      const id = typeof f === "string" ? f : f?._id;
      return id === post.user?._id;
    });
  }

  if (activeFlowTab === "Close Circle") {
    return currentUser?.closeCircle?.some((f) => {
      const id = typeof f === "string" ? f : f?._id;
      return id === post.user?._id;
    });
  }

  return true;
});

const displayedPosts = flowPosts;
// const hasMorePosts = hasMoreFeed;

useEffect(() => {
  if (!loadMoreRef.current || !hasMoreFeed || initialLoading || loadingMoreFeed) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        fetchPosts(feedPage + 1);
      }
    },
    { root: null, rootMargin: "260px", threshold: 0.1 }
  );

  observer.observe(loadMoreRef.current);

  return () => observer.disconnect();
}, [hasMoreFeed, initialLoading, loadingMoreFeed, feedPage]);



const galleryMedia = galleryPost?.media || [];
const activeGalleryMedia = galleryMedia[galleryIndex] || null;
const activeCommentsPost = commentsSheetPost
  ? safePosts.find((post) => post._id === commentsSheetPost._id) || commentsSheetPost
  : null;

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

  const trendingTags = useMemo(
  () =>
    ["#DeepVybes", "#LateNight", "#Chaos", "#CollegeLife", "#RealThoughts", "#Creative"]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4),
  []
);
  return (
    <div className="min-h-screen bg-black text-white px-2.5 sm:px-4 md:px-6 pt-0 sm:pt-3 md:pt-7 pb-28 md:pb-10">
      {actionNotice && (
  <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm">
    <div className="rounded-2xl border border-pink-400/25 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl shadow-pink-500/20 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" />

      <div className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-pink-500/15 flex items-center justify-center shrink-0">
          ⚠️
        </div>

        <div className="flex-1">
          <p className="text-sm font-black text-white">Notice</p>
          <p className="text-sm text-gray-300 mt-1">{actionNotice}</p>
        </div>

        <button
          type="button"
          onClick={() => setActionNotice("")}
          className="text-gray-500 hover:text-white transition"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
)}
      <div className="w-full max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,590px)_300px] xl:grid-cols-[minmax(0,600px)_320px] gap-8 xl:gap-10 justify-center items-start">
        <div className="w-full max-w-[600px] mx-auto lg:mx-0">
          {/* VYBE FLOW HEADER */}
          <div className="mb-2.5 sm:mb-6">
            <div className="flex items-end justify-between gap-3 mb-2 sm:mb-3">
              <div>
                <p className="text-[11px] tracking-[0.24em] text-pink-300 font-black mb-1">
                  VYBEO
                </p>

                <h1 className="text-[24px] sm:text-[34px] font-black tracking-tight">
                  Vybe Flow
                </h1>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-200 text-[10px] sm:text-[11px] font-black tracking-wide">
                    REAL THOUGHTS
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/vybe-drops")}
                className="hidden sm:inline-flex px-4 py-2 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-semibold text-pink-200 hover:bg-pink-500/10 transition-all"
              >
                Daily Drop
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {moodChips.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setActiveMood(mood)}
                  className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border text-[13px] sm:text-sm font-semibold transition-all ${
                    activeMood === mood
                      ? `bg-gradient-to-r ${moodMeta[mood]?.style} border-white/20 text-white shadow-lg shadow-pink-500/10`
                      : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.07]"
                  }`}
                >
                  <span className="mr-1">{moodMeta[mood]?.icon}</span>
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* CREATE POST */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createPost();
            }}
            className={`relative overflow-visible bg-zinc-950/90 border border-white/10 rounded-[22px] sm:rounded-[28px] p-2.5 sm:p-4 mb-3.5 sm:mb-6 shadow-xl shadow-black/30 w-full transition-all duration-300 ${
              selectedMood !== "All" ? "shadow-pink-500/10" : ""
            }`}
          >
            {!composerOpen && !hasSelectedMedia && !caption.trim() && (
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.035] px-3 py-2.5 text-left transition hover:border-pink-400/25 hover:bg-white/[0.055] active:scale-[0.99]"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-pink-500 via-purple-500 to-cyan-400 opacity-75" />
                <img
                  src={
                    currentUser?.profilePic ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      currentUser?.name || "User"
                    )}&background=8b5cf6&color=fff`
                  }
                  alt=""
                  className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-2xl border border-white/10 object-cover shadow-lg shadow-purple-500/10"
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
  <img
    src={
      currentUser?.profilePic ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        currentUser?.name || "User"
      )}&background=8b5cf6&color=fff`
    }
    alt=""
    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border border-white/10 shrink-0"
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
          createPost();
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

            {(hasSelectedMedia || uploadError) && (
              <div className="mb-4 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-cyan-500/[0.04] p-3 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.22em] text-pink-300 font-black">
                      MEDIA PREVIEW
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {mediaItems.length > 1 ? "Preview your moments. Tap thumbnails to edit each." : "Preview your moment before dropping."}
                    </p>
                  </div>

                  {hasSelectedMedia && (
                    <span className="shrink-0 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] text-[11px] font-bold text-gray-300">
                      {mediaItems.length > 1 ? `🧱 ${mediaItems.length} Moments` : isSelectedVideo ? "🎬 Clip" : hasMediaEdits() ? "✨ Edited" : "📸 Moment"}
                    </span>
                  )}
                </div>

                {uploadError && (
                  <div className="mb-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {uploadError}
                  </div>
                )}

                {activeMedia && (
                  <div className="space-y-3">
                    <div
                      className={`group relative rounded-[28px] overflow-hidden border border-pink-400/15 bg-[#050508] ${getPreviewFrameClass()} shadow-[0_0_45px_rgba(236,72,153,0.10)] transition-all duration-300`}
                    >
                      {isSelectedImage ? (
                        <>
                          <img
                            src={activePreviewSrc}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-35"
                          />

                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.13),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.58))]" />

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

                      <div className="absolute left-3 top-3 z-20 max-w-[58%]">
                        <span className="block truncate px-3 py-1.5 rounded-full bg-black/65 border border-white/10 backdrop-blur-xl text-[10px] font-black text-white shadow-lg">
                          {activeMedia?.file?.name || "Selected media"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelectedMedia();
                        }}
                        className="absolute right-3 bottom-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-500/20 px-3 py-1.5 text-[11px] font-black text-red-100 backdrop-blur-xl shadow-lg hover:bg-red-500/30 active:scale-95 transition-all"
                        title="Remove current media"
                      >
                        ✕ Remove
                      </button>

                      {mediaItems.length > 1 && (
                        <>
                          <div className="absolute right-3 top-3 z-20 rounded-full bg-black/65 border border-white/10 backdrop-blur-xl px-3 py-1.5 text-[10px] font-black text-white shadow-lg">
                            {activeMediaIndex + 1} / {mediaItems.length}
                          </div>

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
                        </>
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

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
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

                      <button
                        type="button"
                        onClick={removeSelectedMedia}
                        className="shrink-0 px-4 py-2.5 rounded-2xl border border-red-400/20 bg-red-500/15 text-xs font-black text-red-100 hover:bg-red-500/25 transition-all"
                      >
                        Remove current
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
                      <div>
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

                    {isSelectedVideo && (
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
            )}

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

          {/* FLOW TABS */}
          <div className="sticky top-[8px] md:static z-40 flex items-center gap-1.5 mb-4 sm:mb-5 bg-zinc-950/95 border border-white/10 rounded-[22px] sm:rounded-3xl p-1.5 shadow-lg shadow-black/30 backdrop-blur-2xl pointer-events-auto">
            {flowTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveFlowTab(tab);
                }}
                className={`relative flex-1 px-2.5 py-2 rounded-[15px] text-[12px] sm:text-sm font-black transition-all active:scale-[0.98] ${
                  activeFlowTab === tab
                    ? "bg-gradient-to-r from-pink-500/25 to-cyan-500/20 border border-pink-400/25 text-white shadow-lg shadow-pink-500/10"
                    : "border border-transparent text-gray-500 hover:text-white hover:bg-white/[0.045]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

        {/* POSTS */}
        <div className="space-y-4 sm:space-y-6">
          {initialLoading ? (
            <div className="space-y-4 sm:space-y-6">
              {[1, 2, 3].map((item) => (
                <PostSkeleton key={item} />
            ))}
            </div>
          ) : flowPosts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
  <div className="w-20 h-20 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-3xl mx-auto mb-5">
    {activeFlowTab === "Tuned In" ? "〰️" : activeFlowTab === "Close Circle" ? "🫶" : "✨"}
  </div>

  <h2 className="text-2xl font-black mb-2">
    {activeFlowTab === "Tuned In"
      ? "No tuned-in vybes yet"
      : activeFlowTab === "Close Circle"
      ? "Your Close Circle is quiet"
      : "No Vybes Found"}
  </h2>

  <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
    {activeFlowTab === "Tuned In"
      ? "Follow more people to build a Flow that feels like you."
      : activeFlowTab === "Close Circle"
      ? "Add people to Close Circle later and their real moments will show here."
      : "Try another mood or drop your first vybe to shape your Flow."}
  </p>

  {activeFlowTab !== "For You" && (
    <button
      type="button"
      onClick={() => setActiveFlowTab("For You")}
      className="mt-6 px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-black text-white hover:bg-white/[0.1] transition-all"
    >
      Explore For You
    </button>
  )}
</div>
          ) : (
            displayedPosts.map((post) => {
              const isPostOwner = post.user?._id === currentUserId;
              const commentsOpen = openComments[post._id];
              const isSaved = savedPosts.includes(post._id);
              const postKind = getPostKind(post);
              const mediaList = post.media || [];
              const activeFeedMediaIndex = getFeedMediaIndex(post);
              const firstMedia = mediaList[activeFeedMediaIndex] || mediaList[0];
              const mediaCount = mediaList.length;

              return (
                <div
                  key={post._id}
                  className="relative bg-zinc-950/95 border border-white/10 rounded-[22px] sm:rounded-[28px] overflow-hidden shadow-xl shadow-black/25 w-full hover:border-pink-500/20 hover:shadow-[0_0_36px_rgba(236,72,153,0.07)] transition-all duration-300 animate-vybe-card"
                >
                  {heartPostId === post._id && (
                    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                      <div
  className={`absolute rounded-full bg-pink-500/20 blur-3xl ${
    postKind === "Thought"
      ? "w-24 h-24"
      : postKind === "Moment"
      ? "w-40 h-40"
      : "w-36 h-36"
  }`}
/>
                      <div
                      className={`${getHeartAnimationSize(postKind)} animate-[heartPremium_0.9s_cubic-bezier(0.22,1,0.36,1)_forwards] drop-shadow-[0_0_24px_rgba(236,72,153,0.55)]`}
                      >
                        ❤️
                      </div>
                    </div>
                  )}

                  {/* HEADER */}
                  <div className="flex items-center justify-between p-3 sm:p-3.5 pb-2 relative">
                    <div
                      onClick={() => openUserProfile(post.user?._id)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                    >
                      <img
                        src={
                          post.user?.profilePic ||
                          "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                        }
                        alt=""
                        loading="lazy"
                        className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border border-white/10 shrink-0"
                      />

                      <div className="min-w-0">
                        <h4 className="font-semibold text-white truncate">
                          {post.user?.name || "Unknown User"}
                        </h4>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
  <p className="text-xs text-gray-500 truncate">
    {formatVybeTime(post.createdAt)}
  </p>
</div>
                      </div>
                    </div>

                    {isPostOwner && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === post._id ? null : post._id
                            )
                          }
                          className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-base text-gray-400 transition hover:bg-white/[0.07] hover:text-white active:scale-95"
                        >
                          ⋮
                        </button>

                        {openMenuId === post._id && (
                          <div className="absolute right-0 top-10 z-30 w-40 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/50 backdrop-blur-2xl">
                            <button
                              onClick={() => startEditPost(post)}
                              className="block w-full px-4 py-3 text-left text-sm font-bold text-gray-200 transition hover:bg-white/[0.07] hover:text-white"
                            >
                              Edit vybe
                            </button>

                            <button
                              onClick={() => requestDeletePost(post)}
                              className="block w-full px-4 py-3 text-left text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                            >
                              Delete vybe
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CAPTION / EDIT */}
                  {editingPostId === post._id ? (
                    <div className="px-4 pb-4">
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 outline-none focus:border-pink-500 text-white"
                        rows="3"
                      />

                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => saveEditPost(post._id)}
                          className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-sm"
                        >
                          Save
                        </button>

                        <button
                          onClick={cancelEditPost}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    (post.caption || post.content) && (
                      <p
  onDoubleClick={() =>
    handlePostLikeWithAnimation(post._id)
  }
  className={`mx-3.5 sm:mx-5 mb-3 sm:mb-4 mt-0.5 max-w-[94%] break-words whitespace-pre-wrap cursor-pointer select-none transition-all ${
    postKind === "Thought"
      ? "rounded-[20px] border border-pink-400/10 bg-gradient-to-br from-white/[0.055] via-white/[0.025] to-cyan-500/[0.04] px-4 py-4 text-[17px] sm:text-[19px] leading-[1.55] font-semibold tracking-[-0.01em] text-gray-100"
      : "text-[14px] sm:text-[15px] leading-6 text-gray-100"
  }`}
>
                        {post.caption || post.content}
                      </p>
                    )
                  )}

                  {/* MEDIA */}
                  {firstMedia && (
                    <div className="mx-2.5 sm:mx-3 mb-2 sm:mb-3">
                      <div
                        onDoubleClick={() => handlePostLikeWithAnimation(post._id)}
                        onTouchStart={handleFeedMediaTouchStart}
                        onTouchMove={handleFeedMediaTouchMove}
                        onTouchEnd={() => handleFeedMediaTouchEnd(post._id, mediaCount)}
                        className="group relative rounded-[20px] sm:rounded-[24px] w-full aspect-[4/5] max-h-[520px] sm:max-h-[620px] bg-black flex items-center justify-center select-none overflow-hidden border border-white/10 shadow-xl shadow-black/30"
                      >
                        {isImageMedia(firstMedia) ? (
                          <>
                            {!loadedMedia[getMediaUrl(firstMedia)] && (
                              <div className="absolute inset-0 z-10 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-pink-500/[0.08] animate-pulse" />
                            )}
                          <img
                            src={getMediaUrl(firstMedia)}
                            alt=""
                            loading="lazy"
                            onLoad={() => markMediaLoaded(firstMedia)}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) fallback.style.display = "flex";
                            }}
                            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.018] ${loadedMedia[getMediaUrl(firstMedia)] ? "opacity-100" : "opacity-0"}`}
                          />
                          </>
                        ) : (
                          <video
                            src={getMediaUrl(firstMedia)}
                            muted
                            playsInline
                            className="w-full h-full object-contain bg-black"
                          />
                        )}

                        <div className="hidden absolute inset-0 items-center justify-center bg-zinc-950 text-center px-6">
                          <div>
                            <p className="text-3xl mb-2">🖼️</p>
                            <p className="text-sm text-gray-400">
                              Media could not be loaded
                            </p>
                          </div>
                        </div>

                        {mediaCount > 1 && (
                          <>
                            <div className="absolute right-3 top-3 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl px-3 py-1.5 text-[11px] font-black text-white shadow-lg">
                              {activeFeedMediaIndex + 1} / {mediaCount}
                            </div>

                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/45 border border-white/10 backdrop-blur-xl px-3 py-2">
                              {mediaList.slice(0, 6).map((_, dotIndex) => (
                                <span
                                  key={dotIndex}
                                  className={`h-1.5 rounded-full transition-all ${
                                    dotIndex === activeFeedMediaIndex ? "w-5 bg-pink-400" : "w-1.5 bg-white/55"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/85 to-transparent p-4">
                          <p className="text-xs font-bold text-white/90">
                            {mediaCount > 1 ? `${mediaCount} moments stacked` : "Double tap to feel"}
                          </p>
                        </div>
                      </div>

                      {mediaCount > 1 && (
                        <div className="mt-2 flex items-center justify-between gap-2 px-1">
                          <p className="text-[12px] font-black text-pink-300">{mediaCount} moments stacked</p>
                          <div className="hidden sm:flex items-center gap-1.5">
                            <button type="button" onClick={() => slideFeedMedia(post._id, mediaCount, "prev")} className="h-7 w-7 rounded-full border border-white/10 bg-white/[0.035] text-sm text-white/85 hover:bg-white/[0.08] active:scale-95 transition">‹</button>
                            <button type="button" onClick={() => slideFeedMedia(post._id, mediaCount, "next")} className="h-7 w-7 rounded-full border border-white/10 bg-white/[0.035] text-sm text-white/85 hover:bg-white/[0.08] active:scale-95 transition">›</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="px-3 sm:px-4 pt-2.5 sm:pt-3 pb-3 sm:pb-4 border-t border-white/5">
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handlePostLikeWithAnimation(post._id)}
                          className={`flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 sm:px-3 py-1.5 active:scale-95 hover:bg-white/[0.07] transition-all ${
                            isPostLikedByMe(post)
                              ? "text-pink-400"
                              : "text-gray-100 hover:text-pink-400"
                          }`}
                          title="Felt"
                        >
                          <HeartIcon filled={isPostLikedByMe(post)} />
                          <span
  onClick={(e) => {
    e.stopPropagation();
    setLikesModalPost(post);
  }}
  className="text-[11px] sm:text-[12px] font-bold hover:underline cursor-pointer"
>
  {post.likes?.length || 0} Felt
</span>
                        </button>

                        <button
                          onClick={() => setCommentsSheetPost(post)}
                          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 sm:px-3 py-1.5 text-gray-200 hover:text-indigo-300 hover:bg-white/[0.07] active:scale-95 transition-all"
                          title="Replies"
                        >
                          <CommentIcon />
                          <span className="text-[11px] sm:text-[12px] font-bold">
                            {post.comments?.length || 0} Replies
                          </span>
                        </button>

                        <button
                          onClick={() => setSharePost(post)}
                          className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-gray-200 hover:text-cyan-300 hover:bg-white/[0.07] active:scale-95 transition-all"
                          title="Share"
                        >
                          <ShareIcon />
                        </button>
                      </div>

                      <button
                        onClick={() => toggleSavePost(post._id)}
                        className={`rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 active:scale-95 hover:bg-white/[0.07] transition-all ${
                          isSaved
                            ? "text-yellow-400"
                            : "text-gray-100 hover:text-yellow-300"
                        }`}
                        title={isSaved ? "Saved" : "Save"}
                      >
                        <BookmarkIcon saved={isSaved} />
                      </button>
                    </div>

                    {isSaved && (
                      <p className="mb-3 text-xs text-yellow-400">
                        Saved to your Vybe collection
                      </p>
                    )}

                    {/* COMMENTS PANEL */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        commentsOpen
                          ? "max-h-[760px] opacity-100 mt-4 border-t border-white/10 pt-4"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Replies</h3>

                        <button
                          onClick={() =>
                            setOpenComments((prev) => ({
                              ...prev,
                              [post._id]: false,
                            }))
                          }
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          Hide
                        </button>
                      </div>

                      {/* COMMENT INPUT */}
                      <div className="sticky top-0 z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5 bg-zinc-950/95 backdrop-blur-xl pb-3">
                        <input
                          type="text"
                          value={commentText[post._id] || ""}
                          onChange={(e) =>
                            setCommentText((prev) => ({
                              ...prev,
                              [post._id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addComment(post._id);
                            }
                          }}
                          placeholder="Drop a reply..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 text-sm"
                        />

                        <button
                          onClick={() => addComment(post._id)}
                          className="px-4 py-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500 text-sm transition-all sm:w-auto w-full"
                        >
                          Reply
                        </button>
                      </div>

                      {/* COMMENTS */}
                      {post.comments && post.comments.length > 0 ? (
                        <div className="space-y-4 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
                          {post.comments.map((comment) => {
                            const isCommentOwner =
                              comment.user?._id === currentUserId;

                            const canDeleteComment =
                              isCommentOwner || isPostOwner;

                            const replyKey = `${post._id}-${comment._id}`;
                            const isReplying = replyingTo[replyKey];

                            return (
                              <div
                                key={comment._id}
                                className="bg-white/[0.04] border border-white/5 rounded-2xl p-3"
                              >
                                <div className="flex items-start gap-3">
                                  <img
                                    onClick={() =>
                                      openUserProfile(comment.user?._id)
                                    }
                                    src={
                                      comment.user?.profilePic ||
                                      "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                                    }
                                    alt=""
                                    loading="lazy"
                                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0 cursor-pointer hover:scale-105 transition-all"
                                  />

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p
                                        onClick={() =>
                                          openUserProfile(comment.user?._id)
                                        }
                                        className="font-semibold text-white text-sm truncate cursor-pointer hover:text-pink-400 transition-all"
                                      >
                                        {comment.user?.name || "User"}
                                      </p>

                                      {canDeleteComment && (
                                        <button
                                          onClick={() =>
                                            deleteComment(
                                              post._id,
                                              comment._id
                                            )
                                          }
                                          className="text-red-400 hover:text-red-300 text-xs shrink-0"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>

                                    <p className="text-gray-300 text-sm mt-1 break-words">
                                      {comment.text}
                                    </p>

                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                      <button
                                        onClick={() =>
                                          handleCommentLikeWithAnimation(
                                            post._id,
                                            comment._id
                                          )
                                        }
                                        className="relative flex items-center gap-1 hover:text-pink-400"
                                        title="Like comment"
                                      >
                                        {heartCommentId === comment._id && (
                                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl animate-[heartPremium_0.8s_cubic-bezier(0.22,1,0.36,1)_forwards] pointer-events-none">
                                            ❤️
                                          </span>
                                        )}

                                        <HeartIcon />
                                        {comment.likes?.length || 0}
                                      </button>

                                      <button
                                        onClick={() =>
                                          setReplyingTo((prev) => ({
                                            ...prev,
                                            [replyKey]: !prev[replyKey],
                                          }))
                                        }
                                        className="hover:text-indigo-400"
                                      >
                                        Reply
                                      </button>
                                    </div>

                                    {/* REPLIES */}
                                    {comment.replies &&
                                      comment.replies.length > 0 && (
                                        <div className="mt-3 ml-2 border-l border-white/10 pl-3 space-y-3">
                                          {comment.replies.map((reply) => {
                                            const isReplyOwner =
                                              reply.user?._id ===
                                              currentUserId;

                                            const canDeleteReply =
                                              isReplyOwner || isPostOwner;

                                            return (
                                              <div
                                                key={reply._id}
                                                className="flex items-start gap-2"
                                              >
                                                <img
                                                  onClick={() =>
                                                    openUserProfile(
                                                      reply.user?._id
                                                    )
                                                  }
                                                  src={
                                                    reply.user?.profilePic ||
                                                    "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                                                  }
                                                  alt=""
                                                  loading="lazy"
                                                  className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 cursor-pointer hover:scale-105 transition-all"
                                                />

                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm break-words">
                                                      <span
                                                        onClick={() =>
                                                          openUserProfile(
                                                            reply.user?._id
                                                          )
                                                        }
                                                        className="font-semibold text-white mr-2 cursor-pointer hover:text-pink-400 transition-all"
                                                      >
                                                        {reply.user?.name ||
                                                          "User"}
                                                      </span>

                                                      <span className="text-gray-300">
                                                        {reply.text}
                                                      </span>
                                                    </p>

                                                    {canDeleteReply && (
                                                      <button
                                                        onClick={() =>
                                                          deleteReply(
                                                            post._id,
                                                            comment._id,
                                                            reply._id
                                                          )
                                                        }
                                                        className="text-red-400 text-xs ml-2 shrink-0"
                                                      >
                                                        Delete
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                    {/* REPLY INPUT */}
                                    {isReplying && (
                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                                        <input
                                          type="text"
                                          value={replyText[replyKey] || ""}
                                          onChange={(e) =>
                                            setReplyText((prev) => ({
                                              ...prev,
                                              [replyKey]: e.target.value,
                                            }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              addReply(post._id, comment._id);
                                            }
                                          }}
                                          placeholder="Write a reply..."
                                          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm"
                                        />

                                        <button
                                          onClick={() =>
                                            addReply(post._id, comment._id)
                                          }
                                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-indigo-500 text-xs sm:w-auto w-full"
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-6">
                          No replies yet. Be the first to feel this ✨
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {!initialLoading && posts.length > 0 && hasMoreFeed && (
  <div ref={loadMoreRef} className="space-y-6 py-2">
    {loadingMoreFeed ? (
      <>
        <PostSkeleton />
        <PostSkeleton />
      </>
    ) : (
      <div className="flex justify-center py-4">
        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs font-black text-gray-400 shadow-lg shadow-black/20">
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
          Loading more vybes
        </div>
      </div>
    )}
  </div>
)}
        </div>
        </div>

        <aside className="hidden lg:block w-full max-w-[320px]">
          <div className="sticky top-8 space-y-6">
            <div className="flex items-center justify-between gap-4 px-1">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  onClick={() => navigate("/profile")}
                  src={
                    currentUser?.profilePic ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      currentUser?.name || "User"
                    )}&background=8b5cf6&color=fff`
                  }
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border border-white/10 shadow-lg shadow-purple-500/20 cursor-pointer hover:scale-105 transition-all"
                />

                <div
                  onClick={() => navigate("/profile")}
                  className="min-w-0 cursor-pointer"
                >
                  <h3 className="font-bold truncate hover:text-pink-300 transition-all">
                    {currentUser?.name || "User"}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                    @{currentUser?.username || currentUserId?.slice(-8) || "user"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate("/profile")}
                className="text-sm text-cyan-300 hover:text-cyan-200 font-semibold"
              >
                Vybe Space
              </button>
            </div>

            <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-200">People to Tune In</h3>
                <span className="text-xs text-gray-500">Fresh</span>
              </div>

              <div className="space-y-4">
                {suggestedUsers.map((user, index) => {
                  const following = isFollowingUser(user);

                  return (
                    <div
                      key={user._id || index}
                      className="flex items-center justify-between gap-3"
                    >
                      <div
                        onClick={() =>
                          user._id && !user._id.startsWith("demo")
                            ? openUserProfile(user._id)
                            : null
                        }
                        className="flex items-center gap-3 min-w-0 cursor-pointer"
                      >
                        <img
                          src={
                            user.profilePic ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name || "User"
                            )}&background=8b5cf6&color=fff`
                          }
                          alt=""
                          className="w-11 h-11 rounded-full object-cover border border-white/10 hover:scale-105 transition-all"
                        />

                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate hover:text-pink-300 transition-all">
                            {user.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.bio || "People to Tune In"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFollowUser(user)}
                        className={`text-xs font-semibold transition-all ${
                          following
                            ? "text-gray-400 hover:text-red-300"
                            : "text-cyan-300 hover:text-cyan-200"
                        }`}
                      >
                        {following ? "Tuned In" : "Tune In"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5">
              <h3 className="font-bold text-gray-200 mb-4">Trending Vybes</h3>

              <div className="space-y-3">
                {trendingTags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <span className="text-sm text-gray-300 group-hover:text-cyan-300 transition-all">
                      {tag}
                    </span>
                    <span className="text-xs text-gray-600">trending</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-600 leading-6 px-1">
              About · Help · Privacy · Terms <br />
              Vybeo © 2026
            </div>
          </div>
        </aside>
      </div>


      <style>
        {`
          @keyframes vybeCardIn {
            from { opacity: 0; transform: translateY(14px) scale(0.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .animate-vybe-card {
            animation: vybeCardIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .no-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }

          @keyframes galleryNext {
            from { opacity: 0.65; transform: translateX(22px) scale(0.985); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }

          @keyframes galleryPrev {
            from { opacity: 0.65; transform: translateX(-22px) scale(0.985); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }

          .animate-gallery-next {
            animation: galleryNext 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .animate-gallery-prev {
            animation: galleryPrev 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          @keyframes uploadFlow {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(20%); }
            100% { transform: translateX(160%); }
          }

          @keyframes vybeSheetUp {
            from { opacity: 0; transform: translateY(18px) scale(0.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .animate-vybe-sheet {
            animation: vybeSheetUp 240ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

        `}
      </style>



      {/* COMMENTS BOTTOM SHEET */}
      {activeCommentsPost && (
        <div
          onClick={() => setCommentsSheetPost(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-xl max-h-[82dvh] overflow-hidden rounded-t-[28px] sm:rounded-[30px] border border-white/10 bg-zinc-950/98 shadow-2xl shadow-black/70 animate-vybe-sheet"
          >
            <div className="relative overflow-hidden border-b border-white/10 bg-zinc-950/95 p-3.5 sm:p-4 backdrop-blur-2xl">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-pink-500/14 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.22em] text-pink-300 font-black">VYBE REPLIES</p>
                  <h3 className="mt-0.5 truncate text-lg font-black text-white">
                    {activeCommentsPost.comments?.length || 0} replies
                  </h3>
                  {(activeCommentsPost.caption || activeCommentsPost.content) && (
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-gray-500">
                      {activeCommentsPost.caption || activeCommentsPost.content}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setCommentsSheetPost(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.055] text-xl text-gray-300 transition hover:bg-white/[0.09] hover:text-white active:scale-95"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[48dvh] sm:max-h-[52vh] overflow-y-auto no-scrollbar px-3.5 py-3 sm:px-4 sm:py-4 space-y-2.5">
              {activeCommentsPost.comments && activeCommentsPost.comments.length > 0 ? (
                activeCommentsPost.comments.map((comment) => {
                  const canDeleteComment =
                    comment.user?._id === currentUserId || activeCommentsPost.user?._id === currentUserId;

                  return (
                    <div
                      key={comment._id}
                      className={`rounded-[22px] border p-3.5 transition-all ${
                        comment.isTemp
                          ? "border-pink-300/25 bg-pink-500/[0.07] opacity-85"
                          : "border-white/10 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          onClick={() => openUserProfile(comment.user?._id)}
                          src={
                            comment.user?.profilePic ||
                            "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                          }
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-white/10 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              onClick={() => openUserProfile(comment.user?._id)}
                              className="truncate text-sm font-black text-white cursor-pointer hover:text-pink-300"
                            >
                              {comment.user?.name || "User"}
                            </p>
                            {canDeleteComment && !comment.isTemp && (
                              <button
                                type="button"
                                onClick={() => deleteComment(activeCommentsPost._id, comment._id)}
                                className="shrink-0 rounded-full border border-red-400/15 bg-red-500/10 px-2.5 py-1 text-[10px] font-black text-red-200 transition hover:bg-red-500/18"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="mt-1.5 break-words text-sm leading-relaxed text-gray-300">{comment.text}</p>
                          {comment.isTemp && (
                            <p className="mt-1 text-[10px] font-bold text-pink-200/70">Sending...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04] text-2xl">💬</div>
                  <p className="font-black text-gray-200">No replies yet</p>
                  <p className="mt-1 text-sm">Be the first one to join this vybe.</p>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-zinc-950/95 p-3 sm:p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText[activeCommentsPost._id] || ""}
                  onChange={(e) =>
                    setCommentText((prev) => ({
                      ...prev,
                      [activeCommentsPost._id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addComment(activeCommentsPost._id);
                  }}
                  placeholder="Drop a clean reply..."
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm outline-none transition focus:border-pink-400/45 focus:bg-white/[0.07]"
                />
                <button
                  type="button"
                  onClick={() => addComment(activeCommentsPost._id)}
                  className="rounded-2xl bg-gradient-to-r from-pink-500/85 via-purple-500/85 to-cyan-500/85 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-pink-500/15 transition active:scale-95"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {confirmDeletePost && (
        <div
          onClick={() => setConfirmDeletePost(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/98 p-4 shadow-2xl shadow-black/70 animate-vybe-sheet"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-500/12 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl" />

            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-200">Delete Vybe</p>
              <h3 className="mt-1 text-xl font-black text-white">Remove this from your Flow?</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                This action will delete the vybe from your profile and feed. You can’t undo this later.
              </p>

              {(confirmDeletePost.caption || confirmDeletePost.content) && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="line-clamp-2 text-sm text-gray-300">
                    {confirmDeletePost.caption || confirmDeletePost.content}
                  </p>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmDeletePost(null)}
                  className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.09] active:scale-95"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={() => deletePost(confirmDeletePost._id)}
                  className="rounded-2xl border border-red-400/20 bg-red-500/15 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-500/25 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA GALLERY */}
      {galleryPost && activeGalleryMedia && (
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
      )}


      {/* MEDIA EDIT MODAL */}
      {mediaEditModalOpen && activeMedia && isSelectedImage && (
        <div
          onClick={() => setMediaEditModalOpen(false)}
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
                onClick={() => setMediaEditModalOpen(false)}
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
                  onClick={() => setMediaEditModalOpen(false)}
                  className="rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-pink-500/20"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIKES MODAL */}
      {likesModalPost && (
        <div
          onClick={() => setLikesModalPost(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">
                Felt by ({likesModalPost.likes?.length || 0})
              </h3>

              <button
                onClick={() => setLikesModalPost(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            {likesModalPost.likes &&
            likesModalPost.likes.length > 0 ? (
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {likesModalPost.likes.map((user, index) => (
                  <div
                    key={user?._id || index}
                    className="flex items-center gap-3 bg-white/[0.04] border border-white/5 rounded-2xl p-3"
                  >
                    <img
                      src={
                        user?.profilePic ||
                        "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                      }
                      alt=""
                      className="w-11 h-11 rounded-full object-cover border border-white/10"
                    />

                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">
                        {user?.name || "User"}
                      </p>

                      <p className="text-xs text-gray-400">
                        Felt this vybe ❤️
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">
                No one felt this yet
              </p>
            )}
          </div>
        </div>
      )}


      {/* SHARE MODAL */}
      {sharePost && (
        <div
          onClick={() => setSharePost(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-[fadeIn_0.2s_ease-in-out]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Share this vybe</h3>

              <button
                onClick={() => setSharePost(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
  <div className="flex items-center gap-3 mb-3">
    <img
      src={
        sharePost.user?.profilePic ||
        "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
      }
      alt=""
      className="w-11 h-11 rounded-full object-cover border border-white/10"
    />

    <div>
      <p className="font-semibold text-white">
        {sharePost.user?.name || "User"}
      </p>

      <p className="text-xs text-gray-500">
        Shared from Vybe Flow
      </p>
    </div>
  </div>
              <p className="text-sm text-gray-300 line-clamp-2">
                {sharePost.caption || sharePost.content || "Vybeo vybe"}
              </p>
              <p className="text-xs text-gray-500 mt-2 truncate">
                {getPostShareUrl(sharePost._id)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={copyShareLink}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 transition-all font-medium"
              >
                {copiedShare ? "Copied ✅" : "Copy link"}
              </button>

              <button
                onClick={nativeSharePost}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:scale-[1.02] transition-all font-medium"
              >
                Share Vybe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Feed;