const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadCount,
} = require("../controllers/whisperController");

router.use(protect);

router.get("/conversations", getConversations);
router.get("/unread-count", getUnreadCount);
router.post("/conversations", getOrCreateConversation);
router.post("/start/:participantId", getOrCreateConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.put("/conversations/:conversationId/read", markConversationRead);

module.exports = router;
