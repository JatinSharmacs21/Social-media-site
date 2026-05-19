import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Feed() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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

  const [likesModalPost, setLikesModalPost] = useState(null);
  const [followingUsers, setFollowingUsers] = useState({});
  const [activeMood, setActiveMood] = useState("All");
  const [activeFlowTab, setActiveFlowTab] = useState("For You");
  const [visiblePosts, setVisiblePosts] = useState(5);
  const moodPickerRef = useRef(null);
  const captionRef = useRef(null);
  const loadMoreRef = useRef(null);

  const moodChips = ["All", "Deep", "Funny", "Chaos", "Late Night", "Creative", "College"];
  const flowTabs = ["For You", "Tuned In", "Close Circle"];
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

  const fetchPosts = async () => {
    try {
      setInitialLoading(true);
      const res = await API.get("/api/posts");
      setPosts(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    } finally {
      setInitialLoading(false);
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
  setVisiblePosts(5);
}, [activeMood, activeFlowTab]);

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


  const updatePostInState = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith("video")) {
  setComposerType("Clip");
} else if (file.type.startsWith("image")) {
  setComposerType("Moment");
}
    setPreview(URL.createObjectURL(file));
  };

  const createPost = async () => {
    try {
      if (!caption.trim() && !selectedFile) return;

      setLoading(true);

      let media = [];

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await API.post("/api/upload", formData, {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "multipart/form-data",
          },
        });

        media.push(uploadRes.data);
      }

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
      setSelectedFile(null);
      setPreview("");
      setComposerType("Thought");
      setSelectedMood("All");
      setMoodPickerOpen(false);
    } catch (error) {
      console.log(error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (id) => {
    try {
      const res = await API.put(`/api/posts/like/${id}`, {}, authConfig);
      updatePostInState(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
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
    try {
      const text = commentText[postId];

      if (!text || !text.trim()) return;

      const res = await API.post(
        `/api/posts/comment/${postId}`,
        {
          text: text.trim(),
        },
        authConfig
      );

      updatePostInState(res.data);

      setCommentText((prev) => ({
        ...prev,
        [postId]: "",
      }));

      setOpenComments((prev) => ({
        ...prev,
        [postId]: true,
      }));
    } catch (error) {
      console.log(error.response?.data || error);
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
    try {
      const res = await API.put(
        `/api/posts/comment/like/${postId}/${commentId}`,
        {},
        authConfig
      );

      updatePostInState(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
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
    try {
      const key = `${postId}-${commentId}`;
      const text = replyText[key];

      if (!text || !text.trim()) return;

      const res = await API.post(
        `/api/posts/comment/reply/${postId}/${commentId}`,
        {
          text: text.trim(),
        },
        authConfig
      );

      updatePostInState(res.data);

      setReplyText((prev) => ({
        ...prev,
        [key]: "",
      }));

      setReplyingTo((prev) => ({
        ...prev,
        [key]: false,
      }));
    } catch (error) {
      console.log(error.response?.data || error);
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
      const confirmDelete = window.confirm("Delete this vybe?");
      if (!confirmDelete) return;

      await API.delete(`/api/posts/${postId}`, authConfig);

      setPosts((prevPosts) =>
        prevPosts.filter((post) => post._id !== postId)
      );

      setOpenMenuId(null);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const HeartIcon = ({ filled = true }) => (
    <svg
      viewBox="0 0 24 24"
      className="w-[28px] h-[28px]"
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
      className="w-[28px] h-[28px]"
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
      className="w-[28px] h-[28px]"
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
      className="w-[28px] h-[28px]"
      fill={saved ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );

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
    const users = posts
      .map((post) => post.user)
      .filter(Boolean)
      .filter((user) => user._id !== currentUserId)
      .filter((user, index, arr) => {
        return arr.findIndex((item) => item?._id === user?._id) === index;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    return users.length > 0 ? users : fallbackUsers.slice(0, 5);
  }, [posts, currentUserId, fallbackUsers]);

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

const flowPosts = posts.filter((post) => {
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

const displayedPosts = flowPosts.slice(0, visiblePosts);
const hasMorePosts = visiblePosts < flowPosts.length;

useEffect(() => {
  if (!loadMoreRef.current || !hasMorePosts || initialLoading) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setVisiblePosts((prev) => Math.min(prev + 5, flowPosts.length));
      }
    },
    { root: null, rootMargin: "220px", threshold: 0.1 }
  );

  observer.observe(loadMoreRef.current);

  return () => observer.disconnect();
}, [hasMorePosts, initialLoading, flowPosts.length, activeMood, activeFlowTab]);



  const trendingTags = useMemo(
  () =>
    ["#DeepVybes", "#LateNight", "#Chaos", "#CollegeLife", "#RealThoughts", "#Creative"]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4),
  []
);
  return (
    <div className="min-h-screen bg-black text-white px-2 sm:px-4 md:px-6 pt-4 md:pt-8 pb-24 md:pb-10">
      <div className="w-full max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,590px)_300px] xl:grid-cols-[minmax(0,600px)_320px] gap-8 xl:gap-10 justify-center items-start">
        <div className="w-full max-w-[600px] mx-auto lg:mx-0">
          {/* VYBE FLOW HEADER */}
          <div className="mb-5 sm:mb-7">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] tracking-[0.24em] text-pink-300 font-black mb-1">
                  VYBEO
                </p>

                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
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

            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {moodChips.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setActiveMood(mood)}
                  className={`shrink-0 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
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
            className={`relative overflow-visible bg-zinc-950/90 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-5 sm:mb-7 shadow-xl shadow-black/30 w-full transition-all duration-300 ${
              selectedMood !== "All" ? "shadow-pink-500/10" : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              {["Thought", "Moment", "Clip"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setComposerType(type)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                    composerType === type
                      ? "bg-gradient-to-r from-pink-500/25 to-cyan-500/20 border-pink-400/30 text-white"
                      : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            <div className="flex items-start gap-3 mb-4">
  <img
    src={
      currentUser?.profilePic ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        currentUser?.name || "User"
      )}&background=8b5cf6&color=fff`
    }
    alt=""
    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-white/10 shrink-0"
  />

  <div ref={moodPickerRef} className="relative flex-1 min-w-0">
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
        composerType === "Thought"
          ? moodMeta[selectedMood]?.placeholder || "Drop a real thought..."
          : composerType === "Moment"
          ? "Say something about this moment..."
          : "Add a caption to your clip..."
      }
      rows={1}
      className="w-full min-w-0 overflow-y-auto bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-24 outline-none focus:border-pink-500 focus:bg-white/[0.07] transition-all text-white placeholder:text-gray-400 resize-none leading-6"
      style={{ minHeight: "58px", maxHeight: "180px" }}
    />

    <button
      type="button"
      onClick={() => setMoodPickerOpen((prev) => !prev)}
      className={`absolute right-2 top-2 h-9 px-3 rounded-xl border text-xs font-black transition-all ${
        selectedMood !== "All"
          ? `bg-gradient-to-r ${moodMeta[selectedMood]?.style} border-white/20 text-white`
          : "bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
      }`}
    >
      <span className="mr-1">{moodMeta[selectedMood]?.icon}</span>
      {selectedMood === "All" ? "Mood" : selectedMood}
    </button>

    {moodPickerOpen && (
      <div className="absolute right-0 top-12 z-30 w-[260px] rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl shadow-black/50 p-3">
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

            {preview && (
              <div className="mb-4 rounded-[24px] overflow-hidden border border-white/10 bg-black/70 aspect-[4/5] max-h-[520px] shadow-2xl shadow-black/35">
                {selectedFile?.type.startsWith("image") ? (
                  <img
                    src={preview}
                    alt="preview"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-2xl text-sm font-semibold transition-all">
                {composerType === "Clip" ? "🎬 Add Clip" : "📎 Add Moment"}
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 px-7 py-3 rounded-2xl font-black hover:scale-[1.02] transition-all shadow-lg shadow-pink-500/15 disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading
                  ? "Dropping..."
                  : composerType === "Thought"
                  ? "Drop Thought"
                  : composerType === "Moment"
                  ? "Drop Moment"
                  : "Drop Clip"}
              </button>
            </div>
          </form>

          {/* FLOW TABS */}
          <div className="flex items-center gap-2 mb-5 bg-zinc-950/90 border border-white/10 rounded-3xl p-1.5 shadow-lg shadow-black/20 backdrop-blur-xl">
            {flowTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFlowTab(tab)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeFlowTab === tab
                    ? "bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-white/10 text-white shadow-lg"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

        {/* POSTS */}
        <div className="space-y-6">
          {initialLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl animate-pulse"
                >
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
              ))}
            </div>
          ) : flowPosts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
  <div className="w-20 h-20 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-3xl mx-auto mb-5">
    ✨
  </div>

  <h2 className="text-2xl font-black mb-2">
    No Vybes Found
  </h2>

  <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
    Try another mood or tune into more people to shape your Flow.
  </p>
</div>
          ) : (
            displayedPosts.map((post) => {
              const isPostOwner = post.user?._id === currentUserId;
              const commentsOpen = openComments[post._id];
              const isSaved = savedPosts.includes(post._id);
              const postKind = getPostKind(post);

              return (
                <div
                  key={post._id}
                  className="relative bg-zinc-950/95 border border-white/10 rounded-[26px] sm:rounded-[30px] overflow-hidden shadow-xl shadow-black/30 w-full hover:border-pink-500/20 hover:shadow-[0_0_45px_rgba(236,72,153,0.08)] transition-all duration-300 animate-vybe-card"
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
                  <div className="flex items-center justify-between p-4 pb-3 relative">
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
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-white/10 shrink-0"
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
                          className="text-gray-400 hover:text-white text-xl px-2"
                        >
                          ⋮
                        </button>

                        {openMenuId === post._id && (
                          <div className="absolute right-0 top-8 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden w-36 z-20 shadow-xl">
                            <button
                              onClick={() => startEditPost(post)}
                              className="block w-full text-left px-4 py-3 hover:bg-white/10 text-sm"
                            >
                              Edit vybe
                            </button>

                            <button
                              onClick={() => deletePost(post._id)}
                              className="block w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-400 text-sm"
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
  className={`mx-6 mb-6 mt-2 max-w-[92%] break-words whitespace-pre-wrap cursor-pointer select-none transition-all ${
    postKind === "Thought"
      ? "text-[18px] sm:text-[20px] leading-[1.65] font-semibold tracking-[-0.01em] text-gray-100"
      : "text-[15px] sm:text-[16px] leading-7 text-gray-100"
  }`}
>
                        {post.caption || post.content}
                      </p>
                    )
                  )}

                  {/* MEDIA */}
                  {post.media &&
                    post.media.map((item, index) => (
                      <div
                        key={index}
                        onDoubleClick={() =>
                          handlePostLikeWithAnimation(post._id)
                        }
                        className="relative mx-3 mb-3 rounded-[24px] w-[calc(100%-24px)] aspect-[4/5] max-h-[78vh] bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden border border-white/5 shadow-2xl shadow-black/30"
                      >
                        {isImageMedia(item) ? (
                          <img
                            src={getMediaUrl(item)}
                            alt=""
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) fallback.style.display = "flex";
                            }}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.015]"
                          />
                        ) : (
                          <video
                            src={getMediaUrl(item)}
                            controls
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
                      </div>
                    ))}

                  {/* ACTIONS */}
                  <div className="px-4 pt-4 pb-4 border-t border-white/5">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => handlePostLikeWithAnimation(post._id)}
                          className={`flex items-center gap-2 rounded-2xl px-2.5 py-2 active:scale-95 hover:bg-white/[0.055] transition-all ${
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
  className="text-[13px] font-semibold hover:underline cursor-pointer"
>
  {post.likes?.length || 0} Felt
</span>
                        </button>

                        <button
                          onClick={() =>
                            setOpenComments((prev) => ({
                              ...prev,
                              [post._id]: !prev[post._id],
                            }))
                          }
                          className="flex items-center gap-2 rounded-2xl px-2.5 py-2 text-gray-100 hover:text-indigo-300 hover:bg-white/[0.055] active:scale-95 transition-all"
                          title="Replies"
                        >
                          <CommentIcon />
                          <span className="text-[13px] font-semibold">
                            {post.comments?.length || 0} Replies
                          </span>
                        </button>

                        <button
                          onClick={() => setSharePost(post)}
                          className="rounded-2xl px-2.5 py-2 text-gray-100 hover:text-cyan-300 hover:bg-white/[0.055] active:scale-95 transition-all"
                          title="Share"
                        >
                          <ShareIcon />
                        </button>
                      </div>

                      <button
                        onClick={() => toggleSavePost(post._id)}
                        className={`rounded-2xl px-2.5 py-2 active:scale-95 hover:bg-white/[0.055] transition-all ${
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
                        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
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

          {!initialLoading && flowPosts.length > 0 && hasMorePosts && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs font-black text-gray-400 shadow-lg shadow-black/20">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                Loading more vybes
              </div>
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
        `}
      </style>

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