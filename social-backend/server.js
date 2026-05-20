const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const notificationRoutes = require("./routes/notificationRoutes");
const vybeRoomRoutes = require("./routes/vybeRoomRoutes");

const http = require("http");
const { Server } = require("socket.io");

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

// Realtime notification users: userId -> socket.id
const onlineUsers = new Map();

// Vybe room users count
const vybeOnlineUsers = new Set();

app.set("onlineUsers", onlineUsers);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Frontend Navbar emits this after login.
  // This helps backend send realtime notification to one specific user.
  socket.on("register-user", (userId) => {
    if (!userId) return;

    const id = userId.toString();
    socket.userId = id;
    onlineUsers.set(id, socket.id);

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

  socket.on("join-vybe-room", ({ room = "general", userId }) => {
    socket.join(`vybe-room-${room}`);

    if (userId) {
      vybeOnlineUsers.add(userId);
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

  socket.on("leave-vybe-room", ({ room = "general", userId }) => {
    socket.leave(`vybe-room-${room}`);

    if (userId) {
      vybeOnlineUsers.delete(userId);
    }

    io.to(`vybe-room-${room}`).emit(
      "vybe-online-users",
      vybeOnlineUsers.size
    );
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      vybeOnlineUsers.delete(socket.userId);
    } else {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    }

    console.log("Socket disconnected:", socket.id);
  });
});

const allowedOrigins = [
  "http://localhost:3000",
  "https://vybeo.vercel.app",
];

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
app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("API running");
});


// AUTH ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
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