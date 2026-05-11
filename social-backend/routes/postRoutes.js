const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createPost,
  getPosts,
  toggleLikePost,
  addComment,
  deleteComment,
  getMyPosts,
  getUserPosts,
} = require("../controllers/postController");

// GET ALL POSTS
router.get("/", getPosts);

// CREATE POST
router.post("/create", protect, createPost);

// LIKE / UNLIKE
router.put("/like/:postId", protect, toggleLikePost);

// ADD COMMENT
router.post("/comment/:postId", protect, addComment);

// DELETE COMMENT
router.delete(
  "/comment/:postId/:commentId",
  protect,
  deleteComment
);

// MY POSTS
router.get("/my-posts", protect, getMyPosts);

router.get("/user/:userId", getUserPosts);

module.exports = router;