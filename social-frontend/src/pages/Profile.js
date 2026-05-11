import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import axios from "axios";

import "./Profile.css";

function Profile() {

  const [user, setUser] =
    useState(null);

  const [posts, setPosts] =
    useState([]);

  const [edit, setEdit] =
    useState(false);

  const [name, setName] =
    useState("");

  const [bio, setBio] =
    useState("");

  const token =
    localStorage.getItem("token");

  // FETCH PROFILE
  const fetchProfile =
    useCallback(async () => {

      try {

        const res = await axios.get(
          "http://localhost:5000/profile",
          {
            headers: {
              Authorization:
                "Bearer " + token,
            },
          }
        );

        setUser(res.data);

        setName(res.data.name || "");

        setBio(res.data.bio || "");

      } catch (err) {

        console.log(err);

      }

    }, [token]);

  // FETCH USER POSTS
  const fetchPosts =
    useCallback(async () => {

      try {

        const res = await axios.get(
          "http://localhost:5000/api/posts/my-posts",
          {
            headers: {
              Authorization:
                "Bearer " + token,
            },
          }
        );

        setPosts(
          Array.isArray(res.data)
            ? res.data
            : []
        );

      } catch (err) {

        console.log(err);

        setPosts([]);

      }

    }, [token]);

  // LOAD DATA
  useEffect(() => {

    fetchProfile();

    fetchPosts();

  }, [fetchProfile, fetchPosts]);

  // UPDATE PROFILE
  const updateProfile =
    async () => {

      try {

        await axios.put(
          "http://localhost:5000/profile",
          {
            name,
            bio,
          },
          {
            headers: {
              Authorization:
                "Bearer " + token,
            },
          }
        );

        setEdit(false);

        fetchProfile();

      } catch (err) {

        console.log(err);

      }

    };

  // UPDATE PROFILE PIC
  const updateProfilePic =
    async (url) => {

      if (!url) return;

      try {

        await axios.put(
          "http://localhost:5000/profile",
          {
            profilePic: url,
          },
          {
            headers: {
              Authorization:
                "Bearer " + token,
            },
          }
        );

        fetchProfile();

      } catch (err) {

        console.log(err);

      }

    };

  return (
    <div className="profile-container">

      {/* HEADER */}
      <div className="profile-header">

        {/* PROFILE IMAGE */}
        <div className="avatar">

          {user?.profilePic ? (

            <img
              src={user.profilePic}
              alt="profile"
            />

          ) : (

            user?.name?.charAt(0) || "U"

          )}

        </div>

        {/* PROFILE INFO */}
        <div className="profile-info">

          {edit ? (
            <>

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Name"
                className="profile-input"
              />

              <textarea
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value)
                }
                placeholder="Bio"
                className="profile-textarea"
              />

              <input
                type="text"
                placeholder="Profile image URL"
                className="profile-input"
                onBlur={(e) =>
                  updateProfilePic(
                    e.target.value
                  )
                }
              />

              <button
                onClick={updateProfile}
                className="save-btn"
              >
                Save
              </button>

            </>
          ) : (
            <>

              <h2>
                {user?.name}
              </h2>

              <p>
                {user?.bio ||
                  "No bio yet"}
              </p>

              {/* STATS */}
              <div className="stats">

                <span>
                  <b>
                    {posts.length}
                  </b>{" "}
                  Posts
                </span>

                <span>
                  <b>0</b>{" "}
                  Followers
                </span>

                <span>
                  <b>0</b>{" "}
                  Following
                </span>

              </div>

              <button
                onClick={() =>
                  setEdit(true)
                }
                className="edit-btn"
              >
                Edit Profile
              </button>

            </>
          )}

        </div>

      </div>

      {/* POSTS SECTION */}
      <div className="profile-posts">

        <h3>
          Your Posts
        </h3>

        {posts.length === 0 ? (

          <p>
            No posts yet
          </p>

        ) : (

          <div className="post-grid">

            {posts.map((post) => (

              <div
                className="post-card"
                key={post._id}
              >

                {/* MEDIA */}
                {post.media &&
                  post.media.length > 0 && (

                    post.media[0].type ===
                    "image" ? (

                      <img
                        src={
                          post.media[0].url
                        }
                        alt=""
                        className="profile-post-img"
                      />

                    ) : (

                      <video
                        src={
                          post.media[0].url
                        }
                        controls
                        className="profile-post-img"
                      />

                    )

                  )}

                {/* CAPTION */}
                <p>
                  {post.caption ||
                    post.content}
                </p>

                {/* LIKES */}
                <small>
                  ❤️{" "}
                  {post.likes?.length || 0}
                </small>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default Profile;