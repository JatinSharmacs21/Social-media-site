import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import logger from "../utils/logger";

function Search() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState("People");
  const [activeMood, setActiveMood] = useState("All");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [followLoading, setFollowLoading] = useState(null);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [requestedIds, setRequestedIds] = useState(new Set());
  const [suggestionSeed, setSuggestionSeed] = useState(() => Date.now());
  const [visibleSuggestionCount, setVisibleSuggestionCount] = useState(4);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vybeo_recent_searches") || "[]");
    } catch {
      return [];
    }
  });

  const tabs = useMemo(() => ["People", "Clips", "Thoughts", "Moments"], []);
  const moodChips = useMemo(
    () => ["All", "Deep", "Funny", "Chaos", "Late Night", "Creative", "College"],
    []
  );

  const trendingVybes = useMemo(
    () => [
      { label: "Deep", mood: "Deep" },
      { label: "Late Night", mood: "Late Night" },
      { label: "College", mood: "College" },
      { label: "Funny", mood: "Funny" },
      { label: "Creative", mood: "Creative" },
    ],
    []
  );

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: "Bearer " + token,
      },
    }),
    [token]
  );

  const avatarUrl = (user) =>
    user?.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || "User"
    )}&background=8b5cf6&color=fff`;

  const getMediaUrl = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.url || item.secure_url || item.mediaUrl || item.fileUrl || item.src || "";
  };

  const formatCount = (value = 0) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value;
  };

  const getTypeFromTab = (tab) => {
    if (tab === "Clips") return "clips";
    if (tab === "Thoughts") return "thoughts";
    if (tab === "Moments") return "moments";
    return "all";
  };

  const saveRecentSearch = (value) => {
    const clean = value.trim();
    if (!clean) return;

    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      localStorage.setItem("vybeo_recent_searches", JSON.stringify(next));
      return next;
    });
  };

  const getRandomItems = useCallback((items = [], limit = 4, seed = 1) => {
    const list = [...items];
    let value = seed || 1;

    for (let i = list.length - 1; i > 0; i -= 1) {
      value = (value * 9301 + 49297) % 233280;
      const j = Math.floor((value / 233280) * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    return list.slice(0, Math.min(limit, list.length));
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    if (!token) return;

    try {
      const res = await API.get("/api/users/me", authConfig);
      const ids = new Set(
        (res.data?.following || []).map((item) =>
          typeof item === "string" ? item : item?._id
        )
      );
      setFollowingIds(ids);

      const sentRes = await API.get("/api/users/tune-requests/sent", authConfig);
      setRequestedIds(new Set((sentRes.data || []).map((id) => id.toString())));
    } catch (err) {
      logger.error(err.response?.data || err);
    }
  }, [authConfig, token]);

  const searchUsers = useCallback(
    async (searchText = "") => {
      try {
        setLoadingUsers(true);
        const res = await API.get(`/api/users/search?q=${encodeURIComponent(searchText)}`);
        const filtered = Array.isArray(res.data)
          ? res.data.filter((u) => u._id !== currentUserId)
          : [];
        setUsers(filtered);
      } catch (err) {
        logger.error(err.response?.data || err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    },
    [currentUserId]
  );

  const searchPosts = useCallback(async (searchText = "", tab = activeTab, mood = activeMood) => {
    try {
      setLoadingPosts(true);
      const params = new URLSearchParams({
        q: searchText,
        type: getTypeFromTab(tab),
        mood,
        limit: "12",
      });
      const res = await API.get(`/api/posts/search?${params.toString()}`);
      setPosts(Array.isArray(res.data?.posts) ? res.data.posts : []);
    } catch (err) {
      logger.error(err.response?.data || err);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [activeMood, activeTab]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (activeTab === "People") {
      searchUsers(debouncedQuery);
    } else {
      searchPosts(debouncedQuery, activeTab, activeMood);
    }
  }, [activeMood, activeTab, debouncedQuery, searchPosts, searchUsers]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    saveRecentSearch(query);
    setDebouncedQuery(query.trim());
  };

  const followUser = async (userId) => {
    try {
      setFollowLoading(userId);

      const res = await API.put(`/api/users/follow/${userId}`, {}, authConfig);
      const updatedUser = res.data.user || res.data;

      setUsers((prev) => prev.map((u) => (u._id === userId ? updatedUser : u)));

      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (res.data?.following) next.add(userId);
        else next.delete(userId);
        return next;
      });

      setRequestedIds((prev) => {
        const next = new Set(prev);
        if (res.data?.requested) next.add(userId);
        else next.delete(userId);
        return next;
      });
    } catch (err) {
      await fetchCurrentUser();
      logger.error(err.response?.data || err);
    } finally {
      setFollowLoading(null);
    }
  };

  const openPost = (post) => {
    if (!post?._id) return;
    navigate(`/feed?post=${post._id}`);
  };

  const clearRecentSearches = () => {
    localStorage.removeItem("vybeo_recent_searches");
    setRecentSearches([]);
  };

  const UserCard = ({ user }) => {
    const isFollowing = followingIds.has(user._id);
    const isRequested = !isFollowing && requestedIds.has(user._id);

    return (
      <article className="group rounded-[1.15rem] border border-white/10 bg-zinc-950/80 p-3 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-pink-400/25 hover:bg-white/[0.045]">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl(user)}
            alt=""
            onClick={() => navigate(`/profile/${user._id}`)}
            className="h-11 w-11 shrink-0 cursor-pointer rounded-2xl border border-white/10 object-cover transition group-hover:scale-105"
          />

          <div
            onClick={() => navigate(`/profile/${user._id}`)}
            className="min-w-0 flex-1 cursor-pointer"
          >
            <h3 className="truncate text-sm font-black text-white">
              {user.name || "Unknown User"}
            </h3>
            <p className="truncate text-xs font-semibold text-white/45">
              {user.username ? `@${user.username}` : "@vybeo"}
              {user.isPrivate && <span className="ml-1 text-white/30">🔒</span>}
            </p>
            {user.bio && (
              <p className="mt-1 line-clamp-1 text-xs text-white/55">{user.bio}</p>
            )}
          </div>

          <button
            onClick={() => followUser(user._id)}
            disabled={followLoading === user._id}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black transition active:scale-95 disabled:opacity-60 ${
              isFollowing || isRequested
                ? "border border-white/10 bg-white/[0.08] text-white/80 hover:bg-white/[0.12]"
                : "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/15 hover:scale-[1.03]"
            }`}
          >
            {followLoading === user._id
              ? "..."
              : isFollowing
              ? "Tuned"
              : isRequested
              ? "Requested"
              : "Tune In"}
          </button>
        </div>

        <div className="mt-2 flex gap-2 text-[10px] font-bold text-white/35">
          <span>{formatCount(user.followers?.length || 0)} Circle</span>
          <span>•</span>
          <span>{formatCount(user.following?.length || 0)} Tuned In</span>
        </div>
      </article>
    );
  };

  const PostCard = ({ post }) => {
    const media = post.media || [];
    const firstMedia = media[0];
    const mediaUrl = getMediaUrl(firstMedia);
    const isVideo = firstMedia?.type === "video" || mediaUrl.toLowerCase().includes(".mp4");
    const isThought = !media.length;

    return (
      <article
        onClick={() => openPost(post)}
        className="group cursor-pointer overflow-hidden rounded-[1.35rem] border border-white/10 bg-zinc-950/80 shadow-xl shadow-black/20 backdrop-blur-xl transition hover:border-cyan-300/25 hover:bg-white/[0.045]"
      >
        <div className={`${isThought ? "p-4" : "relative aspect-[4/5] bg-black"}`}>
          {isThought ? (
            <div className="min-h-[132px] rounded-2xl border border-white/[0.06] bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10 p-4">
              <p className="line-clamp-5 text-sm font-semibold leading-6 text-white/90">
                {post.caption || "Thought"}
              </p>
            </div>
          ) : isVideo ? (
            <video src={mediaUrl} className="h-full w-full object-cover transition group-hover:scale-[1.02]" muted playsInline />
          ) : (
            <img src={mediaUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
          )}

          {!isThought && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
          )}

          {!isThought && (
            <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
              {isVideo ? "Clip" : "Moment"}
            </div>
          )}
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-2">
            <img src={avatarUrl(post.user)} alt="" className="h-8 w-8 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{post.user?.name || "User"}</p>
              <p className="truncate text-[11px] text-white/40">
                {post.mood && post.mood !== "All" ? post.mood : "Vybe"}
              </p>
            </div>
          </div>

          {!isThought && post.caption && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/65">{post.caption}</p>
          )}

          <div className="mt-3 flex items-center gap-3 text-[11px] font-bold text-white/40">
            <span>{formatCount(post.likes?.length || 0)} Felt</span>
            <span>{formatCount(post.comments?.length || 0)} Replies</span>
          </div>
        </div>
      </article>
    );
  };

  useEffect(() => {
    if (activeTab === "People" && !query.trim()) {
      setVisibleSuggestionCount(4);
      setSuggestionSeed(Date.now());
    }
  }, [activeTab, query, users.length]);

  const loading = activeTab === "People" ? loadingUsers : loadingPosts;
  const activeItems = activeTab === "People" ? users : posts;
  const showingPeopleSuggestions = activeTab === "People" && !query.trim();
  const shuffledSuggestionUsers = useMemo(
    () => getRandomItems(users, users.length, suggestionSeed),
    [users, suggestionSeed, getRandomItems]
  );
  const visibleUsers = showingPeopleSuggestions
    ? shuffledSuggestionUsers.slice(0, Math.min(visibleSuggestionCount, shuffledSuggestionUsers.length))
    : users;
  const hasMoreSuggestions =
    showingPeopleSuggestions && visibleSuggestionCount < shuffledSuggestionUsers.length;

  return (
    <div className="min-h-screen bg-black px-3 pb-28 pt-3 text-white sm:px-4 md:pb-10 md:pt-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-3 sm:mb-5">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-pink-300">
            Discover
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[1.65rem] font-black leading-tight tracking-tight sm:text-4xl">
                Find your next Vybe
              </h1>
              <p className="mt-1 max-w-xl text-[12px] leading-5 text-white/45 sm:text-sm">
                Search creators, clips, thoughts and moments built around your mood.
              </p>
            </div>

            <button
              onClick={() => navigate("/vybe-drops")}
              className="hidden rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-pink-100 transition hover:bg-pink-500/10 sm:inline-flex"
            >
              Drops
            </button>
          </div>
        </header>

        <form onSubmit={handleSearchSubmit} className="mb-3 overflow-hidden rounded-[1.35rem] border border-white/10 bg-zinc-950/90 p-2 shadow-lg shadow-black/30 sm:rounded-[1.6rem] sm:p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 text-sm shadow-lg shadow-pink-500/20 sm:h-11 sm:w-11">
              🔎
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators or content"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-pink-400/45 sm:px-4"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white/45 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </form>

        <div className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-black transition ${
                activeTab === tab
                  ? "border-pink-400/35 bg-gradient-to-r from-pink-500/25 to-purple-500/20 text-white"
                  : "border-white/10 bg-white/[0.04] text-white/45 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {moodChips.map((mood) => (
            <button
              key={mood}
              onClick={() => setActiveMood(mood)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                activeMood === mood
                  ? "border-cyan-300/35 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-white/[0.035] text-white/40 hover:text-white"
              }`}
            >
              {mood}
            </button>
          ))}
        </div>

        {!query.trim() && recentSearches.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-white/35">Recent</span>
            {recentSearches.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setQuery(item);
                  setDebouncedQuery(item);
                }}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/55 hover:text-white"
              >
                {item}
              </button>
            ))}
            <button onClick={clearRecentSearches} className="text-xs font-bold text-pink-300/80 hover:text-pink-200">
              Clear
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <main>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black sm:text-xl">
                  {activeTab === "People" ? "People to Tune In" : activeTab}
                </h2>
                <p className="text-xs text-white/35">
                  {query.trim() ? `Results for “${query.trim()}”` : activeMood === "All" ? "Suggested creators" : `${activeMood} mood`}
                </p>
              </div>

              {query && (
                <button onClick={() => setQuery("")} className="text-xs font-black text-pink-300 hover:text-pink-200">
                  Clear
                </button>
              )}
            </div>

            {loading && (
              <div className={`grid gap-3 ${activeTab === "People" ? "sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="h-28 animate-pulse rounded-[1.35rem] border border-white/10 bg-zinc-950" />
                ))}
              </div>
            )}

            {!loading && activeItems.length === 0 && (
              <div className="rounded-[1.6rem] border border-white/10 bg-zinc-950/90 px-5 py-12 text-center shadow-xl shadow-black/25">
                <div className="mb-3 text-4xl">✨</div>
                <h3 className="text-lg font-black">Nothing found</h3>
                <p className="mt-1 text-sm text-white/45">
                  Try another search or pick a different mood.
                </p>
              </div>
            )}

            {!loading && activeItems.length > 0 && activeTab === "People" && (
              <>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {visibleUsers.map((user) => (
                    <UserCard key={user._id} user={user} />
                  ))}
                </div>

                {hasMoreSuggestions && (
                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleSuggestionCount((prev) =>
                          Math.min(prev + 4, shuffledSuggestionUsers.length)
                        )
                      }
                      className="rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-xs font-black text-white/70 transition hover:border-pink-300/30 hover:bg-pink-500/10 hover:text-white active:scale-95"
                    >
                      More suggestions
                    </button>
                  </div>
                )}
              </>
            )}

            {!loading && activeItems.length > 0 && activeTab !== "People" && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </main>

          <aside className="hidden space-y-4 lg:block">
            <section className="rounded-[1.6rem] border border-white/10 bg-zinc-950/85 p-4 shadow-xl shadow-black/25">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-pink-300">
                Trending
              </p>
              <h3 className="mb-3 text-lg font-black">Mood lanes</h3>
              <div className="flex flex-wrap gap-2">
                {trendingVybes.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveMood(item.mood);
                      setActiveTab("Thoughts");
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-semibold text-white/55 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    #{item.label.replace(" ", "")}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10 p-4 shadow-xl shadow-black/25">
              <h3 className="text-lg font-black">Discover faster</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Switch tabs to find people, clips, thoughts or moments without leaving the page.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Search;