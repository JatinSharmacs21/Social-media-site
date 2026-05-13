const mongoose = require("mongoose");

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
    },

    reactions: {
      like: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      dislike: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      fire: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      laugh: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
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
    },

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
    },

    reactions: {
      like: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      dislike: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      fire: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      laugh: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    replies: [replySchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "VybeMessage",
  vybeMessageSchema
);