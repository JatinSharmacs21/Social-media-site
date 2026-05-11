const express = require("express");

const router = express.Router();

const {
  getUserProfile,
  followUser,
} = require("../controllers/userController");

const {
  protect,
} = require("../middleware/authMiddleware");

// GET USER PROFILE
router.get("/:id", getUserProfile);

// FOLLOW / UNFOLLOW
router.put(
  "/follow/:id",
  protect,
  followUser
);

module.exports = router;