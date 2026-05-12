const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createPost,
  getPosts,
  toggleLikePost,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  toggleCommentLike,
  addReply,
  deleteReply,
  getMyPosts,
  getUserPosts,
} = require("../controllers/postController");

// GET ALL POSTS
router.get("/", getPosts);

// CREATE POST
router.post("/create", protect, createPost);

// LIKE / UNLIKE POST
router.put("/like/:postId", protect, toggleLikePost);

// UPDATE POST CAPTION
router.put("/:postId", protect, updatePost);

// DELETE POST
router.delete("/:postId", protect, deletePost);

// ADD COMMENT
router.post("/comment/:postId", protect, addComment);

// DELETE COMMENT
router.delete(
  "/comment/:postId/:commentId",
  protect,
  deleteComment
);

// LIKE / UNLIKE COMMENT
router.put(
  "/comment/like/:postId/:commentId",
  protect,
  toggleCommentLike
);

// ADD REPLY
router.post(
  "/comment/reply/:postId/:commentId",
  protect,
  addReply
);

// DELETE REPLY
router.delete(
  "/comment/reply/:postId/:commentId/:replyId",
  protect,
  deleteReply
);

// MY POSTS
router.get("/my-posts", protect, getMyPosts);

// USER POSTS
router.get("/user/:userId", getUserPosts);

module.exports = router;