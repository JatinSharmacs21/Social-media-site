const express = require("express");

const router = express.Router();

const {
  getUserProfile,
  searchUsers,
  followUser,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// SEARCH USERS
router.get("/search", searchUsers);

// GET USER PROFILE
router.get("/:id", getUserProfile);

// FOLLOW / UNFOLLOW
router.put("/follow/:id", protect, followUser);

module.exports = router;