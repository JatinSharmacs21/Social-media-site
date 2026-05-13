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

const getAnonymousName = (userId) => {
  const id = userId.toString();
  const lastFour = id.slice(-4);
  const index = parseInt(lastFour, 16) % animals.length;

  return `Anon ${animals[index]} #${lastFour}`;
};

// GET MESSAGES
const getMessages = async (req, res) => {
  try {
    const room = req.query.room || "general";

    const messages = await VybeMessage.find({ room })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// CREATE MESSAGE
const createMessage = async (req, res) => {
  try {
    const { text, room } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({
        message: "Message is too long",
      });
    }

    const message = await VybeMessage.create({
      room: room || "general",
      user: req.user.id,
      anonymousName: getAnonymousName(req.user.id),
      text: text.trim(),
    });

    const io = req.app.get("io");

if (io) {
  io.to(`vybe-room-${message.room}`).emit("vybe-message-created", message);
}

res.status(201).json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ADD REPLY
const addReply = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Reply cannot be empty",
      });
    }

    if (text.trim().length > 300) {
      return res.status(400).json({
        message: "Reply is too long",
      });
    }

    const message = await VybeMessage.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    message.replies.push({
      user: req.user.id,
      anonymousName: getAnonymousName(req.user.id),
      text: text.trim(),
    });

    await message.save();

    const io = req.app.get("io");

if (io) {
  io.to(`vybe-room-${message.room}`).emit("vybe-message-updated", message);
}

res.json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// REACT TO MESSAGE
const reactToMessage = async (req, res) => {
  try {
    const { reaction } = req.body;

    const allowed = ["like", "dislike", "fire", "laugh"];

    if (!allowed.includes(reaction)) {
      return res.status(400).json({
        message: "Invalid reaction",
      });
    }

    const message = await VybeMessage.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    allowed.forEach((type) => {
      message.reactions[type] = message.reactions[type].filter(
        (id) => id.toString() !== req.user.id.toString()
      );
    });

    message.reactions[reaction].push(req.user.id);

    await message.save();

    const io = req.app.get("io");

if (io) {
  io.to(`vybe-room-${message.room}`).emit("vybe-message-updated", message);
}

res.json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getMessages,
  createMessage,
  addReply,
  reactToMessage,
};