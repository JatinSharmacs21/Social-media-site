import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

function Profile() {
  const { userId: profileIdentifier } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");
  const isOwnProfile = !profileIdentifier || profileIdentifier === currentUserId;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [edit, setEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("images");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [previewPic, setPreviewPic] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [listModal, setListModal] = useState(null); // followers | following
  const [listSearch, setListSearch] = useState("");

  const [selectedPost, setSelectedPost] = useState(null);
  const [profilePicOpen, setProfilePicOpen] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const isViewingOwnProfile =
    !profileIdentifier || profileIdentifier === currentUserId || user?._id === currentUserId;

  const authConfig = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const avatarUrl = (person) =>
    person?.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      person?.name || person?.username || "User"
    )}&background=8b5cf6&color=fff`;

  const imagePosts = posts.filter((post) => post.media?.[0]?.type === "image");
  const videoPosts = posts.filter((post) => post.media?.[0]?.type === "video");
  const thoughtPosts = posts.filter((post) => !post.media || post.media.length === 0);

  const fetchProfileAndPosts = useCallback(async () => {
    try {
      setError("");

      const cleanIdentifier = profileIdentifier
        ? profileIdentifier.replace(/^@/, "").trim().toLowerCase()
        : "";

      const profileEndpoint = isOwnProfile
        ? "/api/users/me"
        : `/api/users/${encodeURIComponent(cleanIdentifier)}`;

      const profileRes = await API.get(profileEndpoint, authConfig);
      const loadedUser = profileRes.data;

      setUser(loadedUser);
      setName(loadedUser.name || "");
      setUsername(loadedUser.username || "");
      setBio(loadedUser.bio || "");
      setPreviewPic(loadedUser.profilePic || "");

      const postsEndpoint = isOwnProfile
        ? "/api/posts/my-posts"
        : `/api/posts/user/${loadedUser._id}`;

      const postsRes = await API.get(postsEndpoint, authConfig);
      setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
    } catch (err) {
      setPosts([]);
      setError(err.response?.data?.message || "Profile load nahi ho payi");
    }
  }, [authConfig, isOwnProfile, profileIdentifier]);

  useEffect(() => {
    fetchProfileAndPosts();
  }, [fetchProfileAndPosts]);

  const updatePostInState = (updatedPost) => {
    setPosts((prev) => prev.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
    setSelectedPost((prev) => (prev?._id === updatedPost._id ? updatedPost : prev));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file for your profile photo.");
      return;
    }

    setProfileFile(file);
    setPreviewPic(URL.createObjectURL(file));
  };

  const uploadProfileImage = async () => {
    if (!profileFile) return previewPic || user?.profilePic || "";

    const formData = new FormData();
    formData.append("file", profileFile);

    const res = await API.post("/api/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.url;
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
      setError("");

      const uploadedPic = await uploadProfileImage();

      const payload = {
        name,
        bio,
        profilePic: uploadedPic,
      };

      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername) {
        payload.username = cleanUsername;
      }

      const res = await API.put(
        "/api/users/me",
        payload,
        authConfig
      );

      localStorage.setItem("userName", res.data.name || "");
      localStorage.setItem("username", res.data.username || "");

      setUser(res.data);
      setProfileFile(null);
      setEdit(false);

      if (res.data.username && window.location.pathname !== `/profile/${res.data.username}`) {
        navigate(`/profile/${res.data.username}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Profile update nahi ho payi");
    } finally {
      setSaving(false);
    }
  };

  const followUser = async () => {
    try {
      const res = await API.put(`/api/users/follow/${user._id}`, {}, authConfig);
      setUser(res.data.user);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const likePost = async (postId) => {
    try {
      const res = await API.put(`/api/posts/like/${postId}`, {}, authConfig);
      updatePostInState(res.data);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const handleDoubleLike = (post) => {
    likePost(post._id);
    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 1000);
  };

  const addComment = async () => {
    try {
      if (!commentText.trim() || !selectedPost) return;

      const res = await API.post(
        `/api/posts/comment/${selectedPost._id}`,
        { text: commentText.trim() },
        authConfig
      );

      updatePostInState(res.data);
      setCommentText("");
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      const res = await API.delete(`/api/posts/comment/${postId}/${commentId}`, authConfig);
      updatePostInState(res.data);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const isFollowing = user?.followers?.some((f) => f._id === currentUserId);

  const activeList = listModal === "followers" ? user?.followers || [] : user?.following || [];
  const filteredList = activeList.filter((person) => {
    const q = listSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      person?.name?.toLowerCase().includes(q) ||
      person?.username?.toLowerCase().includes(q)
    );
  });

  const openUserProfile = (id) => {
    setListModal(null);
    setListSearch("");
    setSelectedPost(null);
    const targetUser = [...(user?.followers || []), ...(user?.following || []), selectedPost?.user].find(
      (person) => person?._id === id
    );
    const slug = targetUser?.username || id;
    navigate(id === currentUserId ? (user?.username ? `/profile/${user.username}` : "/profile") : `/profile/${slug}`);
  };

  const handleShareProfile = async () => {
    try {
      const slug = user?.username || user?._id || "";
      const profileUrl = `${window.location.origin}/profile/${slug}`;

      if (navigator.share) {
        await navigator.share({
          title: `${user?.name || "Vybeo user"} on Vybeo`,
          text: `Check out ${user?.name || "this profile"} on Vybeo`,
          url: profileUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(profileUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError("Profile link copy nahi ho paya");
    }
  };

  const renderUserRow = (person) => (
    <button
      key={person._id}
      onClick={() => openUserProfile(person._id)}
      className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 text-left hover:bg-white/10 transition-all"
    >
      <img src={avatarUrl(person)} alt="" className="w-12 h-12 rounded-full object-cover" />
      <div className="min-w-0">
        <h3 className="font-semibold truncate">{person.name || "User"}</h3>
        {person.username && <p className="text-sm text-gray-400 truncate">@{person.username}</p>}
      </div>
    </button>
  );

  const renderMediaCard = (post) => (
    <div
      key={post._id}
      onClick={() => setSelectedPost(post)}
      className="bg-zinc-950 border border-white/10 rounded-[24px] sm:rounded-[30px] overflow-hidden group active:scale-[0.98] hover:scale-[1.015] hover:border-pink-400/40 transition-all duration-300 cursor-pointer shadow-xl shadow-black/30"
    >
      <div className="relative overflow-hidden">
        <img src={post.media[0].url} alt="" className="w-full aspect-square sm:h-[320px] object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-3 sm:p-4">
        <p className="text-gray-200 line-clamp-2 text-sm sm:text-base">{post.caption || post.content || "No caption"}</p>
        <div className="flex items-center justify-between mt-3 sm:mt-4 text-xs sm:text-sm text-gray-400">
          <span>❤️ {post.likes?.length || 0}</span>
          <span>💬 {post.comments?.length || 0}</span>
        </div>
      </div>
    </div>
  );

  const renderReelCard = (post) => (
    <div
      key={post._id}
      onClick={() => setSelectedPost(post)}
      className="relative bg-zinc-950 border border-white/10 rounded-[26px] overflow-hidden group active:scale-[0.98] hover:scale-[1.015] hover:border-cyan-300/40 transition-all duration-300 cursor-pointer shadow-xl shadow-black/30"
    >
      <video
        src={post.media[0].url}
        muted
        playsInline
        preload="metadata"
        className="w-full aspect-[9/16] max-h-[520px] object-cover bg-black group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/25" />
      <div className="absolute top-3 right-3 bg-black/55 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold">
        Reel
      </div>
      <div className="absolute left-3 right-3 bottom-3">
        <p className="text-white font-semibold line-clamp-2 text-sm sm:text-base drop-shadow">
          {post.caption || post.content || "Vybeo Reel"}
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs sm:text-sm text-gray-200">
          <span>❤️ {post.likes?.length || 0}</span>
          <span>💬 {post.comments?.length || 0}</span>
        </div>
      </div>
    </div>
  );

  const renderThoughtCard = (post) => (
    <div
      key={post._id}
      onClick={() => setSelectedPost(post)}
      className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-950 to-purple-950/35 border border-white/10 rounded-[28px] p-5 sm:p-7 hover:border-pink-500/35 hover:bg-white/[0.03] transition-all cursor-pointer shadow-xl shadow-black/25 active:scale-[0.99]"
    >
      <div className="absolute -top-20 -right-16 w-44 h-44 bg-pink-500/10 blur-3xl rounded-full" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-pink-200 mb-4">
          ✦ Thought
        </div>
        <p className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed text-white break-words whitespace-pre-wrap">
          {post.caption || post.content || "Text Post"}
        </p>
        <div className="flex items-center justify-between mt-6 text-sm text-gray-400">
          <span>❤️ {post.likes?.length || 0}</span>
          <span>💬 {post.comments?.length || 0}</span>
        </div>
      </div>
    </div>
  );

  if (!user && !error) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-4 py-5 sm:py-6">
      <div className="max-w-5xl mx-auto">
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-zinc-950 border border-white/10 rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 md:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            <div className="flex justify-center md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-indigo-500 blur-2xl opacity-40 rounded-full" />
                <button
                  type="button"
                  onClick={() => setProfilePicOpen(true)}
                  className="relative group rounded-full focus:outline-none focus:ring-4 focus:ring-pink-500/40"
                  title="View profile photo"
                >
                  <img
                    src={previewPic || avatarUrl(user)}
                    alt="Profile"
                    className="w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full object-cover border-4 border-white/10 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:border-pink-400/60"
                  />
                  <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/35 transition-all flex items-end justify-center pb-4 text-xs sm:text-sm font-semibold opacity-0 group-hover:opacity-100">
                    View photo
                  </span>
                </button>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {edit ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                    />
                    <input
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                      }
                      placeholder="username"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                    />
                  </div>

                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio"
                    rows="4"
                    maxLength={160}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none mb-4 resize-none"
                  />

                  <label className="block bg-white/5 border border-dashed border-white/20 rounded-2xl px-5 py-5 mb-5 cursor-pointer hover:bg-white/10">
                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    <span className="font-semibold">Choose a profile photo</span>
                    <p className="text-sm text-gray-400 mt-1">
                      Upload a clear JPG, PNG, or WebP image from your device.
                    </p>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={updateProfile}
                      disabled={saving}
                      className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-6 py-3 rounded-2xl font-semibold disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setEdit(false);
                        setError("");
                        setPreviewPic(user?.profilePic || "");
                        setProfileFile(null);
                      }}
                      className="bg-white/10 px-6 py-3 rounded-2xl"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 text-center md:text-left">
                    <div className="min-w-0">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black break-words">
                        {user?.name || "User"}
                      </h1>
                      {user?.username && (
                        <p className="text-pink-300 mt-2 text-base sm:text-lg font-semibold break-words">
                          @{user.username}
                        </p>
                      )}
                      <p className="text-gray-400 mt-3 text-base sm:text-lg leading-relaxed max-w-2xl break-words">
                        {user?.bio || "No bio yet"}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:min-w-[320px]">
                      {isViewingOwnProfile ? (
                        <button
                          onClick={() => setEdit(true)}
                          className="group relative overflow-hidden bg-white/[0.07] hover:bg-white/[0.11] border border-white/10 hover:border-pink-300/35 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
                        >
                          <span className="relative z-10">✦ Edit Profile</span>
                        </button>
                      ) : (
                        <button
                          onClick={followUser}
                          className={`px-7 py-3 rounded-2xl font-semibold transition-all ${
                            isFollowing
                              ? "bg-white/10 hover:bg-white/20"
                              : "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg hover:scale-105"
                          }`}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </button>
                      )}

                      <button
                        onClick={handleShareProfile}
                        className="group relative overflow-hidden bg-gradient-to-r from-white/[0.1] to-white/[0.06] hover:from-pink-500/20 hover:to-indigo-500/20 border border-white/10 hover:border-indigo-300/35 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
                      >
                        <span className="relative z-10">{shareCopied ? "✓ Link Copied" : "↗ Share Profile"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 mt-8 sm:mt-10">
                    <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl px-2 sm:px-6 py-4 sm:py-5 text-center">
                      <h2 className="text-2xl sm:text-3xl font-black">{posts.length}</h2>
                      <p className="text-gray-400 mt-1 text-xs sm:text-base">Posts</p>
                    </div>

                    <button
                      onClick={() => setListModal("followers")}
                      className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl px-2 sm:px-6 py-4 sm:py-5 text-center hover:bg-white/10 transition-all"
                    >
                      <h2 className="text-2xl sm:text-3xl font-black">{user?.followers?.length || 0}</h2>
                      <p className="text-gray-400 mt-1 text-xs sm:text-base">Followers</p>
                    </button>

                    <button
                      onClick={() => setListModal("following")}
                      className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl px-2 sm:px-6 py-4 sm:py-5 text-center hover:bg-white/10 transition-all"
                    >
                      <h2 className="text-2xl sm:text-3xl font-black">{user?.following?.length || 0}</h2>
                      <p className="text-gray-400 mt-1 text-xs sm:text-base">Following</p>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">Profile Posts</h2>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                {imagePosts.length} posts • {videoPosts.length} reels • {thoughtPosts.length} thoughts
              </p>
            </div>

            <div className="bg-zinc-950 border border-white/10 rounded-2xl p-1 grid grid-cols-3 sm:flex gap-1">
              {[
                ["images", "Posts"],
                ["videos", "Reels"],
                ["thoughts", "Thoughts"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 sm:px-5 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                    activeTab === key
                      ? "bg-gradient-to-r from-pink-500 to-indigo-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "images" ? (
            imagePosts.length === 0 ? (
              <EmptyState text="No image posts yet ✨" />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {imagePosts.map(renderMediaCard)}
              </div>
            )
          ) : activeTab === "videos" ? (
            videoPosts.length === 0 ? (
              <EmptyState text="No reels/videos yet 🎬" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {videoPosts.map(renderReelCard)}
              </div>
            )
          ) : thoughtPosts.length === 0 ? (
            <EmptyState text="No thoughts yet ✨" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">{thoughtPosts.map(renderThoughtCard)}</div>
          )}
        </div>
      </div>


      {profilePicOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4"
          onClick={() => setProfilePicOpen(false)}
        >
          <button
            onClick={() => setProfilePicOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 w-11 h-11 rounded-full text-xl"
          >
            ✕
          </button>
          <div className="w-full max-w-lg text-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPic || avatarUrl(user)}
              alt="Profile large"
              className="w-full max-h-[78vh] object-contain rounded-[28px] border border-white/10 shadow-2xl"
            />
            <h3 className="mt-4 text-xl font-black">{user?.name || "User"}</h3>
            {user?.username && <p className="text-pink-300">@{user.username}</p>}
          </div>
        </div>
      )}

      {selectedPost && (
        <PostModal
          selectedPost={selectedPost}
          user={user}
          currentUserId={currentUserId}
          avatarUrl={avatarUrl}
          animateLike={animateLike}
          handleDoubleLike={handleDoubleLike}
          likePost={likePost}
          commentText={commentText}
          setCommentText={setCommentText}
          addComment={addComment}
          deleteComment={deleteComment}
          setSelectedPost={setSelectedPost}
          openUserProfile={openUserProfile}
        />
      )}

      {listModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-5 sm:p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black capitalize">{listModal}</h2>
              <button
                onClick={() => {
                  setListModal(null);
                  setListSearch("");
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder={`Search ${listModal}...`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none mb-4"
            />

            <div className="space-y-3 overflow-y-auto pr-1">
              {filteredList.length === 0 ? (
                <p className="text-gray-400 py-8 text-center">
                  {activeList.length === 0 ? `No ${listModal} yet` : "No user found"}
                </p>
              ) : (
                filteredList.map(renderUserRow)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-4 py-5 sm:py-6">
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="bg-zinc-950 border border-white/10 rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl">
          <div className="h-40 sm:h-52 bg-gradient-to-r from-white/[0.06] via-white/[0.1] to-white/[0.06]" />
          <div className="px-4 sm:px-6 md:px-10 pb-6 sm:pb-8 -mt-14 sm:-mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-zinc-800 border-4 border-black shadow-2xl" />
              <div className="flex-1 pb-1">
                <div className="h-8 sm:h-10 w-52 sm:w-72 bg-zinc-800 rounded-xl" />
                <div className="h-4 w-36 bg-zinc-800 rounded-lg mt-3" />
              </div>
              <div className="hidden sm:block h-12 w-36 bg-zinc-800 rounded-2xl" />
            </div>

            <div className="space-y-3 mt-6 max-w-2xl">
              <div className="h-4 bg-zinc-800 rounded-xl" />
              <div className="h-4 bg-zinc-800 rounded-xl w-4/5" />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-7">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-4 text-center">
                  <div className="h-7 w-10 bg-zinc-800 rounded-xl mx-auto" />
                  <div className="h-3 w-16 bg-zinc-800 rounded-xl mx-auto mt-3" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="h-8 w-48 bg-zinc-900 rounded-2xl" />
              <div className="h-4 w-64 max-w-full bg-zinc-900 rounded-xl mt-3" />
            </div>
            <div className="hidden sm:block h-12 w-72 bg-zinc-900 rounded-2xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-800" />
                  <div className="flex-1">
                    <div className="h-5 w-44 max-w-full bg-zinc-800 rounded-lg" />
                    <div className="h-4 w-32 bg-zinc-800 rounded-lg mt-3" />
                  </div>
                </div>
                <div className="aspect-square bg-zinc-900" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-zinc-950 border border-white/10 rounded-3xl py-20 text-center text-gray-400">
      {text}
    </div>
  );
}

function PostModal({
  selectedPost,
  user,
  currentUserId,
  avatarUrl,
  animateLike,
  handleDoubleLike,
  likePost,
  commentText,
  setCommentText,
  addComment,
  deleteComment,
  setSelectedPost,
  openUserProfile,
}) {
  const liked = selectedPost.likes?.some((like) => like._id === currentUserId || like === currentUserId);
  const isReel = selectedPost.media?.[0]?.type === "video";
  const isImage = selectedPost.media?.[0]?.type === "image";
  const [muted, setMuted] = useState(true);
  const tapTimer = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedPost(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
  }, [setSelectedPost]);

  const handleMediaClick = () => {
    if (!isReel) return;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      setMuted((prev) => !prev);
      tapTimer.current = null;
    }, 220);
  };

  const handleMediaDoubleClick = () => {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }
    handleDoubleLike(selectedPost);
  };

  const headerTitle = isReel ? "Reel" : isImage ? "Post" : "Thought";

  return (
    <div
      className="fixed inset-0 bg-black/92 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center sm:p-4"
      onClick={() => setSelectedPost(null)}
    >
      <div
        className={`w-full bg-zinc-950 border border-white/10 overflow-hidden relative shadow-2xl ${
          isReel
            ? "max-w-6xl rounded-t-[30px] sm:rounded-[34px] h-[96dvh] sm:h-[92vh]"
            : "max-w-5xl rounded-t-[30px] sm:rounded-[32px] h-[94dvh] sm:h-auto sm:max-h-[92vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-zinc-950/95 border-b border-white/10 lg:hidden">
          <button
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-2 text-sm font-bold text-gray-100 bg-white/10 border border-white/10 active:scale-95 px-4 py-2 rounded-full"
          >
            ← Back
          </button>
          <span className="text-sm text-gray-300 font-semibold">{headerTitle}</span>
          <button
            onClick={() => setSelectedPost(null)}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/10 text-xl leading-none active:scale-95"
            aria-label="Close post"
          >
            ×
          </button>
        </div>

        <button
          onClick={() => setSelectedPost(null)}
          className="hidden lg:flex absolute top-4 right-4 z-50 bg-black/70 hover:bg-white/10 border border-white/10 w-11 h-11 rounded-full items-center justify-center text-2xl leading-none"
          aria-label="Close post"
        >
          ×
        </button>

        <div className={`${isReel ? "grid lg:grid-cols-[minmax(320px,460px)_1fr]" : "grid lg:grid-cols-2"} h-[calc(96dvh-65px)] sm:h-full`}>
          <div
            onClick={handleMediaClick}
            onDoubleClick={handleMediaDoubleClick}
            className={`relative bg-black flex items-center justify-center cursor-pointer select-none ${
              isReel
                ? "h-[58dvh] sm:h-[92vh] lg:h-[92vh]"
                : "h-[38dvh] sm:min-h-[360px] lg:h-auto lg:min-h-[560px] lg:max-h-[85vh]"
            }`}
          >
            {animateLike && (
              <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                <div className="text-[90px] md:text-[120px] animate-bounce drop-shadow-[0_0_18px_rgba(236,72,153,0.45)]">
                  ❤️
                </div>
              </div>
            )}

            {isImage ? (
              <img src={selectedPost.media[0].url} alt="" className="w-full h-full lg:max-h-[85vh] object-contain" />
            ) : isReel ? (
              <>
                <video
                  src={selectedPost.media[0].url}
                  autoPlay
                  loop
                  playsInline
                  muted={muted}
                  className="h-full w-full object-contain sm:object-cover bg-black"
                />
                <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <div className="absolute left-4 right-4 bottom-5 flex items-end justify-between gap-4 lg:hidden">
                  <div className="min-w-0">
                    <p className="font-bold line-clamp-2">{selectedPost.caption || selectedPost.content || "Vybeo Reel"}</p>
                    <p className="text-xs text-gray-300 mt-1">Single tap mute/unmute • Double tap like</p>
                  </div>
                  <div className="shrink-0 bg-black/55 border border-white/10 backdrop-blur-md px-3 py-2 rounded-full text-sm">
                    {muted ? "🔇" : "🔊"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMuted((prev) => !prev);
                  }}
                  className="hidden lg:block absolute bottom-5 right-5 bg-black/60 hover:bg-black/80 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold"
                >
                  {muted ? "🔇 Muted" : "🔊 Sound on"}
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-950 via-purple-950/25 to-zinc-950 p-6 sm:p-10">
                <div className="max-w-xl bg-white/[0.04] border border-white/10 rounded-[30px] p-6 sm:p-8 shadow-2xl">
                  <div className="text-xs text-pink-200 mb-4 bg-white/5 border border-white/10 rounded-full px-3 py-1 inline-block">✦ Thought</div>
                  <p className="text-xl sm:text-3xl font-bold leading-relaxed break-words whitespace-pre-wrap">
                    {selectedPost.caption || selectedPost.content}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={`flex flex-col min-h-0 ${isReel ? "h-[calc(38dvh-65px)] lg:h-[92vh]" : "h-[calc(56dvh-65px)] lg:h-[85vh]"}`}>
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3 bg-zinc-950/95">
              <button onClick={() => selectedPost.user?._id && openUserProfile(selectedPost.user._id)}>
                <img src={avatarUrl(selectedPost.user || user)} alt="" className="w-12 h-12 rounded-full object-cover" />
              </button>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => selectedPost.user?._id && openUserProfile(selectedPost.user._id)}
                  className="font-bold hover:underline truncate block"
                >
                  {selectedPost.user?.name || user?.name || "User"}
                </button>
                <p className="text-sm text-gray-400 truncate">
                  {selectedPost.user?.username ? `@${selectedPost.user.username} • ` : ""}
                  {selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleString() : ""}
                </p>
              </div>
              {isReel && <span className="hidden sm:inline-flex bg-cyan-400/10 text-cyan-200 border border-cyan-300/20 px-3 py-1 rounded-full text-xs font-bold">Reel</span>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0">
              {(selectedPost.caption || selectedPost.content) && !(!isImage && !isReel) && (
                <p className="text-gray-200 leading-relaxed mb-6 break-words whitespace-pre-wrap">
                  {selectedPost.caption || selectedPost.content}
                </p>
              )}

              <div className="space-y-4">
                {selectedPost.comments?.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No comments yet ✨</p>
                ) : (
                  selectedPost.comments?.map((comment) => {
                    const canDelete =
                      comment.user?._id === currentUserId || selectedPost.user?._id === currentUserId;

                    return (
                      <div key={comment._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <button onClick={() => comment.user?._id && openUserProfile(comment.user._id)}>
                            <img src={avatarUrl(comment.user)} alt="" className="w-9 h-9 rounded-full object-cover" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <button
                                onClick={() => comment.user?._id && openUserProfile(comment.user._id)}
                                className="font-semibold text-sm hover:underline truncate"
                              >
                                {comment.user?.name || "User"}
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => deleteComment(selectedPost._id, comment._id)}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            {comment.user?.username && (
                              <p className="text-xs text-gray-500">@{comment.user.username}</p>
                            )}
                            <p className="text-gray-300 text-sm mt-1 break-words">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border-t border-white/10 p-3 sm:p-5 bg-zinc-950/95">
              <div className="flex items-center gap-5 mb-4">
                <button
                  onClick={() => likePost(selectedPost._id)}
                  className="text-2xl hover:scale-110 active:scale-95 transition-all"
                  title="Like/unlike"
                >
                  {liked ? "❤️" : "🤍"}
                </button>
                <span className="text-gray-300">{selectedPost.likes?.length || 0} likes</span>
                <span className="text-gray-300">💬 {selectedPost.comments?.length || 0}</span>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Add a comment..."
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 outline-none focus:border-pink-400/50"
                />
                <button
                  onClick={addComment}
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-4 sm:px-6 rounded-2xl font-semibold active:scale-95 transition-all"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {isReel ? "Single tap reel to mute/unmute. Double tap to like/unlike." : "Double tap media or use the heart button to like/unlike."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
