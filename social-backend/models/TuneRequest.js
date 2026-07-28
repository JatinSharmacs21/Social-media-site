const mongoose = require("mongoose");

// A "Tune In" request — created when someone tries to tune into (follow)
// a private Vybe Space. Must be accepted by the recipient before the
// sender becomes a follower and unlocks the private profile / whispers.
const tuneRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// A sender can only have one active request per recipient at a time.
tuneRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });
tuneRequestSchema.index({ recipient: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("TuneRequest", tuneRequestSchema);