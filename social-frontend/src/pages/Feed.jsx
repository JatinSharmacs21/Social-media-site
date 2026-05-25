import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";
import { useLocation, useNavigate } from "react-router-dom";
import {
  moodChips,
  flowTabs,
  mediaAspectOptions,
  mediaFilterOptions,
  moodMeta,
} from "../constants/feedConstants";

import {
  getMediaUrl,
  isImageMedia,
  formatVybeTime,
  hasVideoMedia,
} from "../utils/mediaUtils";

import PostSkeleton from "../components/feed/PostSkeleton";
import PostCard from "../components/feed/PostCard";

import { getUserId } from "../utils/postUtils";

import ActionNotice from "../components/feed/ActionNotice";
import FeedHeader from "../components/feed/FeedHeader";
import LikesModal from "../components/feed/LikesModal";
import ShareModal from "../components/feed/ShareModal";
import ConfirmDeleteModal from "../components/feed/ConfirmDeleteModal";
import FeedComposer from "../components/feed/FeedComposer";
import MediaGallery from "../components/feed/MediaGallery";
import MediaEditModal from "../components/feed/MediaEditModal";
import RightSidebar from "../components/feed/RightSidebar";
import FeedPageStyles from "../components/feed/FeedPageStyles";
import CommentsSheet from "../components/feed/CommentsSheet";
import FeedEmptyState from "../components/feed/FeedEmptyState";
import FlowTabs from "../components/feed/FlowTabs";
import useFeedMedia from "../hooks/useFeedMedia";
import useFeedGallery from "../hooks/useFeedGallery";
import usePostActions from "../hooks/usePostActions";
import useFeedPosts from "../hooks/useFeedPosts";
import useFeedSocket from "../hooks/useFeedSocket";
import logger from "../utils/logger";

function Feed() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const {
    posts,
    setPosts,
    currentUser,
    initialLoading,
    feedPage,
    hasMoreFeed,
    loadingMoreFeed,
    fetchPosts,
  } = useFeedPosts({
    currentUserId,
  });

  const [caption, setCaption] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [loading, setLoading] = useState(false);

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
  const {
    setSelectedFile,
    preview,
    setPreview,
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
    revokeMediaItemUrls,
    removeSelectedMedia,
    removeMediaItem,
    getProcessedImageFile,
    handleFileChange,
    selectMediaItem,
  } = useFeedMedia({
    mediaFilterOptions,
    setComposerType,
  });


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
  const {
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
  } = useFeedGallery();

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
  const postingRef = useRef(false);

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


  const {
    addComment,
    addReply,
    cancelEditPost,
    deleteComment,
    deletePost,
    deleteReply,
    handleCommentLikeWithAnimation,
    handlePostLikeWithAnimation,
    isFollowingUser,
    isPostLikedByMe,
    requestDeletePost,
    saveEditPost,
    startEditPost,
    toggleFollowUser,
  } = usePostActions({
    authConfig,
    commentText,
    currentUser,
    currentUserId,
    editCaption,
    followingUsers,
    replyText,
    setCommentText,
    setCommentsSheetPost,
    setConfirmDeletePost,
    setEditCaption,
    setEditingPostId,
    setFollowingUsers,
    setGalleryPost,
    setHeartCommentId,
    setHeartPostId,
    setLikesModalPost,
    setOpenComments,
    setOpenMenuId,
    setPosts,
    setReplyingTo,
    setReplyText,
    showNotice,
  });


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


  useFeedSocket({
    token,
    setPosts,
    setCommentsSheetPost,
    setLikesModalPost,
    setGalleryPost,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetPostId = params.get("post");
    const openTarget = params.get("open");

    if (!targetPostId) return;

    let cancelled = false;

    const focusTargetPost = async () => {
      let targetPost = posts.find((post) => post?._id === targetPostId);

      if (!targetPost) {
        try {
          const res = await API.get(`/api/posts/${targetPostId}`);
          if (cancelled || !res.data?._id) return;

          targetPost = res.data;
          setPosts((prev) => {
            if (prev.some((post) => post?._id === targetPostId)) return prev;
            return [res.data, ...prev];
          });
        } catch (error) {
          logger.error("Target post load failed:", error.response?.data || error);
          showNotice("Post nahi mila ya delete ho chuka hai.");
          return;
        }
      }

      window.setTimeout(() => {
        const element = document.getElementById(`feed-post-${targetPostId}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        element?.classList.add("vybe-target-post");

        window.setTimeout(() => {
          element?.classList.remove("vybe-target-post");
        }, 1800);
      }, 120);

      if (openTarget === "comments" && targetPost) {
        setCommentsSheetPost(targetPost);
      }
    };

    focusTargetPost();

    return () => {
      cancelled = true;
    };
  }, [location.search, posts, setPosts]);

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
      logger.error("Copy failed:", error);
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
      logger.error("Share cancelled or failed:", error);
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



  const createPost = async () => {
    if (postingRef.current || loading) return;

    try {
      if (!caption.trim() && mediaItems.length === 0) return;

      postingRef.current = true;
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

      setPosts((prevPosts) => {
        const exists = prevPosts.some((post) => post._id === newPost.data?._id);
        return exists ? prevPosts : [newPost.data, ...prevPosts];
      });
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
      logger.error(error.response?.data || error);
      setUploadError(error.response?.data?.message || "Could not upload your vybe. Please try again.");
    } finally {
      postingRef.current = false;
      setLoading(false);
      setMediaUploadStage("");
    }
  };

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
      return getUserId(f) === post.user?._id;
    });
  }

  if (activeFlowTab === "Close Circle") {
    return currentUser?.closeCircle?.some((f) => {
      return getUserId(f) === post.user?._id;
    });
  }

  return true;
});

const displayedPosts = flowPosts;

const activeCommentsPost = commentsSheetPost
  ? safePosts.find((post) => post._id === commentsSheetPost._id) || commentsSheetPost
  : null;
// const hasMorePosts = hasMoreFeed;

useEffect(() => {
  if (!loadMoreRef.current || !hasMoreFeed || initialLoading || loadingMoreFeed) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        fetchPosts(feedPage + 1, activeMood);
      }
    },
    { root: null, rootMargin: "260px", threshold: 0.1 }
  );

  observer.observe(loadMoreRef.current);

  return () => observer.disconnect();
}, [hasMoreFeed, initialLoading, loadingMoreFeed, feedPage, fetchPosts, activeMood]);

useEffect(() => {
  fetchPosts(1, activeMood);
}, [activeMood, fetchPosts]);

  const trendingTags = useMemo(
  () =>
    ["#DeepVybes", "#LateNight", "#Chaos", "#CollegeLife", "#RealThoughts", "#Creative"]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4),
  []
);
  return (
    <div className="min-h-screen bg-black text-white px-2.5 sm:px-4 md:px-6 pt-0 sm:pt-3 md:pt-7 pb-28 md:pb-10">
      <ActionNotice
        message={actionNotice}
        onClose={() => setActionNotice("")}
      />
      <div className="w-full max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,590px)_300px] xl:grid-cols-[minmax(0,600px)_320px] gap-8 xl:gap-10 justify-center items-start">
        <div className="w-full max-w-[600px] mx-auto lg:mx-0">
          <FeedHeader
            moodChips={moodChips}
            moodMeta={moodMeta}
            activeMood={activeMood}
            setActiveMood={setActiveMood}
            onDailyDrop={() => navigate("/vybe-drops")}
          />

          <FeedComposer
            composerOpen={composerOpen}
            setComposerOpen={setComposerOpen}
            hasSelectedMedia={hasSelectedMedia}
            caption={caption}
            setCaption={setCaption}
            currentUser={currentUser}
            selectedMood={selectedMood}
            setSelectedMood={setSelectedMood}
            moodPickerOpen={moodPickerOpen}
            setMoodPickerOpen={setMoodPickerOpen}
            composerType={composerType}
            setComposerType={setComposerType}
            moodPickerRef={moodPickerRef}
            captionRef={captionRef}
            createPost={createPost}
            moodChips={moodChips}
            moodMeta={moodMeta}
            isSelectedVideo={isSelectedVideo}
            isSelectedImage={isSelectedImage}
            activePreviewSrc={activePreviewSrc}
            preview={preview}
            uploadError={uploadError}
            mediaItems={mediaItems}
            hasMediaEdits={hasMediaEdits}
            activeMedia={activeMedia}
            getPreviewFrameClass={getPreviewFrameClass}
            removeSelectedMedia={removeSelectedMedia}
            activeMediaIndex={activeMediaIndex}
            loading={loading}
            mediaUploadStage={mediaUploadStage}
            mediaStudioOpen={mediaStudioOpen}
            setMediaStudioOpen={setMediaStudioOpen}
            setMediaEditModalOpen={setMediaEditModalOpen}
            setMediaInputMode={setMediaInputMode}
            mediaInputRef={mediaInputRef}
            handleFileChange={handleFileChange}
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
            mediaInputMode={mediaInputMode}
          />

          <FlowTabs
            flowTabs={flowTabs}
            activeFlowTab={activeFlowTab}
            setActiveFlowTab={setActiveFlowTab}
          />

        {/* POSTS */}
        <div className="space-y-4 sm:space-y-6">
          {initialLoading ? (
            <div className="space-y-4 sm:space-y-6">
              {[1, 2, 3].map((item) => (
                <PostSkeleton key={item} />
            ))}
            </div>
          ) : flowPosts.length === 0 ? (
            <FeedEmptyState
              activeFlowTab={activeFlowTab}
              onExploreForYou={() => setActiveFlowTab("For You")}
            />
          ) : (
            displayedPosts.map((post) => (
              <div key={post._id} id={`feed-post-${post._id}`} className="scroll-mt-24 rounded-[30px] transition-all duration-500">
              <PostCard
                post={post}
                currentUserId={currentUserId}
                openComments={openComments}
                savedPosts={savedPosts}
                heartPostId={heartPostId}
                heartCommentId={heartCommentId}
                loadedMedia={loadedMedia}
                editingPostId={editingPostId}
                editCaption={editCaption}
                setEditCaption={setEditCaption}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                getFeedMediaIndex={getFeedMediaIndex}
                openUserProfile={openUserProfile}
                startEditPost={startEditPost}
                requestDeletePost={requestDeletePost}
                saveEditPost={saveEditPost}
                cancelEditPost={cancelEditPost}
                handlePostLikeWithAnimation={handlePostLikeWithAnimation}
                handleFeedMediaTouchStart={handleFeedMediaTouchStart}
                handleFeedMediaTouchMove={handleFeedMediaTouchMove}
                handleFeedMediaTouchEnd={handleFeedMediaTouchEnd}
                markMediaLoaded={markMediaLoaded}
                slideFeedMedia={slideFeedMedia}
                isPostLikedByMe={isPostLikedByMe}
                setLikesModalPost={setLikesModalPost}
                setCommentsSheetPost={setCommentsSheetPost}
                toggleSavePost={toggleSavePost}
                setOpenComments={setOpenComments}
                commentText={commentText}
                setCommentText={setCommentText}
                addComment={addComment}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                addReply={addReply}
                deleteComment={deleteComment}
                deleteReply={deleteReply}
                handleCommentLikeWithAnimation={handleCommentLikeWithAnimation}
                setSharePost={setSharePost}
              />
              </div>
            ))
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

        <RightSidebar
          currentUser={currentUser}
          currentUserId={currentUserId}
          navigate={navigate}
          suggestedUsers={suggestedUsers}
          isFollowingUser={isFollowingUser}
          openUserProfile={openUserProfile}
          toggleFollowUser={toggleFollowUser}
          trendingTags={trendingTags}
        />

      </div>

      <FeedPageStyles />



      <CommentsSheet
        activeCommentsPost={activeCommentsPost}
        setCommentsSheetPost={setCommentsSheetPost}
        currentUserId={currentUserId}
        openUserProfile={openUserProfile}
        deleteComment={deleteComment}
        addComment={addComment}
        commentText={commentText}
        setCommentText={setCommentText}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        replyText={replyText}
        setReplyText={setReplyText}
        addReply={addReply}
        deleteReply={deleteReply}
        handleCommentLikeWithAnimation={handleCommentLikeWithAnimation}
        heartCommentId={heartCommentId}
      />

      <ConfirmDeleteModal
        post={confirmDeletePost}
        onCancel={() => setConfirmDeletePost(null)}
        onConfirm={deletePost}
      />

      <MediaGallery
        galleryPost={galleryPost}
        activeGalleryMedia={activeGalleryMedia}
        closeMediaGallery={closeMediaGallery}
        galleryIndex={galleryIndex}
        galleryMedia={galleryMedia}
        setSharePost={setSharePost}
        galleryDirection={galleryDirection}
        handleGalleryTouchStart={handleGalleryTouchStart}
        handleGalleryTouchMove={handleGalleryTouchMove}
        handleGalleryTouchEnd={handleGalleryTouchEnd}
        isImageMedia={isImageMedia}
        getMediaUrl={getMediaUrl}
        loadedMedia={loadedMedia}
        markMediaLoaded={markMediaLoaded}
        goToGalleryMedia={goToGalleryMedia}
        formatVybeTime={formatVybeTime}
        setGalleryIndex={setGalleryIndex}
      />


      <MediaEditModal
        open={mediaEditModalOpen}
        activeMedia={activeMedia}
        isSelectedImage={isSelectedImage}
        onClose={() => setMediaEditModalOpen(false)}
        getPreviewFrameClass={getPreviewFrameClass}
        mediaAspect={mediaAspect}
        activePreviewSrc={activePreviewSrc}
        mediaEditTab={mediaEditTab}
        setMediaEditTab={setMediaEditTab}
        mediaAspectOptions={mediaAspectOptions}
        setMediaAspect={setMediaAspect}
        mediaZoom={mediaZoom}
        setMediaZoom={setMediaZoom}
        mediaFilterOptions={mediaFilterOptions}
        mediaFilter={mediaFilter}
        setMediaFilter={setMediaFilter}
        resetMediaEditor={resetMediaEditor}
      />

      <LikesModal
        post={likesModalPost}
        onClose={() => setLikesModalPost(null)}
      />

      <ShareModal
        post={sharePost}
        copiedShare={copiedShare}
        getPostShareUrl={getPostShareUrl}
        copyShareLink={copyShareLink}
        nativeSharePost={nativeSharePost}
        onClose={() => setSharePost(null)}
      />
    </div>
  );
}

export default Feed;