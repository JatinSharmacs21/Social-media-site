import React, { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import "./Feed.css";


function Feed() {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // FETCH POSTS
  const fetchPosts = async () => {
    try {
      const res = await API.get(
        "/api/posts"
      );

      setPosts(res.data);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // SELECT FILE
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);

    setPreview(URL.createObjectURL(file));
  };

  // CREATE POST
  const createPost = async () => {
    try {
      if (!caption && !selectedFile) {
        return;
      }

      setLoading(true);

      let media = [];

      // UPLOAD FILE
      if (selectedFile) {

        const formData = new FormData();

        formData.append("file", selectedFile);

        const uploadRes = await API.post(
          "/api/upload",
          formData,
          {
            headers: {
              Authorization:
                "Bearer " + token,

              "Content-Type":
                "multipart/form-data",
            },
          }
        );

        media.push(uploadRes.data);
      }

      // CREATE POST
      const newPost = await API.post(
        "/api/posts/create",
        {
          caption,
          media,
        },
        {
          headers: {
            Authorization:
              "Bearer " + token,
          },
        }
      );

      // INSTANT UPDATE
      setPosts([newPost.data, ...posts]);

      // RESET
      setCaption("");

      setSelectedFile(null);

      setPreview("");

    } catch (error) {
      console.log(error.response?.data || error);

    } finally {
      setLoading(false);
    }
  };

  // LIKE / UNLIKE
  const likePost = async (id) => {
    try {

      const res = await API.put(
        `/api/posts/like/${id}`,
        {},
        {
          headers: {
            Authorization:
              "Bearer " + token,
          },
        }
      );

      // UPDATE UI INSTANTLY
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === id ? res.data : post
        )
      );

    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  return (
    <div className="feed-container">

      <Navbar />

      {/* CREATE POST */}
      <form
        className="create-post"
        onSubmit={(e) => {
          e.preventDefault();
          createPost();
        }}
      >

        {/* CAPTION */}
        <input
          type="text"
          value={caption}
          onChange={(e) =>
            setCaption(e.target.value)
          }
          placeholder="What's on your mind..."
        />

        {/* FILE */}
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
        />

        {/* PREVIEW */}
        {preview && (
          <div className="preview-container">

            {selectedFile?.type.startsWith("image") ? (
              <img
                src={preview}
                alt="preview"
                width="250"
                style={{
                  borderRadius: "10px",
                  marginTop: "10px",
                }}
              />
            ) : (
              <video
                src={preview}
                controls
                width="250"
                style={{
                  borderRadius: "10px",
                  marginTop: "10px",
                }}
              />
            )}

          </div>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Uploading..."
            : "Post"}
        </button>

      </form>

      {/* POSTS */}
      <div className="posts">

        {posts.length === 0 ? (
          <h2>No Posts Yet</h2>
        ) : (
          posts.map((post) => (

            <div
              className="post-card"
              key={post._id}
            >

              {/* USER */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >

                <img
                  src={
                    post.user?.profilePic ||
                    "https://via.placeholder.com/40"
                  }
                  alt=""
                  width="40"
                  height="40"
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />

                <div>
                  <h4>
                    {post.user?.name}
                  </h4>

                  <small>
                    {new Date(
                      post.createdAt
                    ).toLocaleString()}
                  </small>
                </div>

              </div>

              {/* CAPTION */}
              <p>
                {post.caption ||
                  post.content}
              </p>

              {/* MEDIA */}
              {post.media &&
                post.media.map(
                  (item, index) => (
                    <div key={index}>

                      {item.type ===
                      "image" ? (
                        <img
                          src={item.url}
                          alt=""
                          width="300"
                          style={{
                            borderRadius: "10px",
                            marginTop: "10px",
                          }}
                        />
                      ) : (
                        <video
                          src={item.url}
                          controls
                          width="300"
                          style={{
                            borderRadius: "10px",
                            marginTop: "10px",
                          }}
                        />
                      )}

                    </div>
                  )
                )}

              {/* LIKE */}
              <button
                onClick={() =>
                  likePost(post._id)
                }
                style={{
                  marginTop: "10px",
                }}
              >
                ❤️ {post.likes?.length || 0}
              </button>

              {/* COMMENTS */}
              <div
                style={{
                  marginTop: "10px",
                }}
              >

                {post.comments &&
                  post.comments.map(
                    (comment) => (
                      <p
                        key={comment._id}
                      >
                        <b>
                          {
                            comment.user
                              ?.name
                          }
                        </b>

                        : {comment.text}
                      </p>
                    )
                  )}

              </div>

            </div>
          ))
        )}

      </div>
    </div>
  );
}

export default Feed;