const Post = require("../models/Post");
const Notification = require("../models/Notification");

const getUserId = (req) => req.user?._id || req.user?.id;

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

const getPopulatedPost = async (postId) => {
  return await Post.findById(postId)
    .populate("user", "name username email profilePic")
    .populate("likes", "name username profilePic")
    .populate("comments.user", "name username profilePic")
    .populate("comments.likes", "name username profilePic")
    .populate("comments.replies.user", "name username profilePic");
};

const createPost = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { caption, media } = req.body;

    const post = await Post.create({
      user: userId,
      caption,
      media,
      postType: "normal",
    });

    const populatedPost = await getPopulatedPost(post._id);
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      postType: { $in: ["normal", null] },
    })
      .populate("user", "name username email profilePic")
      .populate("likes", "name username profilePic")
      .populate("comments.user", "name username profilePic")
      .populate("comments.likes", "name username profilePic")
      .populate("comments.replies.user", "name username profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVybeDrops = async (req, res) => {
  try {
    const drops = await Post.aggregate([
      {
        $match: {
          postType: "drop",
        },
      },

      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "drop",
          as: "replies",
        },
      },

      {
        $addFields: {
          replyCount: {
            $size: "$replies",
          },

          reactionCount: {
            $sum: {
              $map: {
                input: "$replies",
                as: "reply",
                in: {
                  $size: {
                    $ifNull: ["$$reply.vybeReactions", []],
                  },
                },
              },
            },
          },

          threadReplyCount: {
            $sum: {
              $map: {
                input: "$replies",
                as: "reply",
                in: {
                  $size: {
                    $ifNull: ["$$reply.threadReplies", []],
                  },
                },
              },
            },
          },

          lastReplyAt: {
            $max: "$replies.createdAt",
          },
        },
      },

      {
        $addFields: {
          hoursSinceCreated: {
            $divide: [
              {
                $subtract: [new Date(), "$createdAt"],
              },
              1000 * 60 * 60,
            ],
          },

          hoursSinceLastReply: {
            $cond: [
              "$lastReplyAt",
              {
                $divide: [
                  {
                    $subtract: [new Date(), "$lastReplyAt"],
                  },
                  1000 * 60 * 60,
                ],
              },
              999,
            ],
          },
        },
      },

      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ["$replyCount", 5] },
              { $multiply: ["$reactionCount", 2] },
              { $multiply: ["$threadReplyCount", 4] },
              {
                $cond: [
                  { $lte: ["$hoursSinceLastReply", 24] },
                  15,
                  0,
                ],
              },
              {
                $cond: [
                  { $lte: ["$hoursSinceCreated", 48] },
                  8,
                  0,
                ],
              },
            ],
          },
        },
      },

      {
        $sort: {
          trendingScore: -1,
          createdAt: -1,
        },
      },

      {
        $project: {
          replies: 0,
        },
      },
    ]);

    await Post.populate(drops, {
      path: "user",
      select: "name username profilePic",
    });

    res.json(drops);
  } catch (error) {
    console.log("Get Vybe Drops error:", error);
    res.status(500).json({
      message: "Failed to fetch Vybe Drops",
    });
  }
};

const getDropReplies = async (req, res) => {
  try {
    const replies = await Post.find({
      postType: "dropReply",
      drop: req.params.dropId,
    })
      .populate("user", "name username profilePic")
      .populate("threadReplies.user", "name username profilePic")
      .sort({ createdAt: -1 });

    res.json(replies);
  } catch (error) {
    console.log("Get Drop Replies error:", error);
    res.status(500).json({ message: "Failed to fetch replies" });
  }
};

const replyToVybeDrop = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { caption, isAnonymous } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!caption || !caption.trim()) {
      return res.status(400).json({ message: "Reply is required" });
    }

    const drop = await Post.findById(req.params.dropId);

    if (!drop || drop.postType !== "drop") {
      return res.status(404).json({ message: "Drop not found" });
    }

    const reply = await Post.create({
      user: userId,
      caption: caption.trim(),
      postType: "dropReply",
      drop: drop._id,
      vybeTag: drop.vybeTag,
      isAnonymous: Boolean(isAnonymous),
    });

    const populatedReply = await Post.findById(reply._id).populate(
      "user",
      "name username profilePic"
    );

    const io = req.app.get("io");

    if (io) {
      io.to(`drop-${drop._id}`).emit("drop-reply-created", {
        dropId: drop._id.toString(),
        reply: populatedReply,
      });

      io.emit("drop-count-updated", {
        dropId: drop._id.toString(),
        type: "reply",
      });
    }

    res.status(201).json(populatedReply);
  } catch (error) {
    console.log("Vybe reply error:", error);
    res.status(500).json({
      message: error.message || "Failed to reply to drop",
    });
  }
};

const reactToVybeReply = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { type } = req.body;

    const allowed = ["felt", "deep", "funny", "chaos", "relatable"];

    if (!userId) return res.status(401).json({ message: "Not authorized" });
    if (!allowed.includes(type)) {
      return res.status(400).json({ message: "Invalid reaction" });
    }

    const reply = await Post.findById(req.params.replyId);

    if (!reply || reply.postType !== "dropReply") {
      return res.status(404).json({ message: "Reply not found" });
    }

    const existingReaction = (reply.vybeReactions || []).find(
      (r) => r.user.toString() === userId.toString()
    );

    reply.vybeReactions = (reply.vybeReactions || []).filter(
      (r) => r.user.toString() !== userId.toString()
    );

    // same reaction par click kare to remove, different par click kare to replace
    if (!existingReaction || existingReaction.type !== type) {
      reply.vybeReactions.push({
        user: userId,
        type,
      });
    }

    await reply.save();

    const updatedReply = await Post.findById(reply._id)
      .populate("user", "name username profilePic")
      .populate("threadReplies.user", "name username profilePic");

    const io = req.app.get("io");

    if (io) {
      io.to(`drop-${reply.drop}`).emit("drop-reply-reacted", {
        dropId: reply.drop.toString(),
        reply: updatedReply,
      });
    }

    res.json(updatedReply);
  } catch (error) {
    console.log("Vybe reaction error:", error);
    res.status(500).json({
      message: error.message || "Failed to react",
    });
  }
};

const deleteVybeDropReply = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const reply = await Post.findById(req.params.replyId);

    if (!reply || reply.postType !== "dropReply") {
      return res.status(404).json({ message: "Reply not found" });
    }

    if (reply.isSeeded) {
      return res.status(403).json({
        message: "Seeded replies cannot be deleted by users",
      });
    }

    const isOwner = reply.user.toString() === userId.toString();

    if (!isOwner) {
      return res.status(403).json({
        message: "You can delete only your own reply",
      });
    }

    const dropId = reply.drop?.toString();

    await reply.deleteOne();

    const io = req.app.get("io");

    if (io && dropId) {
      io.to(`drop-${dropId}`).emit("drop-reply-deleted", {
        dropId,
        replyId: req.params.replyId,
      });

      io.emit("drop-count-updated", {
        dropId,
        type: "reply-delete",
      });
    }

    res.json({
      message: "Reply deleted successfully",
      replyId: req.params.replyId,
      dropId,
    });
  } catch (error) {
    console.log("Delete Vybe reply error:", error);
    res.status(500).json({
      message: error.message || "Failed to delete reply",
    });
  }
};

const addNestedVybeReply = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { text, isAnonymous } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }

    const parentReply = await Post.findById(req.params.replyId);

    if (!parentReply || parentReply.postType !== "dropReply") {
      return res.status(404).json({ message: "Parent reply not found" });
    }

    parentReply.threadReplies.push({
      user: userId,
      text: text.trim(),
      isAnonymous: Boolean(isAnonymous),
      parentReply: parentReply._id,
      path: `${parentReply._id}`,
    });

    await parentReply.save();

    const updatedReply = await Post.findById(parentReply._id)
      .populate("user", "name username profilePic")
      .populate("threadReplies.user", "name username profilePic");

    const io = req.app.get("io");

    if (io) {
      io.to(`drop-${parentReply.drop}`).emit("drop-thread-reply-created", {
        dropId: parentReply.drop.toString(),
        reply: updatedReply,
      });
    }

    res.status(201).json(updatedReply);
  } catch (error) {
    console.log("Nested Vybe reply error:", error);
    res.status(500).json({
      message: error.message || "Failed to reply",
    });
  }
};

const deleteNestedVybeReply = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const parentReply = await Post.findById(req.params.replyId);

    if (!parentReply || parentReply.postType !== "dropReply") {
      return res.status(404).json({ message: "Parent reply not found" });
    }

    const nested = parentReply.threadReplies.id(req.params.threadReplyId);

    if (!nested) {
      return res.status(404).json({ message: "Thread reply not found" });
    }

    const isOwner = nested.user.toString() === userId.toString();
    const isParentOwner = parentReply.user.toString() === userId.toString();

    if (!isOwner && !isParentOwner) {
      return res.status(403).json({ message: "You cannot delete this reply" });
    }

    parentReply.threadReplies = parentReply.threadReplies.filter(
      (item) => item._id.toString() !== req.params.threadReplyId
    );

    await parentReply.save();

    const updatedReply = await Post.findById(parentReply._id)
      .populate("user", "name username profilePic")
      .populate("threadReplies.user", "name username profilePic");

    const io = req.app.get("io");

    if (io) {
      io.to(`drop-${parentReply.drop}`).emit("drop-thread-reply-deleted", {
        dropId: parentReply.drop.toString(),
        reply: updatedReply,
      });
    }

    res.json(updatedReply);
  } catch (error) {
    console.log("Delete nested reply error:", error);
    res.status(500).json({
      message: error.message || "Failed to delete reply",
    });
  }
};

const toggleLikePost = async (req, res) => {
  try {
    const userId = getUserId(req);
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userLiked = post.likes.some(
      (like) => like.toString() === userId.toString()
    );

    if (userLiked) {
      post.likes = post.likes.filter(
        (like) => like.toString() !== userId.toString()
      );
    } else {
      post.likes.push(userId);

      if (post.user.toString() !== userId.toString()) {
        const notification = await Notification.create({
          recipient: post.user,
          sender: userId,
          type: "like",
          post: post._id,
          message: "liked your post",
        });

        await emitRealtimeNotification(req, post.user, {
          _id: notification._id,
          recipient: post.user,
          sender: {
            _id: userId,
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
    res.status(500).json({ message: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { caption } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== userId.toString()) {
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
    res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const userId = getUserId(req);
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== userId.toString()) {
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
    res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: userId,
      text: text.trim(),
    });

    await post.save();

    if (post.user.toString() !== userId.toString()) {
      const notification = await Notification.create({
        recipient: post.user,
        sender: userId,
        type: "comment",
        post: post._id,
        message: "commented on your post",
      });

      await emitRealtimeNotification(req, post.user, {
        _id: notification._id,
        recipient: post.user,
        sender: {
          _id: userId,
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
    res.status(500).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const userId = getUserId(req);
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isCommentOwner = comment.user.toString() === userId.toString();
    const isPostOwner = post.user.toString() === userId.toString();

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
    res.status(500).json({ message: error.message });
  }
};

const toggleCommentLike = async (req, res) => {
  try {
    const userId = getUserId(req);
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const alreadyLiked = comment.likes.some(
      (like) => like.toString() === userId.toString()
    );

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        (like) => like.toString() !== userId.toString()
      );
    } else {
      comment.likes.push(userId);
    }

    await post.save();

    const updatedPost = await getPopulatedPost(post._id);
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addReply = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Reply cannot be empty",
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.replies.push({
      user: userId,
      text: text.trim(),
    });

    await post.save();

    if (comment.user.toString() !== userId.toString()) {
      const notification = await Notification.create({
        recipient: comment.user,
        sender: userId,
        type: "reply",
        post: post._id,
        message: "replied to your comment",
      });

      await emitRealtimeNotification(req, comment.user, {
        _id: notification._id,
        recipient: comment.user,
        sender: {
          _id: userId,
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
    res.status(500).json({ message: error.message });
  }
};

const deleteReply = async (req, res) => {
  try {
    const userId = getUserId(req);
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const reply = comment.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    const isReplyOwner = reply.user.toString() === userId.toString();
    const isPostOwner = post.user.toString() === userId.toString();

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
    res.status(500).json({ message: error.message });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const userId = getUserId(req);

    const posts = await Post.find({
      user: userId,
      postType: { $in: ["normal", null] },
    })
      .populate("user", "name username email profilePic")
      .populate("likes", "name username profilePic")
      .populate("comments.user", "name username profilePic")
      .populate("comments.likes", "name username profilePic")
      .populate("comments.replies.user", "name username profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.params.userId,
      postType: { $in: ["normal", null] },
    })
      .populate("user", "name username email profilePic")
      .populate("likes", "name username profilePic")
      .populate("comments.user", "name username profilePic")
      .populate("comments.likes", "name username profilePic")
      .populate("comments.replies.user", "name username profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  getVybeDrops,
  getDropReplies,
  replyToVybeDrop,
  reactToVybeReply,
  deleteVybeDropReply,
  addNestedVybeReply,
  deleteNestedVybeReply,
};