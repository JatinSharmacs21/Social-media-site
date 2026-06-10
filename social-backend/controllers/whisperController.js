const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const WhisperMessage = require("../models/WhisperMessage");
const User = require("../models/User");

const userFields = "name username profilePic bio lastSeen";

const getCurrentUserId = (req) => req.user?._id || req.user?.id;
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const getConversationRoom = (conversationId) => `whisper-${conversationId}`;

const getParticipantIds = (conversation) =>
  (conversation.participants || []).map((participant) =>
    (participant?._id || participant).toString()
  );

const ensureParticipant = (conversation, userId) =>
  getParticipantIds(conversation).includes(userId.toString());

const populateMessage = (query) =>
  query
    .populate("sender", userFields)
    .populate("reactions.user", userFields)
    .populate({
      path: "replyTo",
      select: "text media sharedVybe sender createdAt",
      populate: { path: "sender", select: userFields },
    });

const populateConversation = async (conversationId) =>
  Conversation.findById(conversationId)
    .populate("participants", userFields)
    .populate({
      path: "lastMessage",
      populate: [
        { path: "sender", select: userFields },
        {
          path: "replyTo",
          select: "text media sharedVybe sender createdAt",
          populate: { path: "sender", select: userFields },
        },
      ],
    });

const emitToParticipants = (req, conversation, event, payload) => {
  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");
  if (!io || !onlineUsers || !conversation) return;

  getParticipantIds(conversation).forEach((participantId) => {
    const sockets = onlineUsers.get(participantId);
    if (!sockets) return;

    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, payload);
    });
  });
};

const refreshConversationLastMessage = async (conversationId) => {
  const latest = await WhisperMessage.findOne({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .select("_id createdAt");

  const update = latest
    ? { lastMessage: latest._id, lastMessageAt: latest.createdAt }
    : { lastMessage: null, lastMessageAt: new Date() };

  await Conversation.findByIdAndUpdate(conversationId, update);
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
        populate: [
          { path: "sender", select: userFields },
          { path: "reactions.user", select: userFields },
          {
            path: "replyTo",
            select: "text media sharedVybe sender createdAt",
            populate: { path: "sender", select: userFields },
          },
        ],
      })
      .sort({ lastMessageAt: -1 })
      .limit(50);

    const unreadCounts = await WhisperMessage.aggregate([
      {
        $match: {
          conversation: { $in: conversations.map((item) => item._id) },
          sender: { $ne: new mongoose.Types.ObjectId(currentUserId) },
          readBy: { $ne: new mongoose.Types.ObjectId(currentUserId) },
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

    const messages = await populateMessage(
      WhisperMessage.find({ conversation: conversationId }).sort({ createdAt: 1 }).limit(120)
    );

    // Only return messages here.
    // Seen/read state is updated by the explicit /read endpoint when the chat is actually opened.
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
    const replyTo = req.body.replyTo || null;
    const mediaInput = req.body.media && typeof req.body.media === "object" ? req.body.media : null;
    const sharedVybeInput = req.body.sharedVybe && typeof req.body.sharedVybe === "object" ? req.body.sharedVybe : null;
    const media = mediaInput?.url
      ? {
          url: String(mediaInput.url || "").trim(),
          type: mediaInput.type === "video" ? "video" : "image",
          name: String(mediaInput.name || "").slice(0, 180),
          size: Number(mediaInput.size || 0),
        }
      : null;

    if (sharedVybeInput?.postId && !isObjectId(sharedVybeInput.postId)) {
      return res.status(400).json({ message: "Valid shared vybe is required" });
    }

    const sharedVybe = sharedVybeInput?.postId
      ? {
          postId: sharedVybeInput.postId,
          type: ["Thought", "Moment", "Spark"].includes(sharedVybeInput.type) ? sharedVybeInput.type : "Thought",
          caption: String(sharedVybeInput.caption || "").slice(0, 700),
          mood: String(sharedVybeInput.mood || "").slice(0, 40),
          vybeTag: String(sharedVybeInput.vybeTag || "").slice(0, 40),
          media: sharedVybeInput.media?.url
            ? {
                url: String(sharedVybeInput.media.url || "").trim(),
                type: sharedVybeInput.media.type === "video" ? "video" : "image",
              }
            : undefined,
          author: {
            id: isObjectId(sharedVybeInput.author?.id) ? sharedVybeInput.author.id : null,
            name: String(sharedVybeInput.author?.name || "").slice(0, 80),
            username: String(sharedVybeInput.author?.username || "").slice(0, 40),
            profilePic: String(sharedVybeInput.author?.profilePic || ""),
          },
        }
      : null;

    if (!text && !media?.url && !sharedVybe?.postId) return res.status(400).json({ message: "Message, media, or shared vybe is required" });
    if (text.length > 1200) {
      return res.status(400).json({ message: "Message is too long" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!ensureParticipant(conversation, currentUserId)) {
      return res.status(403).json({ message: "You are not part of this whisper" });
    }

    let validReplyTo = null;
    if (replyTo && isObjectId(replyTo)) {
      const repliedMessage = await WhisperMessage.findOne({ _id: replyTo, conversation: conversationId }).select("_id");
      if (repliedMessage) validReplyTo = repliedMessage._id;
    }

    let message = await WhisperMessage.create({
      conversation: conversationId,
      sender: currentUserId,
      text,
      media: media || undefined,
      sharedVybe: sharedVybe || undefined,
      replyTo: validReplyTo,
      readBy: [currentUserId],
    });

    message = await populateMessage(WhisperMessage.findById(message._id));

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const populatedConversation = await populateConversation(conversationId);
    const payload = { conversation: populatedConversation, message };

    const io = req.app.get("io");
    if (io) io.to(getConversationRoom(conversationId)).emit("whisper-message-created", payload);
    emitToParticipants(req, populatedConversation, "whisper-inbox-updated", payload);

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const togglePinConversation = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { conversationId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!isObjectId(conversationId)) {
      return res.status(400).json({ message: "Valid conversation is required" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const currentUserKey = currentUserId.toString();
    const pinnedBy = Array.isArray(conversation.pinnedBy) ? conversation.pinnedBy : [];
    const alreadyPinned = pinnedBy.some((id) => id.toString() === currentUserKey);

    conversation.pinnedBy = alreadyPinned
      ? pinnedBy.filter((id) => id.toString() !== currentUserKey)
      : [...pinnedBy, currentUserId];

    await conversation.save();

    const populatedConversation = await populateConversation(conversation._id);

    res.json({
      conversation: populatedConversation,
      pinned: !alreadyPinned,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Chat pin could not be updated" });
  }
};

const reactToMessage = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { conversationId, messageId } = req.params;
    const emoji = String(req.body.emoji || "").trim();
    const allowedEmojis = ["❤️", "😂", "🔥", "👀", "😮"];

    if (!isObjectId(conversationId) || !isObjectId(messageId)) {
      return res.status(400).json({ message: "Valid conversation and message are required" });
    }

    if (!allowedEmojis.includes(emoji)) {
      return res.status(400).json({ message: "Valid reaction is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!ensureParticipant(conversation, currentUserId)) {
      return res.status(403).json({ message: "You are not part of this whisper" });
    }

    const message = await WhisperMessage.findOne({ _id: messageId, conversation: conversationId });
    if (!message) return res.status(404).json({ message: "Message not found" });

    const currentUser = String(currentUserId);
    const existingIndex = (message.reactions || []).findIndex((reaction) => String(reaction.user) === currentUser);

    if (existingIndex >= 0) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
        message.reactions[existingIndex].createdAt = new Date();
      }
    } else {
      message.reactions.push({ user: currentUserId, emoji, createdAt: new Date() });
    }

    await message.save();

    const populatedMessage = await populateMessage(WhisperMessage.findById(message._id));
    const payload = { conversationId: conversationId.toString(), message: populatedMessage };

    const io = req.app.get("io");
    if (io) io.to(getConversationRoom(conversationId)).emit("whisper-message-reacted", payload);
    emitToParticipants(req, conversation, "whisper-message-reacted", payload);

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { messageId, conversationId } = req.params;

    if (!isObjectId(messageId)) {
      return res.status(400).json({ message: "Valid message is required" });
    }

    const message = await WhisperMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (conversationId && String(message.conversation) !== String(conversationId)) {
      return res.status(400).json({ message: "Message does not belong to this conversation" });
    }

    const conversation = await Conversation.findById(message.conversation);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!ensureParticipant(conversation, currentUserId)) {
      return res.status(403).json({ message: "You are not part of this whisper" });
    }

    const senderId = message.sender?._id || message.sender;
    if (String(senderId) !== String(currentUserId)) {
      return res.status(403).json({ message: "You can delete only your own messages" });
    }

    await WhisperMessage.updateMany({ replyTo: message._id }, { $set: { replyTo: null } });
    await WhisperMessage.deleteOne({ _id: message._id });
    await refreshConversationLastMessage(conversation._id);

    const populatedConversation = await populateConversation(conversation._id);
    const payload = {
      deleted: true,
      conversationId: conversation._id.toString(),
      messageId: message._id.toString(),
      conversation: populatedConversation,
    };

    const io = req.app.get("io");
    if (io) io.to(getConversationRoom(conversation._id)).emit("whisper-message-deleted", payload);
    emitToParticipants(req, populatedConversation || conversation, "whisper-message-deleted", payload);

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { conversationId } = req.params;

    if (!isObjectId(conversationId)) {
      return res.status(400).json({ message: "Valid conversation is required" });
    }

    const conversation = await Conversation.findById(conversationId).populate("participants", userFields);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!ensureParticipant(conversation, currentUserId)) {
      return res.status(403).json({ message: "You are not part of this whisper" });
    }

    await WhisperMessage.deleteMany({ conversation: conversationId });
    await Conversation.deleteOne({ _id: conversationId });

    const payload = { conversationId: conversationId.toString() };
    const io = req.app.get("io");
    if (io) io.to(getConversationRoom(conversationId)).emit("whisper-conversation-deleted", payload);
    emitToParticipants(req, conversation, "whisper-conversation-deleted", payload);

    res.json(payload);
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
  reactToMessage,
  deleteMessage,
  deleteConversation,
  markConversationRead,
  getUnreadCount,
  togglePinConversation,
};
