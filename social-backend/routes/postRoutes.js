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
  getVybeDrops,
  replyToVybeDrop,
  getDropReplies,
  reactToVybeReply,
  deleteVybeDropReply,
  addNestedVybeReply,
  deleteNestedVybeReply,
} = require("../controllers/postController");

// VYBE DROPS ROUTES
router.get("/drops", getVybeDrops);
router.get("/drops/:dropId/replies", getDropReplies);
router.post("/drops/:dropId/reply", protect, replyToVybeDrop);
router.post("/drops/reply/:replyId/react", protect, reactToVybeReply);

router.delete(
  "/drops/reply/:replyId",
  protect,
  deleteVybeDropReply
);

router.post(
  "/drops/reply/:replyId/thread",
  protect,
  addNestedVybeReply
);

router.delete(
  "/drops/reply/:replyId/thread/:threadReplyId",
  protect,
  deleteNestedVybeReply
);

// GET ALL POSTS
router.get("/", getPosts);

// CREATE POST
router.post("/create", protect, createPost);

// MY POSTS
router.get("/my-posts", protect, getMyPosts);

// USER POSTS
router.get("/user/:userId", getUserPosts);

// LIKE / UNLIKE POST
router.put("/like/:postId", protect, toggleLikePost);

// UPDATE POST CAPTION
router.put("/:postId", protect, updatePost);

// DELETE POST
router.delete("/:postId", protect, deletePost);

// ADD COMMENT
router.post("/comment/:postId", protect, addComment);

// DELETE COMMENT
router.delete("/comment/:postId/:commentId", protect, deleteComment);

// LIKE / UNLIKE COMMENT
router.put("/comment/like/:postId/:commentId", protect, toggleCommentLike);

// ADD REPLY
router.post("/comment/reply/:postId/:commentId", protect, addReply);

// DELETE REPLY
router.delete("/comment/reply/:postId/:commentId/:replyId", protect, deleteReply);

module.exports = router;