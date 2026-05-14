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
const User = require("./models/User");
const Post = require("./models/Post");

const { protect } = require("./middleware/authMiddleware");
const postRoutes = require("./routes/postRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");


connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
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

app.use(cors({
  origin: "*", 
  credentials: true
}));
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



// GET PROFILE - old frontend compatibility
app.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("followers", "name username email profilePic bio")
      .populate("following", "name username email profilePic bio");

    res.send(user);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// UPDATE PROFILE - old frontend compatibility
app.put("/profile", protect, async (req, res) => {
  try {
    const { name, bio, profilePic, username } = req.body;
    const update = {};

    if (name !== undefined) update.name = name.toString().trim().slice(0, 40);
    if (bio !== undefined) update.bio = bio.toString().trim().slice(0, 160);
    if (profilePic !== undefined) update.profilePic = profilePic;

    if (username !== undefined) {
      const cleanUsername = username.toString().trim().toLowerCase();

      if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
        return res.status(400).json({
          message: "Username must be 3-20 characters and can contain only lowercase letters, numbers and underscore",
        });
      }

      const existingUser = await User.findOne({
        username: cleanUsername,
        _id: { $ne: req.user.id },
      });

      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }

      update.username = cleanUsername;
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
      .select("-password")
      .populate("followers", "name username email profilePic bio")
      .populate("following", "name username email profilePic bio");

    res.send(user);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});



// SEARCH USERS
app.get("/search", async (req, res) => {
  const { name } = req.query;

  try {
    const users = await User.find({
      name: { $regex: name, $options: "i" }
    }).select("name email");

    res.send(users);
  } catch (err) {
    res.send(err);
  }
});

// LIKE POST
app.post("/like/:postId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }

    if (post.likes.includes(req.user.id)) {
      return res.send({ message: "Already liked" });
    }

    post.likes.push(req.user.id);
    await post.save();

    res.send(post);

  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// CREATE POST
app.post("/create-post", protect, async (req, res) => {
  try {
    const { content } = req.body;

    const post = new Post({
      content,
      user: req.user.id
    });

    await post.save();

    res.send(post);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// UPLOAD PROFILE PIC
app.post("/upload-profile-pic", protect, async (req, res) => {
  try {
    const { profilePic } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic },
      { new: true }
    );

    res.send(user);
  } catch (err) {
    res.send(err);
  }
});

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