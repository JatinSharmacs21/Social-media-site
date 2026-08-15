const Post = require("../models/Post");
const Notification = require("../models/Notification");
const User = require("../models/User");

const MAX_COMMENT_LENGTH = 300;

const getUserId = (req) => req.user?._id || req.user?.id;

// Returns the ids of authors whose posts the given viewer should NOT see:
// - private Vybe Space authors who haven't accepted this viewer, and
// - anyone blocked in either direction (blocker or blocked).
// Used to keep such posts out of the main feed, search, reels, and
// single-post views.
const getHiddenAuthorIds = async (viewerId) => {
  const hiddenIds = new Set();
  const viewerIdStr = viewerId ? viewerId.toString() : null;

  const privateUsers = await User.find({ isPrivate: true }).select("followers");

  privateUsers.forEach((privateUser) => {
    if (viewerIdStr && privateUser._id.toString() === viewerIdStr) return;

    const isAccepted = viewerIdStr
      ? privateUser.followers.some((id) => id.toString() === viewerIdStr)
      : false;

    if (!isAccepted) hiddenIds.add(privateUser._id.toString());
  });

  if (viewerIdStr) {
    const viewer = await User.findById(viewerIdStr).select("blockedUsers blockedBy");

    if (viewer) {
      (viewer.blockedUsers || []).forEach((id) => hiddenIds.add(id.toString()));
      (viewer.blockedBy || []).forEach((id) => hiddenIds.add(id.toString()));
    }
  }

  return Array.from(hiddenIds);
};

// Ids of everyone blocked in either direction with the viewer (people the
// viewer blocked, plus people who blocked the viewer). Used to scrub their
// likes/comments off posts the viewer can otherwise still see.
const getBlockedIds = async (viewerId) => {
  if (!viewerId) return [];

  const viewer = await User.findById(viewerId).select("blockedUsers blockedBy");
  if (!viewer) return [];

  return [...(viewer.blockedUsers || []), ...(viewer.blockedBy || [])].map((id) =>
    id.toString()
  );
};

// Removes likes/comments (and comment likes/replies) made by blocked-either-way
// users from a post before it's sent to this viewer.
const stripBlockedInteractions = (post, blockedIds) => {
  if (!blockedIds.length) return post;

  const blockedSet = new Set(blockedIds);
  const plain = typeof post.toObject === "function" ? post.toObject() : post;

  const belongsToBlocked = (userRef) => {
    const id = userRef?._id || userRef;
    return id ? blockedSet.has(id.toString()) : false;
  };

  plain.likes = (plain.likes || []).filter((user) => !belongsToBlocked(user));

  plain.comments = (plain.comments || [])
    .filter((comment) => !belongsToBlocked(comment.user))
    .map((comment) => ({
      ...comment,
      likes: (comment.likes || []).filter((user) => !belongsToBlocked(user)),
      replies: (comment.replies || []).filter((reply) => !belongsToBlocked(reply.user)),
    }));

  return plain;
};

const cleanTextInput = (value = "") => value.trim();

const getUtcDateString = (date = new Date()) => date.toISOString().slice(0, 10);

const updateDropStreak = async (userId) => {
  const user = await User.findById(userId).select("dropStreak");
  if (!user) return null;

  const today = getUtcDateString();
  const streak = user.dropStreak || { current: 0, longest: 0, lastReplyDate: null };

  if (streak.lastReplyDate === today) {
    return streak;
  }

  const yesterday = getUtcDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const nextCurrent = streak.lastReplyDate === yesterday ? (streak.current || 0) + 1 : 1;

  const nextStreak = {
    current: nextCurrent,
    longest: Math.max(streak.longest || 0, nextCurrent),
    lastReplyDate: today,
  };

  user.dropStreak = nextStreak;
  await user.save();

  return nextStreak;
};

const getPostKind = (post) => {
  const media = Array.isArray(post?.media) ? post.media : [];
  if (media.some((item) => item?.type === "video")) return "clip";
  if (media.some((item) => item?.type === "image")) return "moment";
  return "thought";
};

const buildNotificationMessage = (senderName, action, post) => {
  const kind = getPostKind(post);

  if (action === "felt") return `${senderName} felt your ${kind}`;
  if (action === "comment") return `${senderName} commented on your ${kind}`;
  if (action === "reply") return `${senderName} replied to your comment`;

  return `${senderName} sent you a signal`;
};

const buildNotificationPostPayload = (post) => {
  if (!post?._id) return null;

  return {
    _id: post._id,
    caption: post.caption || "",
    media: post.media || [],
    postType: post.postType || "normal",
    mood: post.mood || "All",
  };
};

const emitRealtimeNotification = async (req, recipientId, data) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    if (!io || !onlineUsers || !recipientId) return;

    const receiverSockets = onlineUsers.get(recipientId.toString());

if (receiverSockets && receiverSockets.size > 0) {
  receiverSockets.forEach((socketId) => {
    io.to(socketId).emit("new-notification", data);
  });
}
  } catch (error) {
    console.log("Socket notification error:", error.message);
  }
};

const emitPostUpdated = async (req, postId, event = "post-updated") => {
  try {
    const io = req.app.get("io");
    if (!io || !postId) return;

    const updatedPost = await getPopulatedPost(postId);
    if (!updatedPost) return;

    io.emit(event, updatedPost);
  } catch (error) {
    console.log("Post realtime update error:", error.message);
  }
};

const getPopulatedPost = async (postId) => {
  return await Post.findById(postId)
    .populate("user", "name username profilePic")
    .populate("likes", "name username profilePic")
    .populate("comments.user", "name username profilePic")
    .populate("comments.likes", "name username profilePic")
    .populate("comments.replies.user", "name username profilePic");
};

const createPost = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { caption, media, mood } = req.body;

    const post = await Post.create({
      user: userId,
      caption,
      media,
      mood: mood || "All",
      postType: "normal",
    });

    const populatedPost = await getPopulatedPost(post._id);

const io = req.app.get("io");
if (io) {
  io.emit("post-created", populatedPost);
}

res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 20);
    const skip = (page - 1) * limit;

    const allowedMoods = ["All", "Deep", "Funny", "Chaos", "Late Night", "Creative", "College"];
    const requestedMood = typeof req.query.mood === "string" ? req.query.mood.trim() : "All";

    const filter = {
      postType: { $in: ["normal", null] },
    };

    if (requestedMood && requestedMood !== "All" && allowedMoods.includes(requestedMood)) {
      filter.mood = requestedMood;
    }

    const hiddenAuthorIds = await getHiddenAuthorIds(getUserId(req));
    if (hiddenAuthorIds.length) {
      filter.user = { $nin: hiddenAuthorIds };
    }

    const viewerId = getUserId(req);

    const [posts, total, blockedIds] = await Promise.all([
      Post.find(filter)
        .populate("user", "name username profilePic")
        .populate("likes", "name username profilePic")
        .populate("comments.user", "name username profilePic")
        .populate("comments.likes", "name username profilePic")
        .populate("comments.replies.user", "name username profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Post.countDocuments(filter),
      getBlockedIds(viewerId),
    ]);

    const cleanedPosts = posts.map((post) => stripBlockedInteractions(post, blockedIds));

    res.json({
      posts: cleanedPosts,
      page,
      limit,
      total,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const searchPosts = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 80);
    const type = String(req.query.type || "all").trim().toLowerCase();
    const mood = String(req.query.mood || "All").trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 24);

    const allowedMoods = ["All", "Deep", "Funny", "Chaos", "Late Night", "Creative", "College"];

    const filter = {
      postType: { $in: ["normal", null] },
    };

    if (q) {
      const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.caption = { $regex: safeQuery, $options: "i" };
    }

    if (mood && mood !== "All" && allowedMoods.includes(mood)) {
      filter.mood = mood;
    }

    if (type === "clips") {
      filter.media = { $elemMatch: { type: "video" } };
    } else if (type === "moments") {
      filter.media = { $elemMatch: { type: "image" } };
    } else if (type === "thoughts") {
      filter.$or = [{ media: { $exists: false } }, { media: { $size: 0 } }];
    }

    const hiddenAuthorIds = await getHiddenAuthorIds(getUserId(req));
    if (hiddenAuthorIds.length) {
      filter.user = { $nin: hiddenAuthorIds };
    }

    const posts = await Post.find(filter)
      .populate("user", "name username profilePic")
      .populate("likes", "name username profilePic")
      .populate("comments.user", "name username profilePic")
      .sort({ createdAt: -1 })
      .limit(limit);

    const blockedIds = await getBlockedIds(getUserId(req));
    const cleanedPosts = posts.map((post) => stripBlockedInteractions(post, blockedIds));

    res.json({ posts: cleanedPosts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await getPopulatedPost(req.params.postId);

    if (!post || (post.postType && post.postType !== "normal")) {
      return res.status(404).json({ message: "Post not found" });
    }

    const authorId = post.user?._id?.toString();
    const viewerId = getUserId(req)?.toString();

    if (authorId && viewerId !== authorId) {
      const author = await User.findById(authorId).select(
        "isPrivate followers blockedUsers blockedBy"
      );

      const isBlocked =
        viewerId &&
        author &&
        ((author.blockedUsers || []).some((id) => id.toString() === viewerId) ||
          (author.blockedBy || []).some((id) => id.toString() === viewerId));

      if (isBlocked) {
        return res.status(404).json({ message: "Post not found" });
      }

      const isAcceptedFollower =
        viewerId && author?.followers?.some((id) => id.toString() === viewerId);

      if (author?.isPrivate && !isAcceptedFollower) {
        return res.status(403).json({
          message: "This Vybe Space is private. Tune in and wait for acceptance to see this vybe.",
          isPrivate: true,
        });
      }
    }

    res.json(stripBlockedInteractions(post, await getBlockedIds(viewerId)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVybeDrops = async (req, res) => {
  try {
    const drops = await Post.aggregate([
      { $match: { postType: "drop" } },
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
          replyCount: { $size: "$replies" },
          reactionCount: {
            $sum: {
              $map: {
                input: "$replies",
                as: "reply",
                in: { $size: { $ifNull: ["$$reply.vybeReactions", []] } },
              },
            },
          },
          threadReplyCount: {
            $sum: {
              $map: {
                input: "$replies",
                as: "reply",
                in: { $size: { $ifNull: ["$$reply.threadReplies", []] } },
              },
            },
          },
          lastReplyAt: { $max: "$replies.createdAt" },
        },
      },
      {
        $addFields: {
          hoursSinceCreated: {
            $divide: [{ $subtract: [new Date(), "$createdAt"] }, 1000 * 60 * 60],
          },
          hoursSinceLastReply: {
            $cond: [
              "$lastReplyAt",
              {
                $divide: [
                  { $subtract: [new Date(), "$lastReplyAt"] },
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
              { $cond: [{ $lte: ["$hoursSinceLastReply", 24] }, 15, 0] },
              { $cond: [{ $lte: ["$hoursSinceCreated", 48] }, 8, 0] },
            ],
          },
        },
      },
      { $sort: { trendingScore: -1, createdAt: -1 } },
      { $project: { replies: 0 } },
    ]);

    await Post.populate(drops, {
      path: "user",
      select: "name username profilePic",
    });

    res.json(drops);
  } catch (error) {
    console.log("Get Vybe Drops error:", error);
    res.status(500).json({ message: "Failed to fetch Vybe Drops" });
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
    const cleanCaption = cleanTextInput(caption);

    if (!userId) return res.status(401).json({ message: "Not authorized" });

    if (!cleanCaption) {
      return res.status(400).json({ message: "Reply is required" });
    }

    if (cleanCaption.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        message: `Reply cannot exceed ${MAX_COMMENT_LENGTH} characters`,
      });
    }

    const drop = await Post.findById(req.params.dropId);

    if (!drop || drop.postType !== "drop") {
      return res.status(404).json({ message: "Drop not found" });
    }

    const reply = await Post.create({
      user: userId,
      caption: cleanCaption,
      postType: "dropReply",
      drop: drop._id,
      vybeTag: drop.vybeTag,
      isAnonymous: Boolean(isAnonymous),
    });

    const populatedReply = await Post.findById(reply._id).populate(
      "user",
      "name username profilePic"
    );

    const dropStreak = await updateDropStreak(userId);

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

    res.status(201).json({ ...populatedReply.toObject(), dropStreak });
  } catch (error) {
    console.log("Vybe reply error:", error);
    res.status(500).json({
      message: error.message || "Failed to reply to drop",
    });
  }
};

const reactToVybeReply = async (req, res) => {
  try {
    const userId = getUserId(req);
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

    if (!existingReaction || existingReaction.type !== type) {
      reply.vybeReactions.push({ user: userId, type });
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
    const userId = getUserId(req);

    if (!userId) return res.status(401).json({ message: "Not authorized" });

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
    const userId = getUserId(req);
    const { text, isAnonymous } = req.body;
    const cleanText = cleanTextInput(text);

    if (!userId) return res.status(401).json({ message: "Not authorized" });

    if (!cleanText) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }

    if (cleanText.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        message: `Reply cannot exceed ${MAX_COMMENT_LENGTH} characters`,
      });
    }

    const parentReply = await Post.findById(req.params.replyId);

    if (!parentReply || parentReply.postType !== "dropReply") {
      return res.status(404).json({ message: "Parent reply not found" });
    }

    parentReply.threadReplies.push({
      user: userId,
      text: cleanText,
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
    const userId = getUserId(req);

    if (!userId) return res.status(401).json({ message: "Not authorized" });

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

    if (!post) return res.status(404).json({ message: "Post not found" });

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
        const message = buildNotificationMessage(req.user.name || req.user.username || "Someone", "felt", post);
        const notification = await Notification.create({
          recipient: post.user,
          sender: userId,
          type: "like",
          post: post._id,
          message,
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
          post: buildNotificationPostPayload(post),
          message,
          createdAt: notification.createdAt,
          isRead: false,
        });
      }
    }

    await post.save();

    const updatedPost = await getPopulatedPost(post._id);

const io = req.app.get("io");
if (io) {
  io.emit("post-updated", updatedPost);
}

res.json(updatedPost);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const toggleSavePost = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const alreadySaved = user.savedPosts.some(
      (id) => id.toString() === postId.toString()
    );

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId.toString()
      );
    } else {
      user.savedPosts.unshift(postId);
    }

    await user.save();

    res.json({ saved: !alreadySaved, savedPosts: user.savedPosts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await User.findById(userId).select("savedPosts");
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ _id: { $in: user.savedPosts } })
      .populate("user", "name username profilePic")
      .populate("likes", "name username profilePic")
      .populate("comments.user", "name username profilePic")
      .populate("comments.likes", "name username profilePic")
      .populate("comments.replies.user", "name username profilePic");

    const orderedPosts = user.savedPosts
      .map((id) => posts.find((post) => post._id.toString() === id.toString()))
      .filter(Boolean);

    res.json(orderedPosts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const userId = getUserId(req);
    const cleanCaption = cleanTextInput(req.body.caption || "");

    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You can edit only your own post",
      });
    }

    post.caption = cleanCaption;

    if (post.content !== undefined) {
      post.content = cleanCaption;
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

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You can delete only your own post",
      });
    }

    await post.deleteOne();

const io = req.app.get("io");
if (io) {
  io.emit("post-deleted", {
    postId: req.params.postId,
  });
}

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
    const cleanText = cleanTextInput(req.body.text || "");

    if (!cleanText) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    if (cleanText.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        message: `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`,
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({
      user: userId,
      text: cleanText,
    });

    await post.save();

    if (post.user.toString() !== userId.toString()) {
      const message = buildNotificationMessage(req.user.name || req.user.username || "Someone", "comment", post);
      const notification = await Notification.create({
        recipient: post.user,
        sender: userId,
        type: "comment",
        post: post._id,
        message,
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
        post: buildNotificationPostPayload(post),
        message,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    const updatedPost = await getPopulatedPost(post._id);

const io = req.app.get("io");
if (io) {
  io.emit("post-updated", updatedPost);
}

res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const userId = getUserId(req);
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

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

const io = req.app.get("io");
if (io) {
  io.emit("post-updated", updatedPost);
}

res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleCommentLike = async (req, res) => {
  try {
    const userId = getUserId(req);
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

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

const io = req.app.get("io");
if (io) {
  io.emit("post-updated", updatedPost);
}

res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addReply = async (req, res) => {
  try {
    const userId = getUserId(req);
    const cleanText = cleanTextInput(req.body.text || "");

    if (!cleanText) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }

    if (cleanText.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        message: `Reply cannot exceed ${MAX_COMMENT_LENGTH} characters`,
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.replies.push({
      user: userId,
      text: cleanText,
    });

    await post.save();

    if (comment.user.toString() !== userId.toString()) {
      const message = buildNotificationMessage(req.user.name || req.user.username || "Someone", "reply", post);
      const notification = await Notification.create({
        recipient: comment.user,
        sender: userId,
        type: "reply",
        post: post._id,
        message,
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
        post: buildNotificationPostPayload(post),
        message,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    const updatedPost = await getPopulatedPost(post._id);

const io = req.app.get("io");
if (io) {
  io.emit("post-updated", updatedPost);
}

res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReply = async (req, res) => {
  try {
    const userId = getUserId(req);
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const reply = comment.replies.id(req.params.replyId);

    if (!reply) return res.status(404).json({ message: "Reply not found" });

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

const io = req.app.get("io");
if (io) {
  io.emit("post-updated", updatedPost);
}

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
      .populate("user", "name username profilePic")
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
    const targetUserId = req.params.userId;
    const viewerId = getUserId(req);

    const targetUser = await User.findById(targetUserId).select(
      "isPrivate followers blockedUsers blockedBy"
    );
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const isOwner = viewerId && viewerId.toString() === targetUserId.toString();

    const theyBlockedMe =
      viewerId &&
      !isOwner &&
      (targetUser.blockedUsers || []).some((id) => id.toString() === viewerId.toString());

    if (theyBlockedMe) {
      return res.status(404).json({ message: "User not found" });
    }

    const iBlockedThem =
      viewerId &&
      !isOwner &&
      (targetUser.blockedBy || []).some((id) => id.toString() === viewerId.toString());

    if (iBlockedThem) {
      return res.json([]);
    }

    const isAcceptedFollower = viewerId
      ? targetUser.followers.some((id) => id.toString() === viewerId.toString())
      : false;

    if (targetUser.isPrivate && !isOwner && !isAcceptedFollower) {
      return res.status(403).json({
        message: "This Vybe Space is private. Tune in and wait for acceptance to see their vybes.",
        isPrivate: true,
      });
    }

    const posts = await Post.find({
      user: req.params.userId,
      postType: { $in: ["normal", null] },
    })
      .populate("user", "name username profilePic")
      .populate("likes", "name username profilePic")
      .populate("comments.user", "name username profilePic")
      .populate("comments.likes", "name username profilePic")
      .populate("comments.replies.user", "name username profilePic")
      .sort({ createdAt: -1 });

    const blockedIds = await getBlockedIds(viewerId);
    const cleanedPosts = posts.map((post) => stripBlockedInteractions(post, blockedIds));

    res.json(cleanedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  searchPosts,
  getPostById,
  toggleLikePost,
  toggleSavePost,
  getSavedPosts,
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