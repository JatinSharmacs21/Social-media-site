const User = require("../models/User");

// GET USER PROFILE
const getUserProfile = async (req, res) => {
  try {

    const user = await User.findById(
      req.params.id
    )
      .select("-password")
      .populate(
        "followers",
        "name profilePic"
      )
      .populate(
        "following",
        "name profilePic"
      );

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

// FOLLOW / UNFOLLOW USER
const followUser = async (req, res) => {
  try {

    // USER TO FOLLOW
    const userToFollow =
      await User.findById(req.params.id);

    // CURRENT USER
    const currentUser =
      await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // CANNOT FOLLOW SELF
    if (
      userToFollow._id.toString() ===
      currentUser._id.toString()
    ) {
      return res.status(400).json({
        message:
          "You cannot follow yourself",
      });
    }

    // CHECK ALREADY FOLLOWING
    const isFollowing =
      currentUser.following.includes(
        userToFollow._id
      );

    // UNFOLLOW
    if (isFollowing) {

      currentUser.following =
        currentUser.following.filter(
          (id) =>
            id.toString() !==
            userToFollow._id.toString()
        );

      userToFollow.followers =
        userToFollow.followers.filter(
          (id) =>
            id.toString() !==
            currentUser._id.toString()
        );

    } else {

      // FOLLOW
      currentUser.following.push(
        userToFollow._id
      );

      userToFollow.followers.push(
        currentUser._id
      );

    }

    await currentUser.save();

    await userToFollow.save();

    res.json({
      success: true,
      following: !isFollowing,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

module.exports = {
  getUserProfile,
  followUser,
};