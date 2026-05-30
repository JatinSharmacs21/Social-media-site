const mongoose = require("mongoose");

const reactionUserSchema = [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
];

const reactionsSchema = {
  felt: reactionUserSchema,
  real: reactionUserSchema,
  same: reactionUserSchema,
  chaos: reactionUserSchema,
  needed: reactionUserSchema,
  // Backward compatibility with older messages/reactions.
  like: reactionUserSchema,
  dislike: reactionUserSchema,
  fire: reactionUserSchema,
  laugh: reactionUserSchema,
};

const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    anonymousName: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    reactions: reactionsSchema,

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const vybeMessageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      default: "general",
      trim: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    anonymousName: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    reactions: reactionsSchema,

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, trim: true, maxlength: 160, default: "reported" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    replies: [replySchema],
  },
  {
    timestamps: true,
  }
);

vybeMessageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model("VybeMessage", vybeMessageSchema);
