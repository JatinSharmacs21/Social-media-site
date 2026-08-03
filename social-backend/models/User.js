const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      default: "",
    },

    profilePic: {
      type: String,
      default: "",
    },

    // When true, this user's Vybe Space is private:
    // profile details, posts, and whispers (DMs) are locked behind
    // an accepted tune-in request (see TuneRequest model).
    isPrivate: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Updated only when the user's last active socket disconnects.
    // Keep null for old/new users until they actually go online/offline once.
    lastSeen: {
      type: Date,
      default: null,
    },

    // Optional audit field: updated when the user registers a realtime session.
    // Do not use this for the public "Last seen" label.
    lastLoginAt: {
      type: Date,
      default: null,
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dropStreak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastReplyDate: { type: String, default: null },
    },

    // People I have blocked. They can no longer see my Vybe Space,
    // posts, or message me, and I stop seeing theirs too.
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Reverse index: people who have blocked me. Kept in sync with
    // their blockedUsers list so we can check "am I blocked" in O(1)
    // without loading the other person's document.
    blockedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);