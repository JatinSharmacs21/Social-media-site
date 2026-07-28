const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const notificationRoutes = require("./routes/notificationRoutes");
const vybeRoomRoutes = require("./routes/vybeRoomRoutes");
const whisperRoutes = require("./routes/whisperRoutes");

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const logger = require("./utils/logger");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const postRoutes = require("./routes/postRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");


connectDB();

const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [
  "http://localhost:3000",
  "https://vybeo.vercel.app",
  ...parseOrigins(process.env.CLIENT_URL),
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.CORS_ORIGINS),
];

const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      socket.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    socket.user = null;
    next();
  }
});
// Realtime notification users: userId -> Set(socket.id)
const onlineUsers = new Map();

// Prevent false "Last seen just now" updates caused by quick reconnects,
// React StrictMode dev remounts, route changes, or temporary websocket reconnects.
// A user is marked offline only if they still have no active sockets after this delay.
const lastSeenTimers = new Map();
const LAST_SEEN_GRACE_MS = 30000;

const cancelLastSeenTimer = (userId) => {
  const id = userId?.toString();
  if (!id || !lastSeenTimers.has(id)) return;
  clearTimeout(lastSeenTimers.get(id));
  lastSeenTimers.delete(id);
};

const addOnlineSocket = (userId, socketId) => {
  const id = userId.toString();
  cancelLastSeenTimer(id);

  if (!onlineUsers.has(id)) {
    onlineUsers.set(id, new Set());
  }

  onlineUsers.get(id).add(socketId);
};

const removeOnlineSocket = (userId, socketId) => {
  const id = userId?.toString();
  if (!id || !onlineUsers.has(id)) return false;

  const sockets = onlineUsers.get(id);
  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(id);
    return true;
  }

  return false;
};

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const emitPresenceUpdate = () => {
  io.emit("whisper-online-users", { userIds: getOnlineUserIds() });
};

const touchUserLoginSession = async (userId) => {
  if (!userId) return;

  try {
    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
  } catch (error) {
    logger.error("Failed to update realtime login session:", error);
  }
};

const markUserLastSeen = async (userId) => {
  if (!userId) return null;

  const lastSeen = new Date();
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { lastSeen },
      { new: true, select: "lastSeen" }
    );
    return user?.lastSeen || lastSeen;
  } catch (error) {
    logger.error("Failed to update last seen:", error);
    return lastSeen;
  }
};

// Vybe room users count: roomId -> Set(userId)
const vybeRoomUsers = new Map();

const normalizeVybeRoom = (room = "general") =>
  String(room || "general").trim().toLowerCase().slice(0, 50) || "general";

const VYBE_ROOM_LABELS = {
  general: "General",
  deep: "Deep",
  funny: "Funny",
  chaos: "Chaos",
  "late-night": "Late Night",
  college: "College",
};

// Room heating-up: roomId -> last time we broadcast a "heating up" signal
const vybeRoomHeatingCooldown = new Map();
const VYBE_ROOM_HEATING_THRESHOLD = 4;
const VYBE_ROOM_HEATING_COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes

const maybeAnnounceRoomHeatingUp = (room, count) => {
  const roomId = normalizeVybeRoom(room);
  if (count < VYBE_ROOM_HEATING_THRESHOLD) return;

  const lastAnnounced = vybeRoomHeatingCooldown.get(roomId) || 0;
  if (Date.now() - lastAnnounced < VYBE_ROOM_HEATING_COOLDOWN_MS) return;

  vybeRoomHeatingCooldown.set(roomId, Date.now());

  io.emit("vybe-room-heating-up", {
    room: roomId,
    label: VYBE_ROOM_LABELS[roomId] || roomId,
    count,
  });
};

const addVybeRoomUser = (room, userId) => {
  const roomId = normalizeVybeRoom(room);
  const id = userId?.toString();
  if (!id) return 0;

  if (!vybeRoomUsers.has(roomId)) {
    vybeRoomUsers.set(roomId, new Set());
  }

  vybeRoomUsers.get(roomId).add(id);
  return vybeRoomUsers.get(roomId).size;
};

const removeVybeRoomUser = (room, userId) => {
  const roomId = normalizeVybeRoom(room);
  const id = userId?.toString();
  if (!id || !vybeRoomUsers.has(roomId)) return 0;

  const users = vybeRoomUsers.get(roomId);
  users.delete(id);

  if (users.size === 0) {
    vybeRoomUsers.delete(roomId);
    return 0;
  }

  return users.size;
};

const emitVybeRoomCount = (room) => {
  const roomId = normalizeVybeRoom(room);
  const count = vybeRoomUsers.get(roomId)?.size || 0;
  io.to(`vybe-room-${roomId}`).emit("vybe-online-users", {
    room: roomId,
    count,
  });
};

app.set("onlineUsers", onlineUsers);

io.on("connection", (socket) => {
  logger.info("Socket connected:", socket.id);

  // Frontend Navbar emits this after login.
  // This helps backend send realtime notification to one specific user.
 socket.on("register-user", () => {
  if (!socket.user?.id) return;

  const id = socket.user.id.toString();
  socket.userId = id;
  addOnlineSocket(id, socket.id);
  touchUserLoginSession(id);

  socket.emit("whisper-online-users", { userIds: getOnlineUserIds() });
  emitPresenceUpdate();

  logger.info("Realtime user registered:", id);
});

  socket.on("join-drop", (dropId) => {
  if (!dropId) return;
  socket.join(`drop-${dropId}`);
});

socket.on("leave-drop", (dropId) => {
  if (!dropId) return;
  socket.leave(`drop-${dropId}`);
});

socket.on("drop-typing-start", ({ dropId, user }) => {
  if (!dropId) return;

  socket.to(`drop-${dropId}`).emit("drop-user-typing", {
    dropId,
    user: user || "Someone",
  });
});

socket.on("drop-typing-stop", ({ dropId }) => {
  if (!dropId) return;

  socket.to(`drop-${dropId}`).emit("drop-user-stop-typing", {
    dropId,
  });
});

socket.on("drop-pulse", ({ dropId }) => {
  if (!dropId) return;

  const room = io.sockets.adapter.rooms.get(`drop-${dropId}`);
  const count = room ? room.size : 0;

  io.to(`drop-${dropId}`).emit("drop-pulse-update", {
    dropId,
    count,
  });
});

socket.on("join-vybe-room", ({ room = "general" }) => {
  const roomId = normalizeVybeRoom(room);
  socket.join(`vybe-room-${roomId}`);
  socket.currentVybeRoom = roomId;

  if (socket.user?.id) {
    addVybeRoomUser(roomId, socket.user.id);
  }

  emitVybeRoomCount(roomId);
  maybeAnnounceRoomHeatingUp(roomId, vybeRoomUsers.get(roomId)?.size || 0);
});

  socket.on("vybe-typing", ({ room, typing }) => {
    const roomId = normalizeVybeRoom(room);
    socket.to(`vybe-room-${roomId}`).emit("vybe-user-typing", {
      room: roomId,
      typing: Boolean(typing),
    });
  });


  socket.on("join-whisper", ({ conversationId }) => {
    if (!socket.user?.id || !conversationId) return;
    socket.join(`whisper-${conversationId}`);
  });

  socket.on("leave-whisper", ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`whisper-${conversationId}`);
  });

  socket.on("whisper-typing", ({ conversationId, typing }) => {
    if (!socket.user?.id || !conversationId) return;
    socket.to(`whisper-${conversationId}`).emit("whisper-user-typing", {
      conversationId,
      userId: socket.user.id.toString(),
      typing: Boolean(typing),
    });
  });

socket.on("leave-vybe-room", ({ room = "general" }) => {
  const roomId = normalizeVybeRoom(room);
  socket.leave(`vybe-room-${roomId}`);

  if (socket.user?.id) {
    removeVybeRoomUser(roomId, socket.user.id);
  }

  if (socket.currentVybeRoom === roomId) {
    socket.currentVybeRoom = null;
  }

  emitVybeRoomCount(roomId);
});

socket.on("disconnect", () => {
  const disconnectedUserId = socket.userId;

  if (disconnectedUserId) {
    const wentOffline = removeOnlineSocket(disconnectedUserId, socket.id);

    if (wentOffline) {
      // Show the user as offline immediately, but delay writing lastSeen.
      // If the same user reconnects quickly, this timer is cancelled in addOnlineSocket().
      emitPresenceUpdate();

      cancelLastSeenTimer(disconnectedUserId);
      const timer = setTimeout(async () => {
        lastSeenTimers.delete(disconnectedUserId);

        // Safety check: never update lastSeen if the user came back online.
        if (onlineUsers.has(disconnectedUserId)) return;

        const lastSeen = await markUserLastSeen(disconnectedUserId);
        io.emit("whisper-user-presence", {
          userId: disconnectedUserId,
          lastSeen: lastSeen?.toISOString?.() || null,
        });
      }, LAST_SEEN_GRACE_MS);

      lastSeenTimers.set(disconnectedUserId, timer);
    }
  }

  if (socket.user?.id && socket.currentVybeRoom) {
    removeVybeRoomUser(socket.currentVybeRoom, socket.user.id);
    emitVybeRoomCount(socket.currentVybeRoom);
  }

  logger.info("Socket disconnected:", socket.id);
});
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many auth attempts. Please try again later.",
  },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many uploads. Please slow down.",
  },
});

app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

const safeMongoSanitize = (req, res, next) => {
  mongoSanitize.sanitize(req.body, {
    replaceWith: "_",
  });

  mongoSanitize.sanitize(req.params, {
    replaceWith: "_",
  });

  next();
};

app.use(safeMongoSanitize);
app.use(generalLimiter);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("API running");
});


// AUTH ROUTES
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadLimiter, uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/vybe-room", vybeRoomRoutes);
app.use("/api/whispers", whisperRoutes);

// ERROR MIDDLEWARE
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION:", err);
});