const User = require("../models/User");
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

  const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const publicUserFields = "name username profilePic bio followers following createdAt";
const populatedUserFields = "name username profilePic bio";

const normalizeUsername = (username = "") =>
  username.toString().trim().toLowerCase();

const validateUsername = (username) => /^[a-z0-9_]{3,20}$/.test(username);

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
    const { name, bio, profilePic } = req.body;
    const incomingUsername = req.body.username;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name.toString().trim().slice(0, 40);
    if (bio !== undefined) user.bio = bio.toString().trim().slice(0, 160);
    if (profilePic !== undefined) user.profilePic = profilePic;

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

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEARCH USERS BY NAME OR USERNAME
const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || req.query.name || "").trim().slice(0, 40);

    if (!q) {
      const suggestedUsers = await User.find({})
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
    })
      .select(publicUserFields)
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: error.message });
  }
};

// FOLLOW / UNFOLLOW USER
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

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId
    );

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );

      userToFollow.followers = userToFollow.followers.filter(
        (id) => id.toString() !== currentUserId
      );
    } else {
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
    }

    await currentUser.save();
    await userToFollow.save();

    const updatedUser = await User.findById(targetUserId)
      .select("-password")
      .populate("followers", populatedUserFields)
      .populate("following", populatedUserFields);

    res.json({ success: true, following: !isFollowing, user: updatedUser });
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
};
