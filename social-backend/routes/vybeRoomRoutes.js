const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getMessages,
  createMessage,
  addReply,
  reactToMessage,
} = require("../controllers/vybeRoomController");

router.get("/", protect, getMessages);
router.post("/", protect, createMessage);
router.post("/:messageId/reply", protect, addReply);
router.put("/:messageId/react", protect, reactToMessage);

module.exports = router;