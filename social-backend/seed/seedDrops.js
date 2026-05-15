const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Post = require("../models/Post");
const User = require("../models/User");

dotenv.config();

const drops = [
  {
    caption: "Ek truth jo tum bol nahi paate?",
    vybeTag: "deep",
  },
  {
    caption: "Sabse weird thought jo aaj aaya?",
    vybeTag: "chaos",
  },
  {
    caption: "Aaj kis baat ne hasa diya? 😂",
    vybeTag: "funny",
  },
  {
    caption: "Late night me sabse zyada kya yaad aata h?",
    vybeTag: "lateNight",
  },
  {
    caption: "Apni life ko ek movie title do.",
    vybeTag: "creative",
  },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    let systemUser = await User.findOne({
      email: "vybe@system.com",
    });

    if (!systemUser) {
      systemUser = await User.create({
        name: "Vybe",
        username: "vybe",
        email: "vybe@system.com",
        password: "system123456",
      });
    }

    await Post.insertMany(
      drops.map((drop) => ({
        user: systemUser._id,
        caption: drop.caption,
        postType: "drop",
        vybeTag: drop.vybeTag,
        isSeeded: true,
      }))
    );

    console.log("Vybe Drops Seeded Successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();