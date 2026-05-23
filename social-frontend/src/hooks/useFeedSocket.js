import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

function useFeedSocket({
  token,
  setPosts,
  setCommentsSheetPost,
  setLikesModalPost,
  setGalleryPost,
}) {
  const feedSocketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const socketUrl =
      process.env.REACT_APP_SOCKET_URL ||
      process.env.REACT_APP_API_URL ||
      "http://localhost:5000";

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: {
        token,
      },
    });

    feedSocketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register-user");
    });

    socket.on("post-created", (newPost) => {
      setPosts((prevPosts) => {
        const alreadyExists = prevPosts.some(
          (post) => post._id === newPost._id
        );
        if (alreadyExists) return prevPosts;

        return [newPost, ...prevPosts];
      });
    });

    socket.on("post-updated", (updatedPost) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === updatedPost._id ? updatedPost : post
        )
      );

      setCommentsSheetPost((current) =>
        current?._id === updatedPost._id ? updatedPost : current
      );

      setLikesModalPost((current) =>
        current?._id === updatedPost._id ? updatedPost : current
      );

      setGalleryPost((current) =>
        current?._id === updatedPost._id ? updatedPost : current
      );
    });

    socket.on("post-deleted", ({ postId }) => {
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));

      setCommentsSheetPost((current) =>
        current?._id === postId ? null : current
      );

      setLikesModalPost((current) =>
        current?._id === postId ? null : current
      );

      setGalleryPost((current) =>
        current?._id === postId ? null : current
      );
    });

    return () => {
      socket.off("post-created");
      socket.off("post-updated");
      socket.off("post-deleted");
      socket.disconnect();
    };
  }, [
    token,
    setPosts,
    setCommentsSheetPost,
    setLikesModalPost,
    setGalleryPost,
  ]);

  return feedSocketRef;
}

export default useFeedSocket;
