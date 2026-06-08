const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  reactToMessage,
  deleteMessage,
  deleteConversation,
  markConversationRead,
  getUnreadCount,
  togglePinConversation,
} = require("../controllers/whisperController");

router.use(protect);

router.get("/conversations", getConversations);
router.get("/unread-count", getUnreadCount);
router.post("/conversations", getOrCreateConversation);
router.post("/start/:participantId", getOrCreateConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.put("/conversations/:conversationId/messages/:messageId/react", reactToMessage);
router.put("/conversations/:conversationId/read", markConversationRead);
router.put("/conversations/:conversationId/pin", togglePinConversation);
router.patch("/conversations/:conversationId/pin", togglePinConversation);
router.post("/conversations/:conversationId/pin", togglePinConversation);
router.delete("/conversations/:conversationId/messages/:messageId", deleteMessage);
router.delete("/messages/:messageId", deleteMessage);
router.delete("/conversations/:conversationId", deleteConversation);

module.exports = router;
