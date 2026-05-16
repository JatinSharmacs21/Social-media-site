const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Post = require("../models/Post");
const User = require("../models/User");

dotenv.config();

const seededReplies = {
  deep: [
    "Kabhi kabhi lagta hai main sabke liye available hu, but mere liye koi nahi.",
    "Main strong dikhata hu, par andar se kaafi tired feel karta hu.",
    "Sabse mushkil hota hai smile karna jab mind bilkul heavy ho.",
    "Kabhi kabhi bas koi bina judge kiye sun le, itna hi kaafi hota hai.",
  ],
  funny: [
    "Mera confidence tab tak high rehta hai jab tak camera open na ho jaye.",
    "Life ka biggest scam: 5 minute ka break kabhi 5 minute ka nahi hota.",
    "Main productive hona chahta hu, par bed mujhe emotional support deta hai.",
    "Aaj ka mood: kuch karna bhi hai aur kuch nahi bhi karna.",
  ],
  chaos: [
    "Unpopular opinion: kabhi kabhi overthinking bhi correct hoti hai.",
    "Log online mature bante hain, real life me seen zone se darte hain.",
    "Sach bolne wale rude nahi hote, bas log comfortable lies sunna chahte hain.",
    "Main calm hu, bas internet connection slow hua to personality change ho jati hai.",
  ],
  chill: [
    "Aaj bas slow music, cold drink aur no drama wali vibe chahiye.",
    "Kabhi kabhi simple day hi best day hota hai.",
    "Peace ka matlab boring life nahi hota, balanced life hota hai.",
    "Thoda pause lena bhi progress ka part hai.",
  ],
  creative: [
    "Meri life ka title hota: Loading… but still trying.",
    "Agar emotions ka color hota to mera mood purple-blue hota.",
    "Main apni story ka main character hu, bas script kabhi kabhi confusing hoti hai.",
    "Creativity tab aati hai jab deadlines neck pe baithi hoti hain.",
  ],
  lateNight: [
    "Late night me sabse zyada woh baatein yaad aati hain jo din me ignore kar deta hu.",
    "Raat me mind extra honest ho jata hai.",
    "Kabhi kabhi sleep nahi, bas peace chahiye hoti hai.",
    "Late night thoughts dangerous bhi hote hain aur real bhi.",
  ],
};

const fallbackReplies = [
  "This one feels real.",
  "I think a lot of people can relate to this.",
  "Kabhi kabhi bas yahi feeling hoti hai.",
  "Not gonna lie, this hits different.",
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    let systemUser = await User.findOne({ email: "vybe.community@system.com" });

    if (!systemUser) {
      systemUser = await User.create({
        name: "Vybe Community",
        username: "vybecommunity",
        email: "vybe.community@system.com",
        password: "system123456",
      });
    }

    const drops = await Post.find({ postType: "drop" });

    if (!drops.length) {
      console.log("No drops found. Run seedDrops.js first.");
      process.exit();
    }

    let createdCount = 0;

    for (const drop of drops) {
      const existingSeededReplies = await Post.countDocuments({
        postType: "dropReply",
        drop: drop._id,
        isSeeded: true,
      });

      if (existingSeededReplies >= 3) {
        continue;
      }

      const replies = seededReplies[drop.vybeTag] || fallbackReplies;
      const selectedReplies = replies.slice(0, 4);

      for (const replyText of selectedReplies) {
        await Post.create({
          user: systemUser._id,
          caption: replyText,
          postType: "dropReply",
          drop: drop._id,
          vybeTag: drop.vybeTag || "chill",
          isAnonymous: true,
          isSeeded: true,
        });

        createdCount += 1;
      }
    }

    console.log(`Seeded ${createdCount} Vybe Drop replies successfully.`);
    process.exit();
  } catch (error) {
    console.error("Seed drop replies error:", error);
    process.exit(1);
  }
};

run();