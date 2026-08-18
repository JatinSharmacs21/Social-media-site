import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import logger from "../utils/logger";
import ShareModal from "../components/feed/ShareModal";
import CommentsSheet from "../components/feed/CommentsSheet";
import LikesModal from "../components/feed/LikesModal";
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon } from "../components/feed/FeedIcons";
import { getReplyKey } from "../utils/postUtils";

function Profile() {
  const { userId: profileIdentifier } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");
  const isOwnProfile = !profileIdentifier || profileIdentifier === currentUserId;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [edit, setEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("moments");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [postsLocked, setPostsLocked] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [previewPic, setPreviewPic] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [listModal, setListModal] = useState(null); // followers | following
  const [listSearch, setListSearch] = useState("");

  const [selectedPost, setSelectedPost] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [sharePost, setSharePost] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [commentsSheetPost, setCommentsSheetPost] = useState(null);
  const [likesModalPost, setLikesModalPost] = useState(null);
  const [sheetCommentText, setSheetCommentText] = useState({});
  const [replyingTo, setReplyingTo] = useState({});
  const [replyText, setReplyText] = useState({});
  const [heartCommentId, setHeartCommentId] = useState(null);
  const [profilePicOpen, setProfilePicOpen] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [librarySort, setLibrarySort] = useState("latest");
  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 0, left: 0 });
  const profileMenuButtonRef = useRef(null);
  const PROFILE_MENU_WIDTH = 176; // matches w-44

  const openProfileMenu = () => {
    if (profileMenuButtonRef.current) {
      const rect = profileMenuButtonRef.current.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;

      let left = rect.left;
      if (left + PROFILE_MENU_WIDTH > viewportWidth - 12) {
        left = viewportWidth - PROFILE_MENU_WIDTH - 12;
      }
      if (left < 12) left = 12;

      setProfileMenuPos({ top: rect.bottom + 8, left });
    }
    setProfileMenuOpen((prev) => !prev);
  };

  const [blocking, setBlocking] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [confirmDeletePost, setConfirmDeletePost] = useState(null);
  const [postActionBusy, setPostActionBusy] = useState(false);

  const isViewingOwnProfile =
    !profileIdentifier || profileIdentifier === currentUserId || user?._id === currentUserId;

  const authConfig = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const showNotice = (message) => {
    setNotice(message);
    window.clearTimeout(window.__vybeoProfileNoticeTimer);
    window.__vybeoProfileNoticeTimer = window.setTimeout(() => setNotice(""), 2200);
  };

  const avatarUrl = (person) =>
    person?.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      person?.name || person?.username || "User"
    )}&background=8b5cf6&color=fff`;

  const getPrimaryMedia = (post) => post?.media?.[0] || null;

  const getMediaType = (item) => {
    const type = (item?.type || item?.resource_type || "").toLowerCase();
    const url = (item?.url || item?.secure_url || item?.mediaUrl || "").toLowerCase();

    if (type.includes("video") || url.endsWith(".mp4") || url.endsWith(".mov") || url.endsWith(".webm")) return "video";
    if (type.includes("image") || url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".png") || url.endsWith(".webp") || url.endsWith(".gif")) return "image";
    return type || "unknown";
  };

  const imagePosts = posts.filter((post) => getMediaType(getPrimaryMedia(post)) === "image");
  const videoPosts = posts.filter((post) => getMediaType(getPrimaryMedia(post)) === "video");
  const thoughtPosts = posts.filter((post) => !post.media || post.media.length === 0);
  const dropsPosts = posts.filter((post) => post.postType === "drop" || post.postType === "dropReply");
  const totalVybes = posts.length;

  const sortPosts = (items) => {
    const list = [...items];

    if (librarySort === "felt") {
      return list.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    }

    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  };

  const visibleImagePosts = sortPosts(imagePosts);
  const visibleThoughtPosts = sortPosts(thoughtPosts);
  const visibleVideoPosts = sortPosts(videoPosts);
  const visibleDropsPosts = sortPosts(dropsPosts);

  const formatCount = (value = 0) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
    return value;
  };

  const joinedLabel = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "New";

  const currentActor = useMemo(() => {
    if (user?._id === currentUserId) return user;

    try {
      const localUser = JSON.parse(localStorage.getItem("user") || "null");
      if (localUser?._id || localUser?.id) {
        return {
          ...localUser,
          _id: localUser._id || localUser.id,
        };
      }
    } catch {
      // Keep a small fallback so optimistic replies still render instantly.
    }

    return {
      _id: currentUserId,
      name: localStorage.getItem("userName") || "You",
      username: localStorage.getItem("username") || "",
      profilePic: "",
    };
  }, [currentUserId, user]);

  const fetchProfileAndPosts = useCallback(async () => {
    try {
      setError("");

      const cleanIdentifier = profileIdentifier
        ? profileIdentifier.replace(/^@/, "").trim().toLowerCase()
        : "";

      const profileEndpoint = isOwnProfile
        ? "/api/users/me"
        : `/api/users/${encodeURIComponent(cleanIdentifier)}`;

      const profileRes = await API.get(profileEndpoint, authConfig);
      const loadedUser = profileRes.data;

      setUser(loadedUser);
      setName(loadedUser.name || "");
      setUsername(loadedUser.username || "");
      setBio(loadedUser.bio || "");
      setPreviewPic(loadedUser.profilePic || "");
      setPostsLocked(false);

      // A locked (private, not-yet-accepted) profile response has no real
      // posts to fetch — skip the call instead of hitting a guaranteed 403.
      if (loadedUser.isLocked) {
        setPosts([]);
        setPostsLocked(true);
        return;
      }

      const postsEndpoint = isOwnProfile
        ? "/api/posts/my-posts"
        : `/api/posts/user/${loadedUser._id}`;

      try {
        const postsRes = await API.get(postsEndpoint, authConfig);
        setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
      } catch (postsErr) {
        setPosts([]);
        if (postsErr.response?.data?.isPrivate) {
          setPostsLocked(true);
        } else {
          throw postsErr;
        }
      }
    } catch (err) {
      setPosts([]);
      setError(err.response?.data?.message || "Profile load nahi ho payi");
    }
  }, [authConfig, isOwnProfile, profileIdentifier]);

  useEffect(() => {
    fetchProfileAndPosts();
  }, [fetchProfileAndPosts]);

  useEffect(() => {
    const fetchSavedPostIds = async () => {
      try {
        if (!token) return;
        const res = await API.get("/api/posts/saved/me");
        setSavedPosts((res.data || []).map((post) => post._id));
      } catch (err) {
        logger.error("Failed to load saved posts:", err.response?.data || err);
      }
    };

    fetchSavedPostIds();
  }, [token]);

  const toggleSavePost = async (postId) => {
    const wasSaved = savedPosts.includes(postId);

    setSavedPosts((prev) =>
      wasSaved ? prev.filter((id) => id !== postId) : [postId, ...prev]
    );

    try {
      await API.put(`/api/posts/save/${postId}`);
    } catch (err) {
      logger.error("Failed to save/unsave post:", err.response?.data || err);
      setSavedPosts((prev) =>
        wasSaved ? [postId, ...prev] : prev.filter((id) => id !== postId)
      );
    }
  };

  const getPostShareUrl = (postId) => `${window.location.origin}/post/${postId}`;

  const copyShareLink = async () => {
    if (!sharePost?._id) return;

    try {
      await navigator.clipboard.writeText(getPostShareUrl(sharePost._id));
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 1500);
    } catch (err) {
      logger.error("Copy failed:", err);
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
    } catch (err) {
      logger.error("Share cancelled or failed:", err);
    }
  };

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const closeOnScroll = () => setProfileMenuOpen(false);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => window.removeEventListener("scroll", closeOnScroll, true);
  }, [profileMenuOpen]);

  const updatePostInState = (updatedPost) => {
    if (!updatedPost?._id) return;

    setPosts((prev) => prev.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
    setSelectedPost((prev) => (prev?._id === updatedPost._id ? updatedPost : prev));
    setCommentsSheetPost((prev) => (prev?._id === updatedPost._id ? updatedPost : prev));
    setLikesModalPost((prev) => (prev?._id === updatedPost._id ? updatedPost : prev));
  };

  const patchPostEverywhere = (postId, updater) => {
    let patchedPost = null;

    setPosts((prev) =>
      prev.map((post) => {
        if (post._id !== postId) return post;
        patchedPost = updater(post);
        return patchedPost;
      })
    );

    setSelectedPost((prev) => {
      if (!prev || prev._id !== postId) return prev;
      const nextPost = updater(prev);
      patchedPost = nextPost;
      return nextPost;
    });

    setCommentsSheetPost((prev) => {
      if (!prev || prev._id !== postId) return prev;
      const nextPost = updater(prev);
      patchedPost = nextPost;
      return nextPost;
    });

    setLikesModalPost((prev) => {
      if (!prev || prev._id !== postId) return prev;
      const nextPost = updater(prev);
      patchedPost = nextPost;
      return nextPost;
    });

    return patchedPost;
  };

  const isLikedByMe = (post) =>
    post?.likes?.some((like) => {
      if (typeof like === "string") return like === currentUserId;
      return like?._id === currentUserId;
    });

  const buildOptimisticLikedPost = (post) => {
    const alreadyLiked = isLikedByMe(post);

    return {
      ...post,
      likes: alreadyLiked
        ? (post.likes || []).filter((like) => {
            if (typeof like === "string") return like !== currentUserId;
            return like?._id !== currentUserId;
          })
        : [
            ...(post.likes || []),
            currentActor || { _id: currentUserId, name: "You" },
          ],
    };
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file for your profile photo.");
      return;
    }

    setProfileFile(file);
    setPreviewPic(URL.createObjectURL(file));
  };

  const uploadProfileImage = async () => {
    if (!profileFile) return previewPic || user?.profilePic || "";

    const formData = new FormData();
    formData.append("file", profileFile);

    const res = await API.post("/api/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.url;
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
      setError("");

      const uploadedPic = await uploadProfileImage();

      const payload = {
        name,
        bio,
        profilePic: uploadedPic,
      };

      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername) {
        payload.username = cleanUsername;
      }

      const res = await API.put(
        "/api/users/me",
        payload,
        authConfig
      );

      localStorage.setItem("userName", res.data.name || "");
      localStorage.setItem("username", res.data.username || "");

      setUser(res.data);
      setProfileFile(null);
      setEdit(false);

      if (res.data.username && window.location.pathname !== `/profile/${res.data.username}`) {
        navigate(`/profile/${res.data.username}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Profile update nahi ho payi");
    } finally {
      setSaving(false);
    }
  };

  const followUser = async () => {
    try {
      const res = await API.put(`/api/users/follow/${user._id}`, {}, authConfig);

      setUser((prev) => ({
        ...res.data.user,
        // A locked profile keeps its limited shape until the request is accepted.
        isLocked: prev?.isLocked && !res.data.following,
        hasPendingRequest: res.data.requested,
        isFollowing: res.data.following,
      }));

      if (res.data.message) showNotice(res.data.message);
    } catch (err) {
      logger.error(err.response?.data || err);
      showNotice(err.response?.data?.message || "Kuch gadbad ho gayi");
    }
  };

  const toggleBlockUserProfile = async () => {
    if (!user?._id || blocking) return;

    const wasBlocked = Boolean(user.isBlockedByMe);
    setBlocking(true);

    try {
      await API.put(`/api/users/block/${user._id}`, {}, authConfig);
      setProfileMenuOpen(false);

      if (wasBlocked) {
        showNotice(`Unblocked ${user.name || "this user"}`);
      } else {
        showNotice(`Blocked ${user.name || "this user"}`);
      }

      // Stay on this profile and refresh it in place instead of navigating
      // away, so the ••• menu and posts grid immediately reflect the change.
      await fetchProfileAndPosts();
    } catch (err) {
      logger.error(err.response?.data || err);
      showNotice(err.response?.data?.message || "Kuch gadbad ho gayi");
    } finally {
      setBlocking(false);
    }
  };

  const likePost = async (postId) => {
    const previousPost = selectedPost?._id === postId
      ? selectedPost
      : posts.find((post) => post._id === postId);

    patchPostEverywhere(postId, buildOptimisticLikedPost);

    try {
      const res = await API.put(`/api/posts/like/${postId}`, {}, authConfig);
      updatePostInState(res.data);
    } catch (err) {
      logger.error(err.response?.data || err);
      if (previousPost) updatePostInState(previousPost);
    }
  };

  const handleDoubleLike = (post) => {
    if (!post?._id) return;
    likePost(post._id);
    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 850);
  };

  const addComment = async () => {
    const text = commentText.trim();
    if (!text || !selectedPost) return;

    const postId = selectedPost._id;
    const previousPost = selectedPost;
    const tempComment = {
      _id: `temp-comment-${Date.now()}`,
      text,
      user: currentActor || { _id: currentUserId, name: "You" },
      likes: [],
      replies: [],
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    patchPostEverywhere(postId, (post) => ({
      ...post,
      comments: [...(post.comments || []), tempComment],
    }));
    setCommentText("");

    try {
      const res = await API.post(
        `/api/posts/comment/${postId}`,
        { text },
        authConfig
      );

      updatePostInState(res.data);
    } catch (err) {
      logger.error(err.response?.data || err);
      updatePostInState(previousPost);
      setCommentText(text);
    }
  };

  const deleteComment = async (postId, commentId) => {
    const previousPost = selectedPost?._id === postId
      ? selectedPost
      : posts.find((post) => post._id === postId);

    patchPostEverywhere(postId, (post) => ({
      ...post,
      comments: (post.comments || []).filter((comment) => comment._id !== commentId),
    }));

    try {
      const res = await API.delete(`/api/posts/comment/${postId}/${commentId}`, authConfig);
      updatePostInState(res.data);
    } catch (err) {
      logger.error(err.response?.data || err);
      if (previousPost) updatePostInState(previousPost);
    }
  };

  const addCommentToSheet = async (postId) => {
    const text = (sheetCommentText[postId] || "").trim();
    if (!text) return;

    const previousPost = commentsSheetPost?._id === postId
      ? commentsSheetPost
      : posts.find((post) => post._id === postId);

    const tempComment = {
      _id: `temp-comment-${Date.now()}`,
      text,
      user: currentActor || { _id: currentUserId, name: "You" },
      likes: [],
      replies: [],
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    patchPostEverywhere(postId, (post) => ({
      ...post,
      comments: [...(post.comments || []), tempComment],
    }));

    setSheetCommentText((prev) => ({ ...prev, [postId]: "" }));

    try {
      const res = await API.post(`/api/posts/comment/${postId}`, { text }, authConfig);
      updatePostInState(res.data);
    } catch (err) {
      logger.error(err.response?.data || err);
      if (previousPost) updatePostInState(previousPost);
      setSheetCommentText((prev) => ({ ...prev, [postId]: text }));
    }
  };

  const likeComment = async (postId, commentId) => {
    const previousPost = commentsSheetPost?._id === postId
      ? commentsSheetPost
      : posts.find((post) => post._id === postId);

    patchPostEverywhere(postId, (post) => ({
      ...post,
      comments: (post.comments || []).map((comment) => {
        if (comment._id !== commentId) return comment;

        const alreadyLiked = (comment.likes || []).some((like) =>
          typeof like === "string" ? like === currentUserId : like?._id === currentUserId
        );

        return {
          ...comment,
          likes: alreadyLiked
            ? (comment.likes || []).filter((like) =>
                typeof like === "string" ? like !== currentUserId : like?._id !== currentUserId
              )
            : [...(comment.likes || []), currentActor || { _id: currentUserId, name: "You" }],
        };
      }),
    }));

    try {
      const res = await API.put(`/api/posts/comment/like/${postId}/${commentId}`, {}, authConfig);
      updatePostInState(res.data);
    } catch (err) {
      logger.error(err.response?.data || err);
      if (previousPost) updatePostInState(previousPost);
    }
  };

  const handleCommentLikeWithAnimation = (postId, commentId) => {
    likeComment(postId, commentId);
    setHeartCommentId(commentId);
    setTimeout(() => setHeartCommentId(null), 800);
  };

  const addReply = async (postId, commentId) => {
    const key = getReplyKey(postId, commentId);
    const text = (replyText[key] || "").trim();
    if (!text) return;

    const previousPost = commentsSheetPost?._id === postId
      ? commentsSheetPost
      : posts.find((post) => post._id === postId);

    const tempReply = {
      _id: `temp-reply-${Date.now()}`,
      text,
      user: currentActor || { _id: currentUserId, name: "You" },
      likes: [],
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    patchPostEverywhere(postId, (post) => ({
      ...post,
      comments: (post.comments || []).map((comment) =>
        comment._id === commentId
          ? { ...comment, replies: [...(comment.replies || []), tempReply] }
          : comment
      ),
    }));

    setReplyText((prev) => ({ ...prev, [key]: "" }));
    setReplyingTo((prev) => ({ ...prev, [key]: false }));

    try {
      const res = await API.post(`/api/posts/comment/reply/${postId}/${commentId}`, { text }, authConfig);
      updatePostInState(res.data);
    } catch (err) {
      logger.error(err.response?.data || err);
      if (previousPost) updatePostInState(previousPost);
      setReplyText((prev) => ({ ...prev, [key]: text }));
    }
  };

  const deleteReply = async (postId, commentId, replyId) => {
    const previousPost = commentsSheetPost?._id === postId
      ? commentsSheetPost
      : posts.find((post) => post._id === postId);

    patchPostEverywhere(postId, (post) => ({
      ...post,
      comments: (post.comments || []).map((comment) =>
        comment._id === commentId
          ? { ...comment, replies: (comment.replies || []).filter((reply) => reply._id !== replyId) }
          : comment
      ),
    }));

    try {
      const res = await API.delete(`/api/posts/comment/reply/${postId}/${commentId}/${replyId}`, authConfig);
      updatePostInState(res.data);
    } catch (err) {
      logger.error(err.response?.data || err);
      if (previousPost) updatePostInState(previousPost);
    }
  };

  const isPostOwner = (post) => {
    const ownerId = post?.user?._id || post?.user || user?._id;
    return String(ownerId || "") === String(currentUserId || "");
  };

  const openEditPost = (post) => {
    if (!post || !isPostOwner(post)) return;
    setEditingPost(post);
    setEditDraft(post.caption || post.content || "");
  };

  const savePostEdit = async () => {
    if (!editingPost?._id) return;

    const text = editDraft.trim();
    const previousPost = posts.find((post) => post._id === editingPost._id) || selectedPost;
    const payload = editingPost.media?.length > 0 ? { caption: text } : { content: text, caption: text };

    setPostActionBusy(true);
    patchPostEverywhere(editingPost._id, (post) => ({
      ...post,
      ...payload,
      updatedAt: new Date().toISOString(),
    }));

    try {
      let res;
      try {
        res = await API.put(`/api/posts/${editingPost._id}`, payload, authConfig);
      } catch (firstErr) {
        res = await API.put(`/api/posts/update/${editingPost._id}`, payload, authConfig);
      }

      updatePostInState(res.data);
      setEditingPost(null);
      setEditDraft("");
      showNotice("Vybe updated");
    } catch (err) {
      logger.error(err.response?.data || err);
      if (previousPost) updatePostInState(previousPost);
      showNotice(err.response?.data?.message || "Post edit endpoint missing or failed");
    } finally {
      setPostActionBusy(false);
    }
  };

  const requestDeletePost = (post) => {
    if (!post || !isPostOwner(post)) return;
    setConfirmDeletePost(post);
  };

  const deletePostConfirmed = async () => {
    if (!confirmDeletePost?._id) return;

    const postId = confirmDeletePost._id;
    const previousPosts = posts;

    setPostActionBusy(true);
    setPosts((prev) => prev.filter((post) => post._id !== postId));
    setSelectedPost((prev) => (prev?._id === postId ? null : prev));

    try {
      try {
        await API.delete(`/api/posts/${postId}`, authConfig);
      } catch (firstErr) {
        await API.delete(`/api/posts/delete/${postId}`, authConfig);
      }

      setConfirmDeletePost(null);
      showNotice("Vybe deleted");
    } catch (err) {
      logger.error(err.response?.data || err);
      setPosts(previousPosts);
      showNotice(err.response?.data?.message || "Post delete failed");
    } finally {
      setPostActionBusy(false);
    }
  };

  const isTunedIn =
    user?.isFollowing ?? user?.followers?.some((f) => f._id === currentUserId);
  const isLockedProfile = Boolean(user?.isLocked);
  const hasPendingTuneRequest = Boolean(user?.hasPendingRequest);

  const activeList = listModal === "followers" ? user?.followers || [] : user?.following || [];
  const listTitle = listModal === "followers" ? "Circle" : "Tuned In";
  const filteredList = activeList.filter((person) => {
    const q = listSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      person?.name?.toLowerCase().includes(q) ||
      person?.username?.toLowerCase().includes(q)
    );
  });

  const openUserProfile = (id) => {
    setListModal(null);
    setListSearch("");
    setSelectedPost(null);
    setCommentsSheetPost(null);
    setLikesModalPost(null);
    const targetUser = [...(user?.followers || []), ...(user?.following || []), selectedPost?.user].find(
      (person) => person?._id === id
    );
    const slug = targetUser?.username || id;
    navigate(id === currentUserId ? (user?.username ? `/profile/${user.username}` : "/profile") : `/profile/${slug}`);
  };

  const handleShareProfile = async () => {
    try {
      const slug = user?.username || user?._id || "";
      const profileUrl = `${window.location.origin}/profile/${slug}`;

      if (navigator.share) {
        await navigator.share({
          title: `${user?.name || "Vybeo user"} on Vybeo`,
          text: `Tune into ${user?.name || "this Vybe Space"} on Vybeo`,
          url: profileUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(profileUrl);
      setShareCopied(true);
      showNotice("Profile link copied");
      setTimeout(() => setShareCopied(false), 1800);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError("Profile link copy nahi ho paya");
    }
  };

  const renderUserRow = (person) => (
    <button
      key={person._id}
      onClick={() => openUserProfile(person._id)}
      className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 text-left hover:bg-white/10 transition-all"
    >
      <img src={avatarUrl(person)} alt="" className="w-12 h-12 rounded-full object-cover" />
      <div className="min-w-0">
        <h3 className="font-semibold truncate">{person.name || "User"}</h3>
        {person.username && <p className="text-sm text-gray-400 truncate">@{person.username}</p>}
      </div>
    </button>
  );

  const renderMediaCard = (post) => {
    const media = getPrimaryMedia(post);
    const liked = isLikedByMe(post);

    return (
      <button
        key={post._id}
        type="button"
        onClick={() => setSelectedPost(post)}
        className="group relative overflow-hidden rounded-[17px] border border-white/10 bg-zinc-950 text-left shadow-[0_10px_28px_rgba(0,0,0,0.44)] outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-400/40 hover:shadow-[0_16px_38px_rgba(236,72,153,0.12)] active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-pink-400/45"
      >
        <img
          src={media?.url || media?.secure_url || media?.mediaUrl}
          alt=""
          loading="lazy"
          className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-85 transition-opacity duration-300 group-hover:opacity-100" />

        {post.media?.length > 1 && (
          <span className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/65 px-2 py-1 text-[10px] font-black text-white backdrop-blur-md">
            +{post.media.length - 1}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-1.5">
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-black/42 px-2 py-1 text-[9px] font-black text-white/90 backdrop-blur-md transition-all duration-300 group-hover:bg-black/60">
            <span className={liked ? "text-pink-100" : "text-white/85"}>♥ {formatCount(post.likes?.length || 0)}</span>
            <span>↩ {formatCount(post.comments?.length || 0)}</span>
          </div>
        </div>
      </button>
    );
  };

  const renderReelCard = (post) => {
    const media = getPrimaryMedia(post);
    const liked = isLikedByMe(post);

    return (
      <button
        key={post._id}
        type="button"
        onClick={() => setSelectedPost(post)}
        className="group relative overflow-hidden rounded-[16px] border border-white/10 bg-zinc-950 text-left shadow-[0_8px_24px_rgba(0,0,0,0.40)] outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-[0_16px_38px_rgba(34,211,238,0.12)] active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-cyan-300/40"
      >
        <video
          src={media?.url || media?.secure_url || media?.mediaUrl}
          muted
          playsInline
          preload="metadata"
          className="aspect-[9/14] w-full object-cover bg-black transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/5 to-black/25" />
        <span className="absolute right-2 top-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-black text-cyan-100 backdrop-blur-md">
          Clip
        </span>
        <div className="absolute inset-x-0 bottom-0 p-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] font-black text-white/90 backdrop-blur-md transition-all duration-300 group-hover:bg-black/60">
            <span className={liked ? "text-pink-100" : "text-white/85"}>♥ {formatCount(post.likes?.length || 0)}</span>
            <span>↩ {formatCount(post.comments?.length || 0)}</span>
          </div>
        </div>
      </button>
    );
  };

  const renderThoughtCard = (post) => {
    const liked = isLikedByMe(post);

    return (
      <button
        key={post._id}
        type="button"
        onClick={() => setSelectedPost(post)}
        className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(135deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98)_55%,rgba(38,12,35,0.72))] p-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.42)] outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-400/35 hover:shadow-[0_16px_40px_rgba(236,72,153,0.10)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-pink-400/40"
      >
        <div className="absolute -right-14 -top-16 h-32 w-32 rounded-full bg-pink-500/15 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full border border-pink-300/15 bg-pink-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-pink-100">
              Thought
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {new Date(post.createdAt || Date.now()).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>

          <p className="line-clamp-4 whitespace-pre-wrap break-words text-[14px] font-semibold leading-relaxed text-white sm:text-base">
            {post.caption || post.content || "Text Post"}
          </p>

          <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-black text-slate-300 transition-all duration-300 group-hover:bg-black/35">
            <span className={liked ? "text-pink-100" : "text-slate-300"}>♥ {formatCount(post.likes?.length || 0)} felt</span>
            <span>↩ {formatCount(post.comments?.length || 0)} replies</span>
          </div>
        </div>
      </button>
    );
  };

  if (!user && !error) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-black text-white px-3 pb-24 pt-4 sm:px-4 sm:pb-8 sm:pt-6">
      <div className="mx-auto max-w-5xl">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(18,18,22,0.98),rgba(7,7,10,0.99)_50%,rgba(24,8,22,0.90))] p-2.5 shadow-[0_14px_44px_rgba(0,0,0,0.52)] sm:rounded-[34px] sm:p-5 md:p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-pink-500/14 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.075),transparent_32%)]" />

          <div className="relative flex items-center justify-between gap-3 border-b border-white/10 pb-1.5">
            <div className="min-w-0">
              <p className="text-[8.5px] font-black tracking-[0.26em] text-pink-200 sm:text-[10px]">
                VYBE SPACE
              </p>
              <p className="mt-0.5 truncate text-[10.5px] font-semibold text-slate-500 sm:text-xs">
                {isViewingOwnProfile ? "Your space" : "Public space"} • Joined {joinedLabel}
              </p>
            </div>

            {!edit && user?.username && (
              <span className="hidden max-w-[180px] truncate rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[11px] font-black text-slate-400 sm:block">
                @{user.username}
              </span>
            )}
          </div>

          {edit ? (
            <div className="relative mt-3 sm:mt-4">
              <div className="mb-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setProfilePicOpen(true)}
                  className="shrink-0 rounded-full focus:outline-none focus:ring-4 focus:ring-pink-500/35"
                  title="View profile photo"
                >
                  <img
                    src={previewPic || avatarUrl(user)}
                    alt="Profile"
                    className="h-16 w-16 rounded-full border-2 border-white/15 object-cover shadow-xl sm:h-24 sm:w-24"
                  />
                </button>
                <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/[0.045] px-3 py-2.5 text-xs transition-all hover:bg-white/[0.07] sm:text-sm">
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <span className="font-black text-white">Change profile photo</span>
                  <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">JPG, PNG, or WebP.</p>
                </label>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm outline-none transition focus:border-pink-400/50 sm:text-base"
                />
                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  placeholder="username"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm outline-none transition focus:border-pink-400/50 sm:text-base"
                />
              </div>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write your current vibe..."
                rows="3"
                maxLength={160}
                className="mt-2.5 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm outline-none transition focus:border-pink-400/50 sm:text-base"
              />

              <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                <button
                  onClick={updateProfile}
                  disabled={saving}
                  className="rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-4 py-2.5 text-sm font-black shadow-lg shadow-pink-500/20 transition active:scale-[0.98] disabled:opacity-60 sm:px-6"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEdit(false);
                    setError("");
                    setPreviewPic(user?.profilePic || "");
                    setProfileFile(null);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-2.5 text-sm font-bold transition-all hover:bg-white/[0.11] active:scale-[0.98] sm:px-6"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mt-2.5 grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3 sm:mt-5 sm:grid-cols-[104px_minmax(0,1fr)] sm:gap-5">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-35 blur-xl" />
                  <button
                    type="button"
                    onClick={() => setProfilePicOpen(true)}
                    className="relative rounded-full focus:outline-none focus:ring-4 focus:ring-pink-500/35"
                    title="View profile photo"
                  >
                    <img
                      src={previewPic || avatarUrl(user)}
                      alt="Profile"
                      className="h-[64px] w-[64px] rounded-full border-[3px] border-white/15 object-cover shadow-2xl transition-all duration-300 hover:border-pink-400/60 sm:h-[104px] sm:w-[104px]"
                    />
                  </button>
                </div>

                <div className="min-w-0 pt-0.5">
                  <h1 className="truncate text-[20px] font-black leading-[1.05] tracking-tight text-white sm:text-4xl">
                    {user?.name || "User"}
                  </h1>

                  {user?.username && (
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] font-black text-pink-200 sm:text-base">
                      @{user.username}
                      {user?.isPrivate && (
                        <span
                          title="Private Vybe Space"
                          className="rounded-full border border-white/15 bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-300"
                        >
                          🔒 Private
                        </span>
                      )}
                    </p>
                  )}

                  <p className="mt-1 line-clamp-2 max-w-2xl break-words text-[12px] font-medium leading-relaxed text-slate-300 sm:text-base">
                    {user?.bio || "No vibe bio yet"}
                  </p>

                  <div className="mt-1.5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                    {isViewingOwnProfile ? (
                      <button
                        onClick={() => setEdit(true)}
                        className="rounded-[13px] border border-white/10 bg-white/[0.075] px-3 py-1.5 text-xs font-black text-white shadow-inner shadow-white/5 transition-all hover:border-pink-300/35 hover:bg-white/[0.11] active:scale-[0.98] sm:min-w-[128px] sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={followUser}
                        className={`rounded-[13px] px-3 py-1.5 text-xs font-black transition-all active:scale-[0.98] sm:min-w-[128px] sm:px-4 sm:py-2.5 sm:text-sm ${
                          isTunedIn || hasPendingTuneRequest
                            ? "border border-white/10 bg-white/[0.08] hover:bg-white/[0.13]"
                            : "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg shadow-pink-500/15"
                        }`}
                      >
                        {isTunedIn ? "Tuned In" : hasPendingTuneRequest ? "Requested" : "Tune In"}
                      </button>
                    )}

                    <button
                      onClick={handleShareProfile}
                      className="rounded-[13px] border border-white/10 bg-white/[0.075] px-3 py-1.5 text-xs font-black text-white shadow-inner shadow-white/5 transition-all hover:border-cyan-300/35 hover:bg-white/[0.11] active:scale-[0.98] sm:min-w-[110px] sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                      {shareCopied ? "Copied" : "Share"}
                    </button>

                    {!isViewingOwnProfile && (
                      <div className="relative">
                        <button
                          ref={profileMenuButtonRef}
                          onClick={openProfileMenu}
                          className="rounded-[13px] border border-white/10 bg-white/[0.075] px-3 py-1.5 text-xs font-black text-white shadow-inner shadow-white/5 transition-all hover:border-red-300/25 hover:bg-white/[0.11] active:scale-[0.98] sm:px-3.5 sm:py-2.5"
                          aria-label="More options"
                        >
                          •••
                        </button>

                        {profileMenuOpen && (
                          <>
                            <button
                              type="button"
                              aria-label="Close menu"
                              className="fixed inset-0 z-40 cursor-default bg-transparent"
                              onClick={() => setProfileMenuOpen(false)}
                            />
                            <div
                              style={{ position: "fixed", top: profileMenuPos.top, left: profileMenuPos.left }}
                              className="z-50 w-44 overflow-hidden rounded-2xl border border-white/[0.14] bg-[#15131c] p-1.5 shadow-2xl shadow-black/70 ring-1 ring-white/[0.06]"
                            >
                              <button
                                type="button"
                                disabled={blocking}
                                onClick={toggleBlockUserProfile}
                                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition disabled:opacity-50 ${
                                  user?.isBlockedByMe
                                    ? "border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.12]"
                                    : "border-red-300/15 bg-red-500/[0.12] text-red-100 hover:bg-red-500/20"
                                }`}
                              >
                                <span>
                                  {blocking
                                    ? user?.isBlockedByMe
                                      ? "Unblocking..."
                                      : "Blocking..."
                                    : user?.isBlockedByMe
                                    ? `Unblock ${user?.name || "user"}`
                                    : `Block ${user?.name || "user"}`}
                                </span>
                                <span className={user?.isBlockedByMe ? "text-slate-400" : "text-red-300/60"}>
                                  {user?.isBlockedByMe ? "↺" : "⛔"}
                                </span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative mt-2.5 overflow-hidden rounded-[18px] border border-white/10 bg-black/25 shadow-inner shadow-white/5 sm:mt-5">
                <div className="grid grid-cols-3 divide-x divide-white/10">
                  <div className="px-2 py-1.5 text-center sm:py-3">
                    <h2 className="text-[17px] font-black leading-none text-white sm:text-2xl">
                      {formatCount(totalVybes)}
                    </h2>
                    <p className="mt-0.5 text-[9.5px] font-black uppercase tracking-[0.12em] text-slate-500">
                      Vybes
                    </p>
                  </div>

                  <button
                    onClick={() => setListModal("followers")}
                    className="px-2 py-1.5 text-center transition-all hover:bg-white/[0.05] active:scale-[0.98] sm:py-3"
                  >
                    <h2 className="text-[17px] font-black leading-none text-white sm:text-2xl">
                      {formatCount(user?.followers?.length || 0)}
                    </h2>
                    <p className="mt-0.5 text-[9.5px] font-black uppercase tracking-[0.12em] text-slate-500">
                      Circle
                    </p>
                  </button>

                  <button
                    onClick={() => setListModal("following")}
                    className="px-2 py-1.5 text-center transition-all hover:bg-white/[0.05] active:scale-[0.98] sm:py-3"
                  >
                    <h2 className="text-[17px] font-black leading-none text-white sm:text-2xl">
                      {formatCount(user?.following?.length || 0)}
                    </h2>
                    <p className="mt-0.5 text-[9.5px] font-black uppercase tracking-[0.12em] text-slate-500">
                      Tuned
                    </p>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="mt-3.5 sm:mt-7">
          <div className="mb-2.5 flex items-end justify-between gap-3 sm:mb-3">
            <div className="min-w-0">
              <h2 className="text-[21px] font-black leading-none tracking-tight sm:text-3xl">
                Vybe Library
              </h2>
              <p className="mt-1 text-[11px] font-semibold text-slate-500 sm:text-sm">
                Your moments, thoughts, clips & drops — all in one clean space.
              </p>
            </div>
          </div>

          {!isViewingOwnProfile && user?.isBlockedByMe ? (
            <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-black/30 p-8 text-center shadow-inner shadow-white/5">
              <div className="text-4xl">⛔</div>
              <h3 className="mt-3 text-lg font-black text-white">You've blocked this account</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-[12px] font-medium text-slate-400">
                Unblock them from the ••• menu above to see their vybes again.
              </p>
            </div>
          ) : !isViewingOwnProfile && (isLockedProfile || postsLocked) ? (
            <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-black/30 p-8 text-center shadow-inner shadow-white/5">
              <div className="text-4xl">🔒</div>
              <h3 className="mt-3 text-lg font-black text-white">This Vybe Space is private</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-[12px] font-medium text-slate-400">
                {hasPendingTuneRequest
                  ? "Your tune-in request is waiting to be accepted."
                  : "Tune in and wait for them to accept before you can see their vybes."}
              </p>
            </div>
          ) : (
          <>
          <div className="sticky top-2 z-20 mb-3 flex items-center gap-2 rounded-[17px] border border-white/10 bg-black/80 p-1 shadow-2xl shadow-black/35 backdrop-blur-xl sm:static sm:bg-zinc-950/90">
            <div className="grid min-w-0 flex-1 grid-cols-4 gap-1">
              {[
                ["moments", "Moments"],
                ["thoughts", "Thoughts"],
                ["clips", "Clips"],
                ["drops", "Drops"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`rounded-[12px] px-1.5 py-1.5 text-center text-[11px] font-black transition-all sm:px-3 sm:py-2.5 sm:text-sm ${
                    activeTab === key
                      ? "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-pink-500/20"
                      : "text-slate-500 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSortPanelOpen((open) => !open)}
                className="grid h-8 w-8 place-items-center rounded-[12px] border border-white/10 bg-white/[0.045] text-[13px] font-black text-slate-300 transition hover:bg-white/[0.08] hover:text-white active:scale-95 sm:h-9 sm:w-9"
                aria-label="Sort library"
                title={librarySort === "felt" ? "Most felt" : "Latest"}
              >
                ⇅
              </button>

              {sortPanelOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
                  <p className="px-2 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-pink-100/80">Sort vybes</p>
                  {[
                    ["latest", "Latest first"],
                    ["felt", "Most felt"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setLibrarySort(key);
                        setSortPanelOpen(false);
                      }}
                      className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-black transition ${
                        librarySort === key
                          ? "bg-gradient-to-r from-pink-500/25 to-indigo-500/20 text-white"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span>{label}</span>
                      {librarySort === key && <span className="text-pink-200">●</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {activeTab === "moments" ? (
            imagePosts.length === 0 ? (
              <EmptyState text="No moments yet ✨" />
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
                {visibleImagePosts.map(renderMediaCard)}
              </div>
            )
          ) : activeTab === "thoughts" ? (
            thoughtPosts.length === 0 ? (
              <EmptyState text="No thoughts yet ✨" />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {visibleThoughtPosts.map(renderThoughtCard)}
              </div>
            )
          ) : activeTab === "clips" ? (
            videoPosts.length === 0 ? (
              <EmptyState text="No clips yet 🎬" />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4">
                {visibleVideoPosts.map(renderReelCard)}
              </div>
            )
          ) : dropsPosts.length === 0 ? (
            <EmptyState text="No drops yet 🔥" />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {visibleDropsPosts.map(renderThoughtCard)}
            </div>
          )}
          </>
          )}
        </section>
      </div>

      {notice && (
        <div className="fixed left-1/2 top-5 z-[150] -translate-x-1/2 rounded-[18px] border border-pink-300/20 bg-[linear-gradient(135deg,rgba(24,24,27,0.96),rgba(38,12,35,0.92))] px-4 py-3 text-xs font-black text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:top-7">
          <span className="mr-2 text-pink-200">✦</span>{notice}
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(24,24,27,0.98),rgba(8,8,12,0.99),rgba(35,10,31,0.88))] p-4 shadow-2xl sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-pink-200">Edit Vybe</p>
                <h3 className="mt-1 text-xl font-black text-white">Polish your post</h3>
              </div>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setEditDraft("");
                }}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-xl"
              >
                ×
              </button>
            </div>

            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              rows={5}
              maxLength={320}
              placeholder="Update caption or thought..."
              className="w-full resize-none rounded-3xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white outline-none transition focus:border-pink-400/50 focus:bg-white/[0.075]"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-slate-500">{editDraft.length}/320</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setEditDraft("");
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-white transition hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
                <button
                  onClick={savePostEdit}
                  disabled={postActionBusy}
                  className="rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-4 py-2 text-xs font-black text-white transition active:scale-95 disabled:opacity-60"
                >
                  {postActionBusy ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeletePost && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-[28px] border border-red-400/20 bg-[linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,14,0.99),rgba(46,12,25,0.86))] p-5 shadow-2xl">
            <div className="mb-4 inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-100">
              Confirm delete
            </div>
            <h3 className="text-2xl font-black text-white">Delete this vybe?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              This post will be removed from your profile. This action cannot be undone.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmDeletePost(null)}
                disabled={postActionBusy}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.1] disabled:opacity-60"
              >
                Keep
              </button>
              <button
                onClick={deletePostConfirmed}
                disabled={postActionBusy}
                className="rounded-2xl border border-red-400/25 bg-red-500/15 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-500/25 active:scale-95 disabled:opacity-60"
              >
                {postActionBusy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {profilePicOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4"
          onClick={() => setProfilePicOpen(false)}
        >
          <button
            onClick={() => setProfilePicOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 w-11 h-11 rounded-full text-xl"
          >
            ✕
          </button>
          <div className="w-full max-w-lg text-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPic || avatarUrl(user)}
              alt="Profile large"
              className="w-full max-h-[78vh] object-contain rounded-[28px] border border-white/10 shadow-2xl"
            />
            <h3 className="mt-4 text-xl font-black">{user?.name || "User"}</h3>
            {user?.username && <p className="text-pink-300">@{user.username}</p>}
          </div>
        </div>
      )}

      {selectedPost && (
        <PostModal
          selectedPost={selectedPost}
          user={user}
          currentUserId={currentUserId}
          avatarUrl={avatarUrl}
          animateLike={animateLike}
          handleDoubleLike={handleDoubleLike}
          likePost={likePost}
          commentText={commentText}
          setCommentText={setCommentText}
          addComment={addComment}
          deleteComment={deleteComment}
          setSelectedPost={setSelectedPost}
          openUserProfile={openUserProfile}
          currentActor={currentActor}
          formatCount={formatCount}
          isPostOwner={isPostOwner(selectedPost)}
          onEditPost={openEditPost}
          onDeletePost={requestDeletePost}
          savedPosts={savedPosts}
          toggleSavePost={toggleSavePost}
          setSharePost={setSharePost}
          setCommentsSheetPost={setCommentsSheetPost}
          setLikesModalPost={setLikesModalPost}
        />
      )}

      {sharePost && (
        <ShareModal
          post={sharePost}
          copiedShare={copiedShare}
          getPostShareUrl={getPostShareUrl}
          copyShareLink={copyShareLink}
          nativeSharePost={nativeSharePost}
          onClose={() => setSharePost(null)}
        />
      )}

      <CommentsSheet
        activeCommentsPost={commentsSheetPost}
        setCommentsSheetPost={setCommentsSheetPost}
        currentUserId={currentUserId}
        openUserProfile={openUserProfile}
        deleteComment={deleteComment}
        addComment={addCommentToSheet}
        commentText={sheetCommentText}
        setCommentText={setSheetCommentText}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        replyText={replyText}
        setReplyText={setReplyText}
        addReply={addReply}
        deleteReply={deleteReply}
        handleCommentLikeWithAnimation={handleCommentLikeWithAnimation}
        heartCommentId={heartCommentId}
      />

      <LikesModal post={likesModalPost} onClose={() => setLikesModalPost(null)} />

      {listModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-5 sm:p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black">{listTitle}</h2>
              <button
                onClick={() => {
                  setListModal(null);
                  setListSearch("");
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder={`Search ${listTitle}...`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none mb-4"
            />

            <div className="space-y-3 overflow-y-auto pr-1">
              {filteredList.length === 0 ? (
                <p className="text-gray-400 py-8 text-center">
                  {activeList.length === 0 ? `No ${listTitle} yet` : "No one found"}
                </p>
              ) : (
                filteredList.map(renderUserRow)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-black px-3 py-4 text-white sm:px-4 sm:py-6">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="rounded-[24px] border border-white/10 bg-zinc-950 p-3 shadow-2xl sm:rounded-[30px] sm:p-5">
          <div className="border-b border-white/10 pb-3">
            <div className="h-3 w-28 rounded bg-zinc-800" />
            <div className="mt-2 h-3 w-44 rounded bg-zinc-900" />
          </div>

          <div className="mt-3 flex items-start gap-3 sm:mt-4 sm:gap-5">
            <div className="h-[72px] w-[72px] rounded-full bg-zinc-800 sm:h-28 sm:w-28" />
            <div className="min-w-0 flex-1">
              <div className="h-6 w-36 max-w-full rounded-xl bg-zinc-800 sm:h-9 sm:w-72" />
              <div className="mt-2 h-4 w-28 rounded-lg bg-zinc-800" />
              <div className="mt-3 space-y-2">
                <div className="h-3 rounded bg-zinc-900" />
                <div className="h-3 w-4/5 rounded bg-zinc-900" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
                <div className="h-10 rounded-2xl bg-zinc-900 sm:w-28" />
                <div className="h-10 rounded-2xl bg-zinc-900 sm:w-28" />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-2.5 text-center sm:py-4">
                <div className="mx-auto h-6 w-10 rounded-xl bg-zinc-800" />
                <div className="mx-auto mt-2 h-3 w-14 rounded-xl bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-4 h-14 rounded-2xl bg-zinc-950" />
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="aspect-square rounded-[18px] bg-zinc-950 sm:rounded-[24px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 px-4 py-12 text-center text-sm font-semibold text-gray-400 sm:py-16">
      <p>{text}</p>
    </div>
  );
}

function PostModal({
  selectedPost,
  user,
  currentUserId,
  avatarUrl,
  animateLike,
  handleDoubleLike,
  likePost,
  setSelectedPost,
  openUserProfile,
  currentActor,
  formatCount,
  isPostOwner,
  onEditPost,
  onDeletePost,
  savedPosts,
  toggleSavePost,
  setSharePost,
  setCommentsSheetPost,
  setLikesModalPost,
}) {
  const [muted, setMuted] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const tapTimer = useRef(null);

  const closePostModal = () => {
    setSelectedPost(null);
    setCommentsSheetPost(null);
    setLikesModalPost(null);
  };

  const mediaItems = selectedPost.media || [];
  const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0] || null;
  const type = (activeMedia?.type || activeMedia?.resource_type || "").toLowerCase();
  const mediaUrl = activeMedia?.url || activeMedia?.secure_url || activeMedia?.mediaUrl || "";
  const lowerUrl = mediaUrl.toLowerCase();
  const isReel = type.includes("video") || lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".mov") || lowerUrl.endsWith(".webm");
  const isImage = type.includes("image") || lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png") || lowerUrl.endsWith(".webp") || lowerUrl.endsWith(".gif");
  const isThought = mediaItems.length === 0;
  const liked = selectedPost.likes?.some((like) => like?._id === currentUserId || like === currentUserId);
  const isSaved = savedPosts.includes(selectedPost._id);
  const headerTitle = isReel ? "Clip" : isImage ? "Moment" : "Thought";

  const [showSavedToast, setShowSavedToast] = useState(false);
  const prevSavedRef = useRef(isSaved);

  useEffect(() => {
    if (isSaved && !prevSavedRef.current) {
      setShowSavedToast(true);
      const timer = setTimeout(() => setShowSavedToast(false), 1800);
      prevSavedRef.current = isSaved;
      return () => clearTimeout(timer);
    }
    prevSavedRef.current = isSaved;
  }, [isSaved]);

  useEffect(() => {
    setActiveMediaIndex(0);
    setMuted(true);
    setActionMenuOpen(false);
  }, [selectedPost?._id]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closePostModal();
      if (e.key === "ArrowRight") goMedia("next");
      if (e.key === "ArrowLeft") goMedia("prev");
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSelectedPost, selectedPost?._id, activeMediaIndex, mediaItems.length]);

  const goMedia = (direction) => {
    if (mediaItems.length <= 1) return;
    setActiveMediaIndex((prev) =>
      direction === "next"
        ? (prev + 1) % mediaItems.length
        : (prev - 1 + mediaItems.length) % mediaItems.length
    );
  };

  const handleMediaClick = () => {
    if (!isReel) return;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      setMuted((prev) => !prev);
      tapTimer.current = null;
    }, 220);
  };

  const handleMediaDoubleClick = () => {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }
    handleDoubleLike(selectedPost);
  };

  const runPostAction = (action) => {
    setActionMenuOpen(false);

    if (action === "edit") {
      onEditPost(selectedPost);
      return;
    }

    if (action === "delete") {
      onDeletePost(selectedPost);
    }
  };

  const renderPostActionMenu = (compact = false) => {
    if (!isPostOwner) return null;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActionMenuOpen((open) => !open);
          }}
          className={`${compact ? "h-9 w-9" : "h-11 w-11"} grid place-items-center rounded-full border border-white/10 bg-black/55 text-lg font-black text-white backdrop-blur-md transition hover:border-pink-300/30 hover:bg-white/[0.1] active:scale-95`}
          aria-label="Open post options"
        >
          ⋯
        </button>

        {actionMenuOpen && (
          <div
            className="absolute right-0 top-full z-[70] mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => runPostAction("edit")}
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-xs font-black text-white transition hover:bg-white/[0.07]"
            >
              <span>Edit vybe</span>
            </button>
            <button
              type="button"
              onClick={() => runPostAction("delete")}
              className="mt-1 flex w-full items-center rounded-xl px-3 py-2.5 text-left text-xs font-black text-red-100 transition hover:bg-red-500/10"
            >
              <span>Delete vybe</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/92 backdrop-blur-md sm:items-center sm:p-4"
      onClick={() => closePostModal()}
    >
      <div
        className={`relative w-full border border-white/10 bg-zinc-950 shadow-2xl ${
          isReel
            ? "h-[96dvh] max-w-6xl overflow-hidden rounded-t-[30px] sm:h-[92vh] sm:rounded-[34px]"
            : "max-h-[94dvh] max-w-5xl overflow-y-auto rounded-t-[30px] sm:max-h-[92vh] sm:rounded-[32px]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-zinc-950/95 px-3 py-2.5 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => closePostModal()}
            className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-sm font-black text-gray-100 active:scale-95"
          >
            ← Back
          </button>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-gray-300">
            {headerTitle}
          </span>
          <div className="flex items-center gap-2">
            {renderPostActionMenu(true)}
            <button
              onClick={() => closePostModal()}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-xl leading-none active:scale-95"
              aria-label="Close post"
            >
              ×
            </button>
          </div>
        </div>

        <div className="absolute right-4 top-4 z-50 hidden items-center gap-2 lg:flex">
          {renderPostActionMenu(false)}
          <button
            onClick={() => closePostModal()}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/70 text-2xl leading-none transition hover:bg-white/10"
            aria-label="Close post"
          >
            ×
          </button>
        </div>

        <div className={`flex flex-col lg:grid ${isReel ? "lg:grid-cols-[minmax(320px,460px)_1fr] h-[calc(96dvh-58px)] sm:h-full" : "lg:grid-cols-2"}`}>
          <div
            onClick={handleMediaClick}
            onDoubleClick={handleMediaDoubleClick}
            className={`relative flex cursor-pointer select-none items-center justify-center overflow-hidden bg-black ${
              isReel
                ? "h-[58dvh] sm:h-[92vh] lg:h-[92vh]"
                : "lg:h-auto lg:min-h-[620px] lg:max-h-[88vh]"
            }`}
          >
            {animateLike && (
              <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
                <div className="animate-bounce text-[88px] drop-shadow-[0_0_20px_rgba(236,72,153,0.55)] md:text-[120px]">
                  ❤️
                </div>
              </div>
            )}

            {isImage ? (
              <>
                <img src={mediaUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl opacity-25" />
                <img src={mediaUrl} alt="" className="relative z-10 max-h-[55dvh] w-full object-contain sm:max-h-[62dvh] lg:h-full lg:max-h-[85vh]" />
              </>
            ) : isReel ? (
              <>
                <video
                  src={mediaUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={muted}
                  className="h-full w-full bg-black object-contain sm:object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 lg:hidden">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-bold text-white">{selectedPost.caption || selectedPost.content || "Vybeo Clip"}</p>
                    <p className="mt-1 text-[11px] font-semibold text-gray-300">Tap sound • double tap felt</p>
                  </div>
                  <div className="shrink-0 rounded-full border border-white/10 bg-black/55 px-3 py-2 text-sm backdrop-blur-md">
                    {muted ? "🔇" : "🔊"}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-950 via-purple-950/25 to-zinc-950 p-5 sm:p-10">
                <div className="max-w-xl rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-8">
                  <div className="mb-4 inline-flex rounded-full border border-pink-300/15 bg-pink-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-pink-100">
                    Thought
                  </div>
                  <p className="break-words whitespace-pre-wrap text-xl font-bold leading-relaxed text-white sm:text-3xl">
                    {selectedPost.caption || selectedPost.content}
                  </p>
                </div>
              </div>
            )}

            {mediaItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goMedia("prev");
                  }}
                  className="absolute left-3 top-1/2 z-30 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/50 text-xl backdrop-blur-md transition hover:bg-black/70"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goMedia("next");
                  }}
                  className="absolute right-3 top-1/2 z-30 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/50 text-xl backdrop-blur-md transition hover:bg-black/70"
                >
                  ›
                </button>
                <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-md">
                  {mediaItems.map((_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${activeMediaIndex === index ? "w-5 bg-pink-400" : "w-1.5 bg-white/45"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={`flex min-h-0 flex-col bg-[linear-gradient(180deg,rgba(9,9,11,0.98),rgba(14,10,16,0.98))] ${isReel ? "shrink-0 h-[calc(38dvh-58px)] lg:h-[92vh]" : "lg:h-[88vh]"}`}>
            <div className="flex items-center gap-3 border-b border-white/10 bg-zinc-950/95 p-3.5 sm:p-5">
              <button onClick={() => selectedPost.user?._id && openUserProfile(selectedPost.user._id)}>
                <img src={avatarUrl(selectedPost.user || user)} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-white/10" />
              </button>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => selectedPost.user?._id && openUserProfile(selectedPost.user._id)}
                  className="block truncate text-sm font-black hover:underline sm:text-base"
                >
                  {selectedPost.user?.name || user?.name || "User"}
                </button>
                <p className="truncate text-xs font-semibold text-gray-500 sm:text-sm">
                  {selectedPost.user?.username ? `@${selectedPost.user.username} • ` : ""}
                  {selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleString() : ""}
                </p>
              </div>
              <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black text-slate-400 sm:inline-flex">
                {headerTitle}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3.5 sm:p-5">
              {(selectedPost.caption || selectedPost.content) && !isThought && (
                <p className="mb-4 break-words whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-relaxed text-gray-200">
                  {selectedPost.caption || selectedPost.content}
                </p>
              )}

              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[22px] border border-white/10 bg-black/30 px-3 py-2.5 text-xs font-black text-slate-300 shadow-inner shadow-white/5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => likePost(selectedPost._id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 transition-all active:scale-90 ${
                      liked ? "text-pink-400" : "text-gray-100 hover:text-pink-300"
                    }`}
                  >
                    <HeartIcon filled={liked} />
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedPost.likes?.length) setLikesModalPost(selectedPost);
                      }}
                      className="hover:underline"
                    >
                      {formatCount(selectedPost.likes?.length || 0)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommentsSheetPost(selectedPost)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-gray-100 transition-all hover:text-white active:scale-90"
                  >
                    <CommentIcon />
                    <span>{formatCount(selectedPost.comments?.length || 0)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSharePost(selectedPost)}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-gray-100 transition-all hover:bg-white/[0.07] active:scale-90"
                    title="Share"
                  >
                    <ShareIcon />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSavePost(selectedPost._id)}
                  className={`ml-auto shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 transition-all duration-200 hover:bg-white/[0.07] active:scale-90 ${
                    isSaved ? "text-yellow-400 scale-105" : "text-gray-100 hover:text-yellow-300"
                  }`}
                  title={isSaved ? "Saved" : "Save"}
                >
                  <BookmarkIcon saved={isSaved} />
                </button>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  showSavedToast ? "mb-4 max-h-14 opacity-100" : "mb-0 max-h-0 opacity-0"
                }`}
              >
                <p className="flex items-center gap-1.5 rounded-2xl border border-yellow-300/15 bg-yellow-400/10 px-3 py-2 text-[11px] font-bold text-yellow-300">
                  <span>✓</span> Saved to your Vybe collection
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCommentsSheetPost(selectedPost)}
                className="w-full rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.08),rgba(255,255,255,0.025)_46%,transparent)] px-4 py-6 text-center transition hover:border-pink-300/20 hover:bg-white/[0.035] active:scale-[0.99]"
              >
                <p className="text-sm font-black text-white">View replies</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {formatCount(selectedPost.comments?.length || 0)} replies • tap to open the conversation
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;