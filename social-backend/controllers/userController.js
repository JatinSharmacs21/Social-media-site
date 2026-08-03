const User = require("../models/User");
const Notification = require("../models/Notification");
const TuneRequest = require("../models/TuneRequest");

const emitRealtimeNotification = async (req, recipientId, data) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    if (!io || !onlineUsers || !recipientId) return;

    const receiverSockets = onlineUsers.get(recipientId.toString());

    if (receiverSockets && receiverSockets.size) {
      receiverSockets.forEach((socketId) => {
        io.to(socketId).emit("new-notification", data);
      });
    }
  } catch (error) {
    console.log("Socket notification error:", error.message);
  }
};

  const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const publicUserFields = "name username profilePic bio followers following createdAt isPrivate";
const populatedUserFields = "name username profilePic bio";

const normalizeUsername = (username = "") =>
  username.toString().trim().toLowerCase();

const validateUsername = (username) => /^[a-z0-9_]{3,20}$/.test(username);

const getViewerId = (req) => {
  const id = req.user?._id || req.user?.id;
  return id ? id.toString() : null;
};

// Given a user document (with blockedUsers + blockedBy selected/populated)
// and another user's id, tells us if the two have blocked each other in
// either direction. Works with just one loaded document because we keep
// blockedBy as a synced reverse-index of the other side's blockedUsers.
const isBlockedEitherWay = (user, otherId) => {
  if (!user || !otherId) return false;
  const otherIdStr = otherId.toString();

  const blocked = (user.blockedUsers || []).some((id) => id.toString() === otherIdStr);
  const blockedByOther = (user.blockedBy || []).some((id) => id.toString() === otherIdStr);

  return blocked || blockedByOther;
};

// Shape returned for a private Vybe Space when the viewer hasn't been
// accepted yet — only the bare minimum needed to show a locked profile card.
const buildLockedProfileView = async (user, viewerId) => {
  let hasPendingRequest = false;

  if (viewerId) {
    const pending = await TuneRequest.findOne({
      sender: viewerId,
      recipient: user._id,
      status: "pending",
    });
    hasPendingRequest = !!pending;
  }

  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    profilePic: user.profilePic,
    bio: user.bio,
    isPrivate: true,
    isLocked: true,
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    followers: [],
    following: [],
    isFollowing: false,
    hasPendingRequest,
    createdAt: user.createdAt,
  };
};

// GET MY PROFILE
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("followers", populatedUserFields)
      .populate("following", populatedUserFields);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE MY PROFILE
const updateMyProfile = async (req, res) => {
  try {
    const { name, bio, profilePic, isPrivate } = req.body;
    const incomingUsername = req.body.username;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name.toString().trim().slice(0, 40);
    if (bio !== undefined) user.bio = bio.toString().trim().slice(0, 160);
    if (profilePic !== undefined) user.profilePic = profilePic;
    if (isPrivate !== undefined) user.isPrivate = Boolean(isPrivate);

    if (incomingUsername !== undefined) {
      const username = normalizeUsername(incomingUsername);

      if (!validateUsername(username)) {
        return res.status(400).json({
          message:
            "Username must be 3-20 characters and can contain only lowercase letters, numbers and underscore",
        });
      }

      const existingUser = await User.findOne({
        username,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }

      user.username = username;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("followers", populatedUserFields)
      .populate("following", populatedUserFields);

    res.json(updatedUser);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(409).json({ message: "Username already taken" });
    }

    res.status(500).json({ message: error.message });
  }
};

// GET USER PROFILE BY ID OR USERNAME
const getUserProfile = async (req, res) => {
  try {
    const identifier = (req.params.identifier || req.params.id || "").trim();

    if (!identifier) {
      return res.status(400).json({ message: "Profile identifier is required" });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    const user = await User.findOne(
      isObjectId
        ? { _id: identifier }
        : { username: normalizeUsername(identifier.replace(/^@/, "")) }
    )
      .select("-password")
      .populate("followers", populatedUserFields)
      .populate("following", populatedUserFields);

    if (!user) return res.status(404).json({ message: "User not found" });

    const viewerId = getViewerId(req);
    const isOwner = viewerId && viewerId === user._id.toString();

    const theyBlockedMe = viewerId
      ? (user.blockedUsers || []).some((id) => id.toString() === viewerId)
      : false;

    if (!isOwner && theyBlockedMe) {
      // Pretend the account doesn't exist rather than revealing a block.
      return res.status(404).json({ message: "User not found" });
    }

    const iBlockedThem = viewerId
      ? (user.blockedBy || []).some((id) => id.toString() === viewerId)
      : false;

    const isFollowing = viewerId
      ? user.followers.some((follower) => follower._id.toString() === viewerId)
      : false;

    if (!isOwner && iBlockedThem) {
      const fullProfile = user.toObject();
      return res.json({
        ...fullProfile,
        isLocked: false,
        isFollowing: false,
        hasPendingRequest: false,
        isBlockedByMe: true,
      });
    }

    if (!isOwner && user.isPrivate && !isFollowing) {
      const lockedView = await buildLockedProfileView(user, viewerId);
      return res.json({ ...lockedView, isBlockedByMe: false });
    }

    const fullProfile = user.toObject();
    res.json({
      ...fullProfile,
      isLocked: false,
      isFollowing,
      hasPendingRequest: false,
      isBlockedByMe: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEARCH USERS BY NAME OR USERNAME
const searchUsers = async (req, res) => {
  try {
    const viewerId = getViewerId(req);
    let excludeIds = [];

    if (viewerId) {
      const viewer = await User.findById(viewerId).select("blockedUsers blockedBy");
      if (viewer) {
        excludeIds = [...(viewer.blockedUsers || []), ...(viewer.blockedBy || [])].map((id) =>
          id.toString()
        );
      }
    }

    const q = String(req.query.q || req.query.name || "").trim().slice(0, 40);

    if (!q) {
      const suggestedUsers = await User.find({
        ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}),
      })
        .select(publicUserFields)
        .sort({ createdAt: -1 })
        .limit(12);

      return res.json(suggestedUsers);
    }

    const safeQuery = escapeRegex(q);

    const users = await User.find({
      $or: [
        { name: { $regex: safeQuery, $options: "i" } },
        { username: { $regex: safeQuery, $options: "i" } },
      ],
      ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}),
    })
      .select(publicUserFields)
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: error.message });
  }
};

// FOLLOW / UNFOLLOW / TUNE-IN REQUEST
// Public Vybe Space -> tunes in immediately (existing behaviour).
// Private Vybe Space -> sends a tune-in request that must be accepted
// before the follow relationship, full profile, and whispers unlock.
const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isBlockedEitherWay(userToFollow, currentUserId) || isBlockedEitherWay(currentUser, targetUserId)) {
      return res.status(403).json({ message: "You can't tune in with this Vybe Space" });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId
    );

    // Already tuned in -> untune (works the same for public and private spaces).
    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );

      userToFollow.followers = userToFollow.followers.filter(
        (id) => id.toString() !== currentUserId
      );

      await currentUser.save();
      await userToFollow.save();

      const updatedUser = await User.findById(targetUserId)
        .select("-password")
        .populate("followers", populatedUserFields)
        .populate("following", populatedUserFields);

      return res.json({
        success: true,
        following: false,
        requested: false,
        user: updatedUser,
      });
    }

    // Private Vybe Space and not yet an accepted follower -> request flow.
    if (userToFollow.isPrivate) {
      const existingRequest = await TuneRequest.findOne({
        sender: currentUserId,
        recipient: targetUserId,
        status: "pending",
      });

      // Tapping again while a request is pending cancels it.
      if (existingRequest) {
        await TuneRequest.deleteOne({ _id: existingRequest._id });

        const updatedUser = await User.findById(targetUserId)
          .select("-password")
          .populate("followers", populatedUserFields)
          .populate("following", populatedUserFields);

        return res.json({
          success: true,
          following: false,
          requested: false,
          user: updatedUser,
          message: "Tune-in request cancelled",
        });
      }

      const request = await TuneRequest.findOneAndUpdate(
        { sender: currentUserId, recipient: targetUserId },
        { sender: currentUserId, recipient: targetUserId, status: "pending" },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const notification = await Notification.create({
        recipient: targetUserId,
        sender: currentUserId,
        type: "tune_request",
        relatedId: request._id,
        message: "wants to tune into your Vybe Space",
      });

      await emitRealtimeNotification(req, targetUserId, {
        _id: notification._id,
        recipient: targetUserId,
        sender: {
          _id: currentUser._id,
          name: currentUser.name,
          username: currentUser.username,
          profilePic: currentUser.profilePic,
        },
        type: "tune_request",
        relatedId: request._id,
        message: `${currentUser.name || "Someone"} wants to tune into your Vybe Space`,
        createdAt: notification.createdAt,
        isRead: false,
      });

      const updatedUser = await User.findById(targetUserId)
        .select("-password")
        .populate("followers", populatedUserFields)
        .populate("following", populatedUserFields);

      return res.json({
        success: true,
        following: false,
        requested: true,
        user: updatedUser,
        message: "Tune-in request sent",
      });
    }

    // Public Vybe Space -> tune in right away.
    currentUser.following.push(targetUserId);
    userToFollow.followers.push(currentUserId);

    const notification = await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: "follow",
      message: "started following you",
    });

    await emitRealtimeNotification(req, targetUserId, {
      _id: notification._id,
      recipient: targetUserId,
      sender: {
        _id: currentUser._id,
        name: currentUser.name,
        username: currentUser.username,
        profilePic: currentUser.profilePic,
      },
      type: "follow",
      message: `${currentUser.name || "Someone"} started following you`,
      createdAt: notification.createdAt,
      isRead: false,
    });

    await currentUser.save();
    await userToFollow.save();

    const updatedUser = await User.findById(targetUserId)
      .select("-password")
      .populate("followers", populatedUserFields)
      .populate("following", populatedUserFields);

    res.json({ success: true, following: true, requested: false, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET INCOMING PENDING TUNE-IN REQUESTS (for the logged-in user)
const getTuneRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    const requests = await TuneRequest.find({
      recipient: currentUserId,
      status: "pending",
    })
      .populate("sender", populatedUserFields)
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET IDS OF ACCOUNTS I'VE SENT A PENDING TUNE-IN REQUEST TO
const getSentTuneRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    const requests = await TuneRequest.find({
      sender: currentUserId,
      status: "pending",
    }).select("recipient");

    res.json(requests.map((request) => request.recipient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ACCEPT / DECLINE A TUNE-IN REQUEST
const respondToTuneRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { requestId } = req.params;
    const action = String(req.body.action || "").toLowerCase();

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "Action must be accept or decline" });
    }

    const request = await TuneRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.recipient.toString() !== currentUserId) {
      return res.status(403).json({ message: "You cannot respond to this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "This request has already been handled" });
    }

    if (action === "decline") {
      request.status = "declined";
      await request.save();
      return res.json({ success: true, status: "declined" });
    }

    request.status = "accepted";
    await request.save();

    const [sender, recipient] = await Promise.all([
      User.findById(request.sender),
      User.findById(currentUserId),
    ]);

    if (!sender || !recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!sender.following.some((id) => id.toString() === recipient._id.toString())) {
      sender.following.push(recipient._id);
    }

    if (!recipient.followers.some((id) => id.toString() === sender._id.toString())) {
      recipient.followers.push(sender._id);
    }

    await sender.save();
    await recipient.save();

    const notification = await Notification.create({
      recipient: sender._id,
      sender: recipient._id,
      type: "tune_accept",
      message: "accepted your tune-in request",
    });

    await emitRealtimeNotification(req, sender._id, {
      _id: notification._id,
      recipient: sender._id,
      sender: {
        _id: recipient._id,
        name: recipient.name,
        username: recipient.username,
        profilePic: recipient.profilePic,
      },
      type: "tune_accept",
      message: `${recipient.name || "Someone"} accepted your tune-in request`,
      createdAt: notification.createdAt,
      isRead: false,
    });

    res.json({ success: true, status: "accepted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BLOCK / UNBLOCK A USER
// Blocking is silent (no notification), removes any existing tune-in
// relationship and pending requests in both directions, and hides each
// person's Vybe Space, posts, and whispers from the other completely.
const toggleBlockUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isBlocked = currentUser.blockedUsers.some(
      (id) => id.toString() === targetUserId
    );

    if (isBlocked) {
      // UNBLOCK
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.blockedBy = targetUser.blockedBy.filter(
        (id) => id.toString() !== currentUserId
      );

      await currentUser.save();
      await targetUser.save();

      return res.json({ success: true, blocked: false });
    }

    // BLOCK: sever any existing tune-in relationship, both directions.
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId
    );
    currentUser.followers = currentUser.followers.filter(
      (id) => id.toString() !== targetUserId
    );
    targetUser.following = targetUser.following.filter(
      (id) => id.toString() !== currentUserId
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId
    );

    currentUser.blockedUsers.push(targetUserId);
    targetUser.blockedBy.push(currentUserId);

    await Promise.all([
      currentUser.save(),
      targetUser.save(),
      TuneRequest.deleteMany({
        $or: [
          { sender: currentUserId, recipient: targetUserId },
          { sender: targetUserId, recipient: currentUserId },
        ],
      }),
    ]);

    res.json({ success: true, blocked: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LIST PEOPLE I HAVE BLOCKED
const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "blockedUsers",
      populatedUserFields
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.blockedUsers || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  searchUsers,
  followUser,
  getTuneRequests,
  getSentTuneRequests,
  respondToTuneRequest,
  toggleBlockUser,
  getBlockedUsers,
};