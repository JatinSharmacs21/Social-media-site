const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const WhisperMessage = require("../models/WhisperMessage");
const User = require("../models/User");

const userFields = "name username profilePic bio";

const getCurrentUserId = (req) => req.user?._id || req.user?.id;

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getConversationRoom = (conversationId) => `whisper-${conversationId}`;

const getParticipantIds = (conversation) =>
  (conversation.participants || []).map((participant) =>
    (participant?._id || participant).toString()
  );

const ensureParticipant = (conversation, userId) =>
  getParticipantIds(conversation).includes(userId.toString());

const populateConversation = async (conversationId) =>
  Conversation.findById(conversationId)
    .populate("participants", userFields)
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: userFields },
    });

const emitToParticipants = (req, conversation, event, payload) => {
  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");
  if (!io || !onlineUsers) return;

  getParticipantIds(conversation).forEach((participantId) => {
    const sockets = onlineUsers.get(participantId);
    if (!sockets) return;

    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, payload);
    });
  });
};

const getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const participantId = req.body.participantId || req.params.participantId;

    if (!participantId || !isObjectId(participantId)) {
      return res.status(400).json({ message: "Valid participant is required" });
    }

    if (participantId.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot whisper yourself" });
    }

    const participant = await User.findById(participantId).select(userFields);
    if (!participant) return res.status(404).json({ message: "User not found" });

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, participantId],
        lastMessageAt: new Date(),
      });
    }

    const populated = await populateConversation(conversation._id);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);

    const conversations = await Conversation.find({ participants: currentUserId })
      .populate("participants", userFields)
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: userFields },
      })
      .sort({ lastMessageAt: -1 })
      .limit(50);

    const unreadCounts = await WhisperMessage.aggregate([
      {
        $match: {
          conversation: { $in: conversations.map((item) => item._id) },
          sender: { $ne: currentUserId },
          readBy: { $ne: currentUserId },
        },
      },
      { $group: { _id: "$conversation", count: { $sum: 1 } } },
    ]);

    const unreadMap = unreadCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    res.json(
      conversations.map((conversation) => ({
        ...conversation.toObject(),
        unreadCount: unreadMap[conversation._id.toString()] || 0,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { conversationId } = req.params;

    if (!isObjectId(conversationId)) {
      return res.status(400).json({ message: "Valid conversation is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!ensureParticipant(conversation, currentUserId)) {
      return res.status(403).json({ message: "You are not part of this whisper" });
    }

    const messages = await WhisperMessage.find({ conversation: conversationId })
      .populate("sender", userFields)
      .sort({ createdAt: 1 })
      .limit(120);

    await WhisperMessage.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: currentUserId },
        readBy: { $ne: currentUserId },
      },
      { $addToSet: { readBy: currentUserId } }
    );

    emitToParticipants(req, conversation, "whisper-seen", {
      conversationId,
      seenBy: currentUserId.toString(),
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { conversationId } = req.params;
    const text = String(req.body.text || "").trim();

    if (!text) return res.status(400).json({ message: "Message is required" });
    if (text.length > 1200) {
      return res.status(400).json({ message: "Message is too long" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!ensureParticipant(conversation, currentUserId)) {
      return res.status(403).json({ message: "You are not part of this whisper" });
    }

    let message = await WhisperMessage.create({
      conversation: conversationId,
      sender: currentUserId,
      text,
      readBy: [currentUserId],
    });

    message = await WhisperMessage.findById(message._id).populate("sender", userFields);

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const populatedConversation = await populateConversation(conversationId);

    const payload = {
      conversation: populatedConversation,
      message,
    };

    const io = req.app.get("io");
    if (io) {
      io.to(getConversationRoom(conversationId)).emit("whisper-message-created", payload);
    }
    emitToParticipants(req, populatedConversation, "whisper-inbox-updated", payload);

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markConversationRead = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!ensureParticipant(conversation, currentUserId)) {
      return res.status(403).json({ message: "You are not part of this whisper" });
    }

    await WhisperMessage.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: currentUserId },
        readBy: { $ne: currentUserId },
      },
      { $addToSet: { readBy: currentUserId } }
    );

    emitToParticipants(req, conversation, "whisper-seen", {
      conversationId,
      seenBy: currentUserId.toString(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);

    const conversations = await Conversation.find({ participants: currentUserId }).select("_id");
    const conversationIds = conversations.map((item) => item._id);

    const count = await WhisperMessage.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: currentUserId },
      readBy: { $ne: currentUserId },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadCount,
};
