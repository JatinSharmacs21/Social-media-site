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
      trim: true,
      maxlength: 1200,
      default: "",
    },
    media: {
      url: { type: String, trim: true, default: "" },
      type: { type: String, enum: ["image", "video", ""], default: "" },
      name: { type: String, trim: true, maxlength: 180, default: "" },
      size: { type: Number, default: 0 },
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
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          enum: ["❤️", "😂", "🔥", "👀", "😮"],
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

whisperMessageSchema.index({ conversation: 1, createdAt: -1 });
whisperMessageSchema.index({ sender: 1, createdAt: -1 });
whisperMessageSchema.index({ replyTo: 1 });

whisperMessageSchema.pre("validate", function validateTextOrMedia() {
  const hasText = Boolean(String(this.text || "").trim());
  const hasMedia = Boolean(this.media?.url && this.media?.type);

  if (!hasText && !hasMedia) {
    this.invalidate("text", "Message text or media is required");
  }
});
whisperMessageSchema.index({ "reactions.user": 1 });

module.exports = mongoose.model("WhisperMessage", whisperMessageSchema);
