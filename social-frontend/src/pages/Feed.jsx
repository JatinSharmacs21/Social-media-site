import React, { useEffect, useState } from "react";
import API from "../services/api";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const [commentText, setCommentText] = useState({});
  const [replyText, setReplyText] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [replyingTo, setReplyingTo] = useState({});

  const [editingPostId, setEditingPostId] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [lastTap, setLastTap] = useState({});

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const authConfig = {
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  const fetchPosts = async () => {
    try {
      const res = await API.get("/api/posts");
      setPosts(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const updatePostInState = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const createPost = async () => {
    try {
      if (!caption.trim() && !selectedFile) return;

      setLoading(true);

      let media = [];

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await API.post("/api/upload", formData, {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "multipart/form-data",
          },
        });

        media.push(uploadRes.data);
      }

      const newPost = await API.post(
        "/api/posts/create",
        {
          caption: caption.trim(),
          media,
        },
        authConfig
      );

      setPosts([newPost.data, ...posts]);
      setCaption("");
      setSelectedFile(null);
      setPreview("");
    } catch (error) {
      console.log(error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (id) => {
    try {
      const res = await API.put(`/api/posts/like/${id}`, {}, authConfig);
      updatePostInState(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const handleDoubleTap = (postId) => {
    const now = Date.now();
    const previousTap = lastTap[postId] || 0;

    if (now - previousTap < 300) {
      likePost(postId);
      setLastTap((prev) => ({
        ...prev,
        [postId]: 0,
      }));
    } else {
      setLastTap((prev) => ({
        ...prev,
        [postId]: now,
      }));
    }
  };

  const addComment = async (postId) => {
    try {
      const text = commentText[postId];

      if (!text || !text.trim()) return;

      const res = await API.post(
        `/api/posts/comment/${postId}`,
        {
          text: text.trim(),
        },
        authConfig
      );

      updatePostInState(res.data);

      setCommentText((prev) => ({
        ...prev,
        [postId]: "",
      }));

      setOpenComments((prev) => ({
        ...prev,
        [postId]: true,
      }));
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      const res = await API.delete(
        `/api/posts/comment/${postId}/${commentId}`,
        authConfig
      );

      updatePostInState(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const likeComment = async (postId, commentId) => {
    try {
      const res = await API.put(
        `/api/posts/comment/like/${postId}/${commentId}`,
        {},
        authConfig
      );

      updatePostInState(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const addReply = async (postId, commentId) => {
    try {
      const key = `${postId}-${commentId}`;
      const text = replyText[key];

      if (!text || !text.trim()) return;

      const res = await API.post(
        `/api/posts/comment/reply/${postId}/${commentId}`,
        {
          text: text.trim(),
        },
        authConfig
      );

      updatePostInState(res.data);

      setReplyText((prev) => ({
        ...prev,
        [key]: "",
      }));

      setReplyingTo((prev) => ({
        ...prev,
        [key]: false,
      }));
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const deleteReply = async (postId, commentId, replyId) => {
    try {
      const res = await API.delete(
        `/api/posts/comment/reply/${postId}/${commentId}/${replyId}`,
        authConfig
      );

      updatePostInState(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const startEditPost = (post) => {
    setEditingPostId(post._id);
    setEditCaption(post.caption || post.content || "");
    setOpenMenuId(null);
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditCaption("");
  };

  const saveEditPost = async (postId) => {
    try {
      const res = await API.put(
        `/api/posts/${postId}`,
        {
          caption: editCaption.trim(),
        },
        authConfig
      );

      updatePostInState(res.data);
      setEditingPostId(null);
      setEditCaption("");
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const deletePost = async (postId) => {
    try {
      const confirmDelete = window.confirm("Delete this post?");
      if (!confirmDelete) return;

      await API.delete(`/api/posts/${postId}`, authConfig);

      setPosts((prevPosts) =>
        prevPosts.filter((post) => post._id !== postId)
      );

      setOpenMenuId(null);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-4 py-5 sm:py-6">
      <div className="w-full max-w-2xl mx-auto">
        {/* CREATE POST */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPost();
          }}
          className="bg-zinc-950 border border-white/10 rounded-3xl p-4 sm:p-5 mb-8 shadow-xl w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 flex items-center justify-center font-bold text-lg shrink-0">
              V
            </div>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 outline-none focus:border-pink-500 transition-all text-white placeholder:text-gray-400"
            />
          </div>

          {preview && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 bg-black">
              {selectedFile?.type.startsWith("image") ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full max-h-[420px] object-contain bg-black"
                />
              ) : (
                <video
                  src={preview}
                  controls
                  className="w-full max-h-[420px] object-contain bg-black"
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-2xl text-sm transition-all">
              📎 Add Photo/Video
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-7 py-3 rounded-2xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-60"
            >
              {loading ? "Uploading..." : "Post"}
            </button>
          </div>
        </form>

        {/* POSTS */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <h2 className="text-2xl font-bold mb-2">No Posts Yet</h2>
              <p>Start sharing your vibe ✨</p>
            </div>
          ) : (
            posts.map((post) => {
              const isPostOwner = post.user?._id === currentUserId;
              const commentsOpen = openComments[post._id];

              return (
                <div
                  key={post._id}
                  className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-xl w-full"
                >
                  {/* HEADER */}
                  <div className="flex items-center justify-between p-4 relative">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          post.user?.profilePic ||
                          "https://via.placeholder.com/100"
                        }
                        alt=""
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-white/10 shrink-0"
                      />

                      <div className="min-w-0">
                        <h4 className="font-semibold text-white truncate">
                          {post.user?.name || "Unknown User"}
                        </h4>

                        <p className="text-xs text-gray-400 truncate">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleString()
                            : ""}
                        </p>
                      </div>
                    </div>

                    {isPostOwner && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === post._id ? null : post._id
                            )
                          }
                          className="text-gray-400 hover:text-white text-xl px-2"
                        >
                          ⋮
                        </button>

                        {openMenuId === post._id && (
                          <div className="absolute right-0 top-8 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden w-36 z-20 shadow-xl">
                            <button
                              onClick={() => startEditPost(post)}
                              className="block w-full text-left px-4 py-3 hover:bg-white/10 text-sm"
                            >
                              Edit caption
                            </button>

                            <button
                              onClick={() => deletePost(post._id)}
                              className="block w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-400 text-sm"
                            >
                              Delete post
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CAPTION / EDIT */}
                  {editingPostId === post._id ? (
                    <div className="px-4 pb-4">
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 outline-none focus:border-pink-500 text-white"
                        rows="3"
                      />

                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => saveEditPost(post._id)}
                          className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-sm"
                        >
                          Save
                        </button>

                        <button
                          onClick={cancelEditPost}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    (post.caption || post.content) && (
                      <p className="px-4 pb-4 text-gray-200 leading-relaxed break-words">
                        {post.caption || post.content}
                      </p>
                    )
                  )}

                  {/* MEDIA */}
                  {post.media &&
                    post.media.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleDoubleTap(post._id)}
                        className="w-full bg-black flex items-center justify-center cursor-pointer select-none"
                      >
                        {item.type === "image" ? (
                          <img
                            src={item.url}
                            alt=""
                            className="w-full max-h-[650px] object-contain bg-black"
                          />
                        ) : (
                          <video
                            src={item.url}
                            controls
                            className="w-full max-h-[650px] object-contain bg-black"
                          />
                        )}
                      </div>
                    ))}

                  {/* ACTIONS */}
                  <div className="p-4">
                    <div className="flex items-center gap-6 mb-4">
                      <button
                        onDoubleClick={() => likePost(post._id)}
                        className="flex items-center gap-2 hover:text-pink-400 transition-all"
                        title="Double click to like/unlike"
                      >
                        ❤️ <span>{post.likes?.length || 0}</span>
                      </button>

                      <button
                        onClick={() =>
                          setOpenComments((prev) => ({
                            ...prev,
                            [post._id]: !prev[post._id],
                          }))
                        }
                        className="flex items-center gap-2 hover:text-indigo-400 transition-all"
                      >
                        💬 <span>{post.comments?.length || 0}</span>
                      </button>

                      <button className="hover:text-green-400 transition-all">
                        📤
                      </button>
                    </div>

                    {/* COMMENTS PANEL */}
                    {commentsOpen && (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">
                            Comments
                          </h3>

                          <button
                            onClick={() =>
                              setOpenComments((prev) => ({
                                ...prev,
                                [post._id]: false,
                              }))
                            }
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            Hide
                          </button>
                        </div>

                        {/* COMMENT INPUT */}
                        <div className="flex items-center gap-2 mb-5">
                          <input
                            type="text"
                            value={commentText[post._id] || ""}
                            onChange={(e) =>
                              setCommentText((prev) => ({
                                ...prev,
                                [post._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addComment(post._id);
                              }
                            }}
                            placeholder="Add a comment..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 text-sm"
                          />

                          <button
                            onClick={() => addComment(post._id)}
                            className="px-4 py-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500 text-sm transition-all"
                          >
                            Send
                          </button>
                        </div>

                        {/* COMMENTS */}
                        {post.comments && post.comments.length > 0 ? (
                          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                            {post.comments.map((comment) => {
                              const isCommentOwner =
                                comment.user?._id === currentUserId;

                              const canDeleteComment =
                                isCommentOwner || isPostOwner;

                              const replyKey = `${post._id}-${comment._id}`;
                              const isReplying = replyingTo[replyKey];

                              return (
                                <div
                                  key={comment._id}
                                  className="bg-white/[0.04] border border-white/5 rounded-2xl p-3"
                                >
                                  <div className="flex items-start gap-3">
                                    <img
                                      src={
                                        comment.user?.profilePic ||
                                        "https://via.placeholder.com/100"
                                      }
                                      alt=""
                                      className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                                    />

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-white text-sm truncate">
                                          {comment.user?.name || "User"}
                                        </p>

                                        {canDeleteComment && (
                                          <button
                                            onClick={() =>
                                              deleteComment(
                                                post._id,
                                                comment._id
                                              )
                                            }
                                            className="text-red-400 hover:text-red-300 text-xs shrink-0"
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </div>

                                      <p className="text-gray-300 text-sm mt-1 break-words">
                                        {comment.text}
                                      </p>

                                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                        <button
                                          onClick={() =>
                                            likeComment(post._id, comment._id)
                                          }
                                          className="hover:text-pink-400"
                                        >
                                          ❤️ {comment.likes?.length || 0}
                                        </button>

                                        <button
                                          onClick={() =>
                                            setReplyingTo((prev) => ({
                                              ...prev,
                                              [replyKey]: !prev[replyKey],
                                            }))
                                          }
                                          className="hover:text-indigo-400"
                                        >
                                          Reply
                                        </button>
                                      </div>

                                      {/* REPLIES */}
                                      {comment.replies &&
                                        comment.replies.length > 0 && (
                                          <div className="mt-3 ml-2 border-l border-white/10 pl-3 space-y-3">
                                            {comment.replies.map((reply) => {
                                              const isReplyOwner =
                                                reply.user?._id === currentUserId;

                                              const canDeleteReply =
                                                isReplyOwner || isPostOwner;

                                              return (
                                                <div
                                                  key={reply._id}
                                                  className="flex items-start gap-2"
                                                >
                                                  <img
                                                    src={
                                                      reply.user?.profilePic ||
                                                      "https://via.placeholder.com/100"
                                                    }
                                                    alt=""
                                                    className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                                                  />

                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                      <p className="text-sm">
                                                        <span className="font-semibold text-white mr-2">
                                                          {reply.user?.name ||
                                                            "User"}
                                                        </span>

                                                        <span className="text-gray-300">
                                                          {reply.text}
                                                        </span>
                                                      </p>

                                                      {canDeleteReply && (
                                                        <button
                                                          onClick={() =>
                                                            deleteReply(
                                                              post._id,
                                                              comment._id,
                                                              reply._id
                                                            )
                                                          }
                                                          className="text-red-400 text-xs ml-2"
                                                        >
                                                          Delete
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                      {/* REPLY INPUT */}
                                      {isReplying && (
                                        <div className="flex items-center gap-2 mt-3">
                                          <input
                                            type="text"
                                            value={replyText[replyKey] || ""}
                                            onChange={(e) =>
                                              setReplyText((prev) => ({
                                                ...prev,
                                                [replyKey]: e.target.value,
                                              }))
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                addReply(
                                                  post._id,
                                                  comment._id
                                                );
                                              }
                                            }}
                                            placeholder="Write a reply..."
                                            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm"
                                          />

                                          <button
                                            onClick={() =>
                                              addReply(post._id, comment._id)
                                            }
                                            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-indigo-500 text-xs"
                                          >
                                            Reply
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-6">
                            No comments yet. Be the first one ✨
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Feed;