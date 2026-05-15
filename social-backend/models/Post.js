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

vybeReactions: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["felt", "deep", "funny", "chaos", "relatable"],
    },
  },
],

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

    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);