import React, { useEffect, useMemo, useState } from "react";
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

  const fetchCurrentUser = async () => {
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

  useEffect(() => {
    fetchPosts();
    fetchCurrentUser();
  }, []);

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
      text: sharePost.caption || sharePost.content || "Vybeo post",
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
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
        },
        authConfig
      );

      setPosts([newPost.data, ...posts]);
      setCaption("");
      setSelectedFile(null);
      setPreview("");
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
      const confirmDelete = window.confirm("Delete this post?");
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

  const trendingTags = useMemo(
    () =>
      ["#Vybeo", "#Reels", "#Coding", "#MERN", "#Developers", "#Vibes"]
        .sort(() => Math.random() - 0.5)
        .slice(0, 4),
    []
  );

  return (
    <div className="min-h-screen bg-black text-white px-2 sm:px-4 md:px-6 pt-20 md:pt-8 pb-24 md:pb-10">
      <div className="w-full max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,590px)_300px] xl:grid-cols-[minmax(0,600px)_320px] gap-8 xl:gap-10 justify-center items-start">
        <div className="w-full max-w-[600px] mx-auto lg:mx-0">
        {/* CREATE POST */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPost();
          }}
          className="bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-5 mb-6 sm:mb-8 shadow-xl w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 flex items-center justify-center font-bold text-lg shrink-0">
              V
            </div>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 outline-none focus:border-pink-500 transition-all text-white placeholder:text-gray-400"
            />
          </div>

          {preview && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[4/5] max-h-[520px]">
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

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-2xl text-sm transition-all">
              📎 Add Photo/Video
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
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-7 py-3 rounded-2xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-60"
            >
              {loading ? "Uploading..." : "Post"}
            </button>
          </div>
        </form>

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
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <h2 className="text-2xl font-bold mb-2">No Posts Yet</h2>
              <p>Start sharing your vibe ✨</p>
            </div>
          ) : (
            posts.map((post) => {
              const isPostOwner = post.user?._id === currentUserId;
              const commentsOpen = openComments[post._id];
              const isSaved = savedPosts.includes(post._id);

              return (
                <div
                  key={post._id}
                  className="relative bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl w-full"
                >
                  {heartPostId === post._id && (
                    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                      <div className="absolute w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
                      <div className="text-[92px] sm:text-[120px] animate-[heartPremium_0.9s_cubic-bezier(0.22,1,0.36,1)_forwards] drop-shadow-[0_0_24px_rgba(236,72,153,0.55)]">
                        ❤️
                      </div>
                    </div>
                  )}

                  {/* HEADER */}
                  <div className="flex items-center justify-between p-4 relative">
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

                        <p className="text-xs text-gray-400 truncate">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleString()
                            : ""}
                        </p>
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
                              Edit caption
                            </button>

                            <button
                              onClick={() => deletePost(post._id)}
                              className="block w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-400 text-sm"
                            >
                              Delete post
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
                        className="px-4 pt-1 pb-4 text-[15px] sm:text-[16px] text-gray-100 leading-7 break-words cursor-pointer select-none"
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
                        className="relative w-full aspect-[4/5] max-h-[78vh] bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden"
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
                            className="w-full h-full object-cover"
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
                  <div className="px-4 pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-5">
                        <button
                          onClick={() => handlePostLikeWithAnimation(post._id)}
                          className={`flex items-center gap-2 active:scale-90 transition-all ${
                            isPostLikedByMe(post)
                              ? "text-pink-400"
                              : "text-gray-100 hover:text-pink-400"
                          }`}
                          title="Like"
                        >
                          <HeartIcon filled={isPostLikedByMe(post)} />
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setLikesModalPost(post);
                            }}
                            className="text-[15px] font-semibold hover:underline cursor-pointer"
                          >
                            {post.likes?.length || 0}
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            setOpenComments((prev) => ({
                              ...prev,
                              [post._id]: !prev[post._id],
                            }))
                          }
                          className="flex items-center gap-2 text-gray-100 hover:text-indigo-300 active:scale-90 transition-all"
                          title="Comments"
                        >
                          <CommentIcon />
                          <span className="text-[15px] font-semibold">
                            {post.comments?.length || 0}
                          </span>
                        </button>

                        <button
                          onClick={() => setSharePost(post)}
                          className="text-gray-100 hover:text-cyan-300 active:scale-90 transition-all"
                          title="Share"
                        >
                          <ShareIcon />
                        </button>
                      </div>

                      <button
                        onClick={() => toggleSavePost(post._id)}
                        className={`active:scale-90 transition-all ${
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
                        Saved to your collection
                      </p>
                    )}

                    {/* COMMENTS PANEL */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        commentsOpen
                          ? "max-h-[900px] opacity-100 mt-4 border-t border-white/10 pt-4"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Comments</h3>

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
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5">
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
                          placeholder="Add a comment..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 text-sm"
                        />

                        <button
                          onClick={() => addComment(post._id)}
                          className="px-4 py-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500 text-sm transition-all sm:w-auto w-full"
                        >
                          Send
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
                          No comments yet. Be the first one ✨
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
                    @{currentUser?.email?.split("@")[0] || currentUserId?.slice(-8) || "user"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate("/profile")}
                className="text-sm text-cyan-300 hover:text-cyan-200 font-semibold"
              >
                Profile
              </button>
            </div>

            <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-200">Suggested for you</h3>
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
                            {user.bio || "Suggested for you"}
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
                        {following ? "Following" : "Follow"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5">
              <h3 className="font-bold text-gray-200 mb-4">Trending now</h3>

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
                Likes ({likesModalPost.likes?.length || 0})
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
                        Liked this post ❤️
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">
                No likes yet
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
              <h3 className="text-lg font-bold">Share post</h3>

              <button
                onClick={() => setSharePost(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-4">
              <p className="text-sm text-gray-300 line-clamp-2">
                {sharePost.caption || sharePost.content || "Vybeo post"}
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
                Share now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Feed;
