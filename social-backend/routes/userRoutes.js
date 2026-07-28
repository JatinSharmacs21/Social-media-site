const express = require("express");
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  searchUsers,
  followUser,
  getTuneRequests,
  getSentTuneRequests,
  respondToTuneRequest,
} = require("../controllers/userController");

const { protect, optionalAuth } = require("../middleware/authMiddleware");

// SEARCH USERS
router.get("/search", searchUsers);

// MY PROFILE
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

// TUNE-IN REQUESTS (private Vybe Space follow requests)
router.get("/tune-requests", protect, getTuneRequests);
router.get("/tune-requests/sent", protect, getSentTuneRequests);
router.put("/tune-requests/:requestId", protect, respondToTuneRequest);

// FOLLOW / UNFOLLOW / REQUEST TUNE-IN
router.put("/follow/:id", protect, followUser);

// GET USER PROFILE (optionalAuth so we know the viewer for private spaces,
// without forcing logged-out visitors to be blocked outright)
router.get("/:identifier", optionalAuth, getUserProfile);

module.exports = router;