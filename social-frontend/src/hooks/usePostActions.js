import API from "../services/api";
import {
  isPostLikedByUser,
  isCommentLikedByUser,
  isUserFollowing,
  getReplyKey,
  getPostText,
} from "../utils/postUtils";

function usePostActions({
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
}) {
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

  const isPostLikedByMe = (post) => isPostLikedByUser(post, currentUserId);

  const isFollowingUser = (user) =>
    isUserFollowing({
      user,
      userId: currentUserId,
      followingMap: followingUsers,
    });

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

        const alreadyLiked = isPostLikedByUser(post, currentUserId);

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

            const alreadyLiked = isCommentLikedByUser(comment, currentUserId);

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
    const key = getReplyKey(postId, commentId);
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
    setEditCaption(getPostText(post));
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

  return {
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
    updatePostEverywhere,
  };
}

export default usePostActions;
