export const isPostLikedByUser = (post, userId) => {
  return post?.likes?.some((like) => {
    if (typeof like === "string") return like === userId;
    return like?._id === userId;
  });
};

export const isCommentLikedByUser = (comment, userId) => {
  return comment?.likes?.some((like) => {
    if (typeof like === "string") return like === userId;
    return like?._id === userId;
  });
};

export const isUserFollowing = ({ user, userId, followingMap = {} }) => {
  if (!user?._id) return false;

  if (followingMap[user._id] !== undefined) {
    return followingMap[user._id];
  }

  return user.followers?.some((follower) => {
    if (typeof follower === "string") return follower === userId;
    return follower?._id === userId;
  });
};

export const getReplyKey = (postId, commentId) => {
  return `${postId}-${commentId}`;
};

export const getPostText = (post) => {
  return post?.caption || post?.content || "";
};

export const getUserId = (user) => {
  if (!user) return "";
  return typeof user === "string" ? user : user?._id;
};