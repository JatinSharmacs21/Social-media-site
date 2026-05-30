const VybeMessage = require("../models/VybeMessage");

const animals = [
  "Tiger",
  "Wolf",
  "Fox",
  "Panda",
  "Eagle",
  "Lion",
  "Owl",
  "Bear",
  "Falcon",
  "Dragon",
];

const ROOM_CONFIG = [
  {
    id: "general",
    label: "General",
    prompt: "Share a thought, question, or moment with the room.",
  },
  {
    id: "deep",
    label: "Deep",
    prompt: "What is something you have been thinking about lately?",
  },
  {
    id: "funny",
    label: "Funny",
    prompt: "Drop something that made you laugh today.",
  },
  {
    id: "chaos",
    label: "Chaos",
    prompt: "What is the most random thing happening right now?",
  },
  {
    id: "late-night",
    label: "Late Night",
    prompt: "What is on your mind tonight?",
  },
  {
    id: "college",
    label: "College",
    prompt: "Share a campus, class, exam, or friend-circle moment.",
  },
];

const ROOM_IDS = ROOM_CONFIG.map((room) => room.id);
const REACTION_TYPES = [
  "felt",
  "real",
  "same",
  "chaos",
  "needed",
  "like",
  "dislike",
  "fire",
  "laugh",
];

const sanitizeRoom = (value) => {
  const room = String(value || "general").trim().toLowerCase().slice(0, 50);
  return ROOM_IDS.includes(room) ? room : "general";
};

const getUserId = (req) => req.user?._id || req.user?.id;
const isSameId = (a, b) => a?.toString() === b?.toString();
const sendError = (res, status, message) => res.status(status).json({ message });

const getAnonymousName = (userId, room = "general") => {
  const id = userId.toString();
  const lastFour = id.slice(-4);
  const index = parseInt(lastFour, 16) % animals.length;
  const roomPrefix = ROOM_CONFIG.find((item) => item.id === room)?.label || "Vybe";

  return `${roomPrefix} ${animals[index]} #${lastFour}`;
};

const emitRoomUpdate = (req, message, eventName = "vybe-message-updated") => {
  const io = req.app.get("io");
  if (!io || !message?.room) return;
  io.to(`vybe-room-${message.room}`).emit(eventName, message);
};

const getRooms = async (req, res) => {
  res.json(ROOM_CONFIG);
};

const getMessages = async (req, res) => {
  try {
    const room = sanitizeRoom(req.query.room);
    const limit = Math.min(Number(req.query.limit) || 80, 120);

    const messages = await VybeMessage.find({ room })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const room = sanitizeRoom(req.body.room);
    const userId = getUserId(req);

    if (!text || !text.trim()) {
      return sendError(res, 400, "Message cannot be empty");
    }

    if (text.trim().length > 500) {
      return sendError(res, 400, "Message is too long");
    }

    const message = await VybeMessage.create({
      room,
      user: userId,
      anonymousName: getAnonymousName(userId, room),
      text: text.trim(),
    });

    emitRoomUpdate(req, message, "vybe-message-created");
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addReply = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return sendError(res, 400, "Reply cannot be empty");
    }

    if (text.trim().length > 300) {
      return sendError(res, 400, "Reply is too long");
    }

    const message = await VybeMessage.findById(req.params.messageId);

    if (!message) {
      return sendError(res, 404, "Message not found");
    }

    if (message.isDeleted) {
      return sendError(res, 400, "Cannot reply to a removed message");
    }

    const userId = getUserId(req);
    message.replies.push({
      user: userId,
      anonymousName: getAnonymousName(userId, message.room),
      text: text.trim(),
    });

    await message.save();

    emitRoomUpdate(req, message);
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reactToMessage = async (req, res) => {
  try {
    const { reaction } = req.body;

    if (!REACTION_TYPES.includes(reaction)) {
      return sendError(res, 400, "Invalid reaction");
    }

    const message = await VybeMessage.findById(req.params.messageId);

    if (!message) {
      return sendError(res, 404, "Message not found");
    }

    if (message.isDeleted) {
      return sendError(res, 400, "Cannot react to a removed message");
    }

    const userId = getUserId(req);
    REACTION_TYPES.forEach((type) => {
      if (!message.reactions[type]) message.reactions[type] = [];
      message.reactions[type] = message.reactions[type].filter(
        (id) => id.toString() !== userId.toString()
      );
    });

    message.reactions[reaction].push(userId);

    await message.save();

    emitRoomUpdate(req, message);
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = await VybeMessage.findById(req.params.messageId);

    if (!message) {
      return sendError(res, 404, "Message not found");
    }

    if (!isSameId(message.user, getUserId(req))) {
      return sendError(res, 403, "You can remove only your own message");
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.text = "This message was removed";
    message.reactions = {};

    await message.save();

    emitRoomUpdate(req, message, "vybe-message-updated");
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReply = async (req, res) => {
  try {
    const message = await VybeMessage.findById(req.params.messageId);

    if (!message) {
      return sendError(res, 404, "Message not found");
    }

    const reply = message.replies.id(req.params.replyId);

    if (!reply) {
      return sendError(res, 404, "Reply not found");
    }

    const ownsReply = isSameId(reply.user, getUserId(req));
    const ownsMessage = isSameId(message.user, getUserId(req));

    if (!ownsReply && !ownsMessage) {
      return sendError(res, 403, "You can remove only your own reply");
    }

    reply.isDeleted = true;
    reply.deletedAt = new Date();
    reply.text = "This reply was removed";
    reply.reactions = {};

    await message.save();

    emitRoomUpdate(req, message, "vybe-message-updated");
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reportMessage = async (req, res) => {
  try {
    const message = await VybeMessage.findById(req.params.messageId);

    if (!message) {
      return sendError(res, 404, "Message not found");
    }

    const userId = getUserId(req);
    const alreadyReported = (message.reports || []).some((report) =>
      isSameId(report.user, userId)
    );

    if (!alreadyReported) {
      message.reports.push({
        user: userId,
        reason: String(req.body?.reason || "Reported from Vybe Room").slice(0, 160),
      });
      await message.save();
    }

    res.json({ message: "Report submitted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRooms,
  getMessages,
  createMessage,
  addReply,
  reactToMessage,
  deleteMessage,
  deleteReply,
  reportMessage,
};
