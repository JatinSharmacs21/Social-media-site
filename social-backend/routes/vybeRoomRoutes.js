const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getRooms,
  getMessages,
  createMessage,
  addReply,
  reactToMessage,
  deleteMessage,
  deleteReply,
  reportMessage,
} = require("../controllers/vybeRoomController");

router.get("/rooms", protect, getRooms);
router.get("/", protect, getMessages);
router.post("/", protect, createMessage);
router.post("/:messageId/reply", protect, addReply);
router.put("/:messageId/react", protect, reactToMessage);
router.delete("/:messageId", protect, deleteMessage);
router.delete("/:messageId/reply/:replyId", protect, deleteReply);
router.post("/:messageId/report", protect, reportMessage);

module.exports = router;
