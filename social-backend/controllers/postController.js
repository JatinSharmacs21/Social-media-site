const Post = require("../models/Post");

// CREATE POST
const createPost = async (req, res) => {
  try {
    const { caption, media } = req.body;

    const post = await Post.create({
      user: req.user.id,
      caption,
      media,
    });

    const populatedPost = await Post.findById(post._id)
      .populate("user", "name email profilePic");

    res.status(201).json(populatedPost);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL POSTS
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email profilePic")
      .populate("likes", "name")
      .populate("comments.user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// LIKE / UNLIKE POST
const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const userLiked = post.likes.some(
      (like) => like.toString() === req.user.id
    );

    if (userLiked) {
      post.likes = post.likes.filter(
        (like) => like.toString() !== req.user.id
      );
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("user", "name profilePic")
      .populate("likes", "name");

    res.json(updatedPost);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ADD COMMENT
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = {
      user: req.user.id,
      text,
    };

    post.comments.push(comment);

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("comments.user", "name profilePic");

    res.json(updatedPost);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE COMMENT
const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    post.comments = post.comments.filter(
      (comment) =>
        comment._id.toString() !== req.params.commentId
    );

    await post.save();

    res.json(post);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET MY POSTS
const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.user.id,
    })
      .populate("user", "name email profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.params.userId,
    })
      .populate("user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  toggleLikePost,
  addComment,
  deleteComment,
  getMyPosts,
  getUserPosts,
};