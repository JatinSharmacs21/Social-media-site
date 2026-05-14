const Post = require("../models/Post");

const Notification = require("../models/Notification");

const emitRealtimeNotification = async (req, recipientId, data) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    if (!io || !onlineUsers || !recipientId) return;

    const receiverSocketId = onlineUsers.get(recipientId.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("new-notification", data);
    }
  } catch (error) {
    console.log("Socket notification error:", error.message);
  }
};

// helper: updated populated post return karne ke liye
const getPopulatedPost = async (postId) => {
  return await Post.findById(postId)
    .populate("user", "name email profilePic")
    .populate("likes", "name profilePic")
    .populate("comments.user", "name profilePic")
    .populate("comments.likes", "name profilePic")
    .populate("comments.replies.user", "name profilePic");
};

// CREATE POST
const createPost = async (req, res) => {
  try {
    const { caption, media } = req.body;

    const post = await Post.create({
      user: req.user.id,
      caption,
      media,
    });

    const populatedPost = await getPopulatedPost(post._id);

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL POSTS
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email profilePic")
      .populate("likes", "name profilePic")
      .populate("comments.user", "name profilePic")
      .populate("comments.likes", "name profilePic")
      .populate("comments.replies.user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// LIKE / UNLIKE POST
const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const userLiked = post.likes.some(
      (like) => like.toString() === req.user.id.toString()
    );

    if (userLiked) {
      post.likes = post.likes.filter(
        (like) => like.toString() !== req.user.id.toString()
      );
    } else {
  post.likes.push(req.user.id);

  if (post.user.toString() !== req.user.id.toString()) {
    const notification = await Notification.create({
      recipient: post.user,
      sender: req.user.id,
      type: "like",
      post: post._id,
      message: "liked your post",
    });

    await emitRealtimeNotification(req, post.user, {
      _id: notification._id,
      recipient: post.user,
      sender: {
        _id: req.user._id || req.user.id,
        name: req.user.name,
        username: req.user.username,
        profilePic: req.user.profilePic,
      },
      type: "like",
      post: post._id,
      message: `${req.user.name || "Someone"} liked your post`,
      createdAt: notification.createdAt,
      isRead: false,
    });
  }
}

    await post.save();

    const updatedPost = await getPopulatedPost(post._id);

    res.json(updatedPost);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE POST CAPTION
const updatePost = async (req, res) => {
  try {
    const { caption } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "You can edit only your own post",
      });
    }

    post.caption = caption;

    if (post.content !== undefined) {
      post.content = caption;
    }

    await post.save();

    const updatedPost = await getPopulatedPost(post._id);

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE POST
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "You can delete only your own post",
      });
    }

    await post.deleteOne();

    res.json({
      message: "Post deleted successfully",
      postId: req.params.postId,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ADD COMMENT
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    post.comments.push({
      user: req.user.id,
      text: text.trim(),
    });

    await post.save();
    if (post.user.toString() !== req.user.id.toString()) {
  const notification = await Notification.create({
    recipient: post.user,
    sender: req.user.id,
    type: "comment",
    post: post._id,
    message: "commented on your post",
  });

  await emitRealtimeNotification(req, post.user, {
    _id: notification._id,
    recipient: post.user,
    sender: {
      _id: req.user._id || req.user.id,
      name: req.user.name,
      username: req.user.username,
      profilePic: req.user.profilePic,
    },
    type: "comment",
    post: post._id,
    message: `${req.user.name || "Someone"} commented on your post`,
    createdAt: notification.createdAt,
    isRead: false,
  });
}

    const updatedPost = await getPopulatedPost(post._id);

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE COMMENT
const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const isCommentOwner =
      comment.user.toString() === req.user.id.toString();

    const isPostOwner =
      post.user.toString() === req.user.id.toString();

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({
        message: "You cannot delete this comment",
      });
    }

    post.comments = post.comments.filter(
      (c) => c._id.toString() !== req.params.commentId
    );

    await post.save();

    const updatedPost = await getPopulatedPost(post._id);

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// LIKE / UNLIKE COMMENT
const toggleCommentLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const alreadyLiked = comment.likes.some(
      (like) => like.toString() === req.user.id.toString()
    );

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        (like) => like.toString() !== req.user.id.toString()
      );
    } else {
      comment.likes.push(req.user.id);
    }

    await post.save();

    const updatedPost = await getPopulatedPost(post._id);

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ADD REPLY
const addReply = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Reply cannot be empty",
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    comment.replies.push({
      user: req.user.id,
      text: text.trim(),
    });

    await post.save();
    if (comment.user.toString() !== req.user.id.toString()) {
  const notification = await Notification.create({
    recipient: comment.user,
    sender: req.user.id,
    type: "reply",
    post: post._id,
    message: "replied to your comment",
  });

  await emitRealtimeNotification(req, comment.user, {
    _id: notification._id,
    recipient: comment.user,
    sender: {
      _id: req.user._id || req.user.id,
      name: req.user.name,
      username: req.user.username,
      profilePic: req.user.profilePic,
    },
    type: "reply",
    post: post._id,
    message: `${req.user.name || "Someone"} replied to your comment`,
    createdAt: notification.createdAt,
    isRead: false,
  });
}

    const updatedPost = await getPopulatedPost(post._id);

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE REPLY
const deleteReply = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const reply = comment.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({
        message: "Reply not found",
      });
    }

    const isReplyOwner =
      reply.user.toString() === req.user.id.toString();

    const isPostOwner =
      post.user.toString() === req.user.id.toString();

    if (!isReplyOwner && !isPostOwner) {
      return res.status(403).json({
        message: "You cannot delete this reply",
      });
    }

    comment.replies = comment.replies.filter(
      (r) => r._id.toString() !== req.params.replyId
    );

    await post.save();

    const updatedPost = await getPopulatedPost(post._id);

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET MY POSTS
const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.user.id,
    })
      .populate("user", "name email profilePic")
      .populate("likes", "name profilePic")
      .populate("comments.user", "name profilePic")
      .populate("comments.likes", "name profilePic")
      .populate("comments.replies.user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET USER POSTS
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.params.userId,
    })
      .populate("user", "name email profilePic")
      .populate("likes", "name profilePic")
      .populate("comments.user", "name profilePic")
      .populate("comments.likes", "name profilePic")
      .populate("comments.replies.user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  toggleLikePost,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  toggleCommentLike,
  addReply,
  deleteReply,
  getMyPosts,
  getUserPosts,
};