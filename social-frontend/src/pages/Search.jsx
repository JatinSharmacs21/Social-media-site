import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Search() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(null);

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const authConfig = {
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  const avatarUrl = (user) => {
    return (
      user?.profilePic ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.name || "User"
      )}&background=8b5cf6&color=fff`
    );
  };

  const searchUsers = useCallback(async (searchText = "") => {
    try {
      setLoading(true);

      const res = await API.get(
        `/api/users/search?name=${encodeURIComponent(searchText)}`
      );

      const filtered = Array.isArray(res.data)
        ? res.data.filter((u) => u._id !== currentUserId)
        : [];

      if (searchText.trim()) {
        setUsers(filtered);
      } else {
        setSuggestedUsers(filtered.slice(0, 4));
        setUsers([]);
      }
    } catch (err) {
      console.log(err.response?.data || err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
  searchUsers("");
}, [searchUsers]);

  useEffect(() => {
  const delay = setTimeout(() => {
    searchUsers(query.trim());
  }, 400);

  return () => clearTimeout(delay);
}, [query, searchUsers]);

  const followUser = async (userId) => {
    try {
      setFollowLoading(userId);

      const res = await API.put(
        `/api/users/follow/${userId}`,
        {},
        authConfig
      );

      const updatedUser = res.data.user || res.data;

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? updatedUser : u))
      );

      setSuggestedUsers((prev) =>
        prev.map((u) => (u._id === userId ? updatedUser : u))
      );
    } catch (err) {
      console.log(err.response?.data || err);
    } finally {
      setFollowLoading(null);
    }
  };

  const UserCard = ({ u }) => {
    const isFollowing = u.followers?.some(
      (f) => f === currentUserId || f?._id === currentUserId
    );

    return (
      <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex items-center justify-between gap-4 hover:border-pink-500/30 hover:bg-white/[0.04] transition-all shadow-xl">
        <div
          onClick={() => navigate(`/profile/${u._id}`)}
          className="flex items-center gap-3 min-w-0 cursor-pointer group"
        >
          <img
            src={avatarUrl(u)}
            alt=""
            className="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-all"
          />

          <div className="min-w-0">
            <h3 className="font-bold truncate group-hover:text-pink-400 transition-all">
              {u.name || "Unknown User"}
            </h3>

            <p className="text-sm text-gray-400 truncate max-w-[170px] sm:max-w-[220px]">
              {u.bio || u.email || "No bio yet"}
            </p>

            <div className="flex gap-3 mt-2 text-xs text-gray-500">
              <span>{u.followers?.length || 0} followers</span>
              <span>{u.following?.length || 0} following</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => followUser(u._id)}
          disabled={followLoading === u._id}
          className={`px-4 py-2 rounded-2xl text-sm font-semibold shrink-0 transition-all disabled:opacity-60 ${
            isFollowing
              ? "bg-white/10 hover:bg-white/20"
              : "bg-gradient-to-r from-pink-500 to-indigo-500 hover:scale-105"
          }`}
        >
          {followLoading === u._id
            ? "..."
            : isFollowing
            ? "Following"
            : "Follow"}
        </button>
      </div>
    );
  };

  const activeList = query.trim() ? users : suggestedUsers;

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-4 py-6">
      <div className="w-full max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300 mb-5">
            🔍 Discover people
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Search Creators
          </h1>

          <p className="text-gray-400 mt-3 text-base sm:text-lg">
            Find people, open profiles and follow their vibe.
          </p>
        </div>

        {/* SEARCH BOX */}
        <div className="bg-zinc-950 border border-white/10 rounded-[28px] p-4 mb-7 shadow-xl max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg">
              🔎
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators by name..."
              className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-4 outline-none focus:border-pink-500 transition-all text-white placeholder:text-gray-500"
            />

            {query && (
              <button
                onClick={() => setQuery("")}
                className="hidden sm:block text-gray-400 hover:text-white px-3"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* SECTION TITLE */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black">
              {query.trim() ? "Search Results" : "Suggested Creators"}
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              {query.trim()
                ? "Profiles matching your search"
                : "People you may want to follow"}
            </p>
          </div>

          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-sm text-pink-400 hover:text-pink-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-zinc-950 border border-white/10 rounded-3xl p-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/10" />
                  <div className="flex-1">
                    <div className="h-4 w-36 bg-white/10 rounded mb-3" />
                    <div className="h-3 w-52 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && activeList.length === 0 && (
          <div className="bg-zinc-950 border border-white/10 rounded-3xl py-16 text-center">
            <div className="text-5xl mb-4">👥</div>

            <h3 className="text-xl font-bold mb-2">
              {query.trim() ? "No users found" : "No suggestions yet"}
            </h3>

            <p className="text-gray-400 text-sm">
              {query.trim()
                ? "Try searching another name."
                : "More creators will appear here soon."}
            </p>
          </div>
        )}

        {/* USERS */}
        {!loading && activeList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeList.map((u) => (
              <UserCard key={u._id} u={u} />
            ))}
          </div>
        )}

        {/* INFO CARD */}
        {!query.trim() && (
          <div className="mt-8 bg-gradient-to-r from-pink-500/10 to-indigo-500/10 border border-white/10 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-2">
              Grow your Vybeo circle ✨
            </h3>

            <p className="text-gray-400 leading-relaxed">
              Search creators by name, follow people you like and open their
              profile to explore posts, followers and following.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default Search;