const express = require("express");
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  searchUsers,
  followUser,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// SEARCH USERS
router.get("/search", searchUsers);

// MY PROFILE
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

// FOLLOW / UNFOLLOW
router.put("/follow/:id", protect, followUser);

// GET USER PROFILE
router.get("/:identifier", getUserProfile);

module.exports = router;
