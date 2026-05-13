const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const notificationRoutes = require("./routes/notificationRoutes");
const vybeRoomRoutes = require("./routes/vybeRoomRoutes");



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



// GET PROFILE
app.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.send(user);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// UPDATE PROFILE
app.put("/profile", protect, async (req, res) => {
  try {
    const { name, bio, profilePic } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, profilePic },
      { new: true }
    );

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION:", err);
});