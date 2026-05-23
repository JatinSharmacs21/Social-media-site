export const getMediaUrl = (item) => {
  return item?.url || item?.secure_url || item?.mediaUrl || item?.src || "";
};

export const isImageMedia = (item) => {
  const type = (item?.type || item?.resource_type || "").toLowerCase();
  const url = getMediaUrl(item).toLowerCase();

  return (
    type.includes("image") ||
    url.endsWith(".jpg") ||
    url.endsWith(".jpeg") ||
    url.endsWith(".png") ||
    url.endsWith(".webp") ||
    url.endsWith(".gif")
  );
};

export const hasVideoMedia = (post) => {
  return post?.media?.some((item) => {
    const type = (item?.type || item?.resource_type || "").toLowerCase();
    const url = getMediaUrl(item).toLowerCase();

    return (
      type.includes("video") ||
      url.endsWith(".mp4") ||
      url.endsWith(".mov") ||
      url.endsWith(".webm")
    );
  });
};

export const getPostKind = (post) => {
  const hasMedia = post?.media && post.media.length > 0;

  if (!hasMedia) return "Thought";

  const hasVideo = post.media.some((item) => {
    const type = (item?.type || item?.resource_type || "").toLowerCase();
    const url = getMediaUrl(item).toLowerCase();

    return (
      type.includes("video") ||
      url.endsWith(".mp4") ||
      url.endsWith(".mov") ||
      url.endsWith(".webm")
    );
  });

  if (hasVideo) return "Clip";
  return "Moment";
};

export const getHeartAnimationSize = (postKind) => {
  if (postKind === "Thought") return "text-[54px] sm:text-[68px]";
  if (postKind === "Moment") return "text-[88px] sm:text-[115px]";
  return "text-[78px] sm:text-[100px]";
};

export const formatVybeTime = (date) => {
  if (!date) return "";

  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
};