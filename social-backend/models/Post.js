const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    replies: [replySchema],
  },
  {
    timestamps: true,
  }
);

const vybeReactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["felt", "deep", "funny", "chaos", "relatable"],
      required: true,
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    postType: {
      type: String,
      enum: ["normal", "drop", "dropReply"],
      default: "normal",
    },

    vybeTag: {
      type: String,
      enum: ["deep", "funny", "chaos", "chill", "creative", "lateNight"],
      default: "chill",
    },

    drop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    isSeeded: {
      type: Boolean,
      default: false,
    },

    caption: {
      type: String,
      default: "",
    },

    media: [
      {
        url: String,

        type: {
          type: String,
          enum: ["image", "video"],
        },
      },
    ],

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    vybeReactions: [vybeReactionSchema],
    threadReplies: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    parentReply: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    path: {
      type: String,
      default: "",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
],

    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);