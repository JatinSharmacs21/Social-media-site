const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const notificationRoutes = require("./routes/notificationRoutes");
const vybeRoomRoutes = require("./routes/vybeRoomRoutes");

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const postRoutes = require("./routes/postRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");


connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
  origin: ["http://localhost:3000", "https://vybeo.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
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

const addOnlineSocket = (userId, socketId) => {
  const id = userId.toString();

  if (!onlineUsers.has(id)) {
    onlineUsers.set(id, new Set());
  }

  onlineUsers.get(id).add(socketId);
};

const removeOnlineSocket = (userId, socketId) => {
  const id = userId?.toString();
  if (!id || !onlineUsers.has(id)) return;

  const sockets = onlineUsers.get(id);
  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(id);
  }
};

// Vybe room users count
const vybeOnlineUsers = new Set();

app.set("onlineUsers", onlineUsers);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Frontend Navbar emits this after login.
  // This helps backend send realtime notification to one specific user.
 socket.on("register-user", () => {
  if (!socket.user?.id) return;

  const id = socket.user.id.toString();
  socket.userId = id;
  addOnlineSocket(id, socket.id);

  console.log("Realtime user registered:", id);
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
  socket.join(`vybe-room-${room}`);

  if (socket.user?.id) {
    vybeOnlineUsers.add(socket.user.id.toString());
  }

  io.to(`vybe-room-${room}`).emit(
    "vybe-online-users",
    vybeOnlineUsers.size
  );
});

  socket.on("vybe-typing", ({ room, typing }) => {
    socket.to(`vybe-room-${room}`).emit(
      "vybe-user-typing",
      typing
    );
  });

socket.on("leave-vybe-room", ({ room = "general" }) => {
  socket.leave(`vybe-room-${room}`);

  if (socket.user?.id) {
    vybeOnlineUsers.delete(socket.user.id.toString());
  }

  io.to(`vybe-room-${room}`).emit(
    "vybe-online-users",
    vybeOnlineUsers.size
  );
});

socket.on("disconnect", () => {
  if (socket.userId) {
    removeOnlineSocket(socket.userId, socket.id);
    vybeOnlineUsers.delete(socket.userId);
  }

  console.log("Socket disconnected:", socket.id);
});
});

const allowedOrigins = [
  "http://localhost:3000",
  "https://vybeo.vercel.app",
];

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
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
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

// ERROR MIDDLEWARE
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION:", err);
});