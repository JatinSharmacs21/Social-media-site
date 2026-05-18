import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Search() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(null);
  const [activeMood, setActiveMood] = useState("All");

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const moodChips = useMemo(
    () => ["All", "Deep", "Funny", "Chaos", "Late Night", "Creative", "College"],
    []
  );

  const trendingVybes = useMemo(
    () => ["#DeepVybes", "#LateNight", "#RealThoughts", "#CollegeLife", "#ChaosMode", "#CreativeMood"],
    []
  );

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

  const searchUsers = useCallback(
    async (searchText = "") => {
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
          setSuggestedUsers(filtered.slice(0, 6));
          setUsers([]);
        }
      } catch (err) {
        console.log(err.response?.data || err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId]
  );

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

      const res = await API.put(`/api/users/follow/${userId}`, {}, authConfig);

      const updatedUser = res.data.user || res.data;

      setUsers((prev) => prev.map((u) => (u._id === userId ? updatedUser : u)));

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
      <div className="group relative overflow-hidden bg-zinc-950/85 backdrop-blur-xl border border-white/10 rounded-[26px] p-4 hover:border-pink-500/30 hover:bg-white/[0.045] transition-all shadow-xl shadow-black/30">
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-pink-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-all" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-cyan-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-all" />

        <div className="relative flex items-center justify-between gap-4">
          <div
            onClick={() => navigate(`/profile/${u._id}`)}
            className="flex items-center gap-3 min-w-0 cursor-pointer"
          >
            <img
              src={avatarUrl(u)}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-all"
            />

            <div className="min-w-0">
              <h3 className="font-black truncate group-hover:text-pink-300 transition-all">
                {u.name || "Unknown User"}
              </h3>

              <p className="text-sm text-gray-400 truncate max-w-[170px] sm:max-w-[220px]">
                {u.bio || u.email || "No bio yet"}
              </p>

              <div className="flex gap-3 mt-2 text-[11px] text-gray-500 font-semibold">
                <span>{u.followers?.length || 0} Circle</span>
                <span>{u.following?.length || 0} Tuned In</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => followUser(u._id)}
            disabled={followLoading === u._id}
            className={`px-4 py-2 rounded-2xl text-sm font-bold shrink-0 transition-all disabled:opacity-60 ${
              isFollowing
                ? "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                : "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:scale-105 text-white shadow-lg shadow-pink-500/15"
            }`}
          >
            {followLoading === u._id ? "..." : isFollowing ? "Tuned In" : "Tune In"}
          </button>
        </div>
      </div>
    );
  };

  const activeList = query.trim() ? users : suggestedUsers;

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-4 pt-4 md:pt-8 pb-24 md:pb-10">
      <div className="w-full max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-white/[0.045] border border-white/10 rounded-full px-4 py-2 text-xs font-black tracking-[0.18em] text-pink-300 mb-5">
            DISCOVER
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                Discover Vybes
              </h1>

              <p className="text-gray-400 mt-2 text-sm sm:text-base">
                Find people, thoughts, moments and new energy to tune into.
              </p>
            </div>

            <button
              onClick={() => navigate("/vybe-drops")}
              className="hidden sm:inline-flex px-4 py-2 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-semibold text-pink-200 hover:bg-pink-500/10 transition-all"
            >
              Explore Drops
            </button>
          </div>
        </div>

        {/* MOOD CHIPS */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {moodChips.map((mood) => (
            <button
              key={mood}
              onClick={() => setActiveMood(mood)}
              className={`shrink-0 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                activeMood === mood
                  ? "bg-gradient-to-r from-pink-500/25 to-cyan-500/20 border-pink-400/30 text-white"
                  : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.07]"
              }`}
            >
              {mood}
            </button>
          ))}
        </div>

        {/* SEARCH BOX */}
        <div className="relative overflow-hidden bg-zinc-950/90 border border-white/10 rounded-[28px] p-4 mb-7 shadow-xl shadow-black/30">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/20">
              🔎
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people by name..."
              className="w-full min-w-0 bg-white/[0.055] border border-white/10 rounded-2xl px-4 sm:px-5 py-4 outline-none focus:border-pink-500 transition-all text-white placeholder:text-gray-500"
            />

            {query && (
              <button
                onClick={() => setQuery("")}
                className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
          <div>
            {/* SECTION TITLE */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black">
                  {query.trim() ? "Search Results" : "People to Tune In"}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  {query.trim()
                    ? "Vybe Spaces matching your search"
                    : "Suggested people for your Vybe Flow"}
                </p>
              </div>

              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-sm text-pink-400 hover:text-pink-300 font-semibold"
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
                    className="bg-zinc-950 border border-white/10 rounded-[26px] p-4 animate-pulse"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/10" />
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
              <div className="bg-zinc-950/90 border border-white/10 rounded-[28px] py-16 text-center shadow-xl shadow-black/30">
                <div className="text-5xl mb-4">✨</div>

                <h3 className="text-xl font-bold mb-2">
                  {query.trim() ? "No Vybe Spaces found" : "No suggestions yet"}
                </h3>

                <p className="text-gray-400 text-sm">
                  {query.trim()
                    ? "Try searching another name."
                    : "More people will appear here soon."}
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
          </div>

          {/* RIGHT PANEL */}
          <aside className="hidden lg:block space-y-4 sticky top-8">
            <div className="bg-zinc-950/85 border border-white/10 rounded-[28px] p-5 shadow-xl shadow-black/30">
              <p className="text-[11px] tracking-[0.2em] text-pink-300 font-black mb-2">
                TRENDING
              </p>

              <h3 className="text-xl font-black mb-4">Trending Vybes</h3>

              <div className="flex flex-wrap gap-2">
                {trendingVybes.map((tag) => (
                  <button
                    key={tag}
                    className="px-3 py-2 rounded-full bg-white/[0.045] border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/[0.07] transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-white/10 rounded-[28px] p-5 shadow-xl shadow-black/30">
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-pink-500/15 blur-3xl" />

              <div className="relative">
                <h3 className="text-xl font-black mb-2">
                  Grow your Circle ✨
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed">
                  Tune into people you like. Their moments and thoughts will
                  shape your Vybe Flow.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* MOBILE INFO CARD */}
        {!query.trim() && (
          <div className="lg:hidden mt-8 bg-gradient-to-r from-pink-500/10 to-cyan-500/10 border border-white/10 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-2">Grow your Circle ✨</h3>

            <p className="text-gray-400 leading-relaxed text-sm">
              Search people by name, tune into their Vybe Space and discover
              new energy for your Flow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;