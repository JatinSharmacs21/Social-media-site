const User = require("../models/User");
const Notification = require("../models/Notification");

// GET USER PROFILE
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name email profilePic bio")
      .populate("following", "name email profilePic bio");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// SEARCH USERS
const searchUsers = async (req, res) => {
  try {
    const { name } = req.query;

    const users = await User.find({
      name: { $regex: name || "", $options: "i" },
    })
      .select("name email profilePic bio followers following")
      .limit(30);

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// FOLLOW / UNFOLLOW USER
const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        message: "You cannot follow yourself",
      });
    }

    const userToFollow = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({
        message: "User not found",
      });
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

  await Notification.create({
    recipient: targetUserId,
    sender: currentUserId,
    type: "follow",
    message: "started following you",
  });
}

    await currentUser.save();
    await userToFollow.save();

    const updatedUser = await User.findById(targetUserId)
      .select("-password")
      .populate("followers", "name email profilePic bio")
      .populate("following", "name email profilePic bio");

    res.json({
      success: true,
      following: !isFollowing,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getUserProfile,
  searchUsers,
  followUser,
};