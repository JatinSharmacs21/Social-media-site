import { useCallback, useEffect, useState } from "react";
import API from "../services/api";
import logger from "../utils/logger";

function useFeedPosts({ currentUserId }) {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);

  const fetchPosts = useCallback(async (page = 1) => {
    try {
      if (page === 1) {
        setInitialLoading(true);
      } else {
        setLoadingMoreFeed(true);
      }

      const res = await API.get(`/api/posts?page=${page}&limit=6`);

      const nextPosts = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.posts)
        ? res.data.posts
        : [];

      setPosts((prev) => {
        if (page === 1) return nextPosts;

        const existingIds = new Set(prev.map((post) => post._id));
        const uniquePosts = nextPosts.filter(
          (post) => !existingIds.has(post._id)
        );

        return [...prev, ...uniquePosts];
      });

      setFeedPage(page);
      setHasMoreFeed(
        Array.isArray(res.data)
          ? nextPosts.length === 6
          : Boolean(res.data?.hasMore)
      );
    } catch (error) {
      logger.error(error.response?.data || error);
    } finally {
      setInitialLoading(false);
      setLoadingMoreFeed(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();

    const loadCurrentUser = async () => {
      try {
        if (!currentUserId) return;

        const res = await API.get(`/api/users/${currentUserId}`);
        setCurrentUser(res.data);
      } catch (error) {
        logger.error(error.response?.data || error);

        const localUser = localStorage.getItem("user");
        if (localUser) {
          try {
            setCurrentUser(JSON.parse(localUser));
          } catch {
            setCurrentUser(null);
          }
        }
      }
    };

    loadCurrentUser();
  }, [currentUserId, fetchPosts]);

  return {
    posts,
    setPosts,
    currentUser,
    setCurrentUser,
    initialLoading,
    feedPage,
    hasMoreFeed,
    loadingMoreFeed,
    fetchPosts,
  };
}

export default useFeedPosts;