const mongoose = require("mongoose");

const whisperMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WhisperMessage",
      default: null,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

whisperMessageSchema.index({ conversation: 1, createdAt: -1 });
whisperMessageSchema.index({ sender: 1, createdAt: -1 });
whisperMessageSchema.index({ replyTo: 1 });

module.exports = mongoose.model("WhisperMessage", whisperMessageSchema);
