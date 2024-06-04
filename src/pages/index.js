import Image from "next/image";
import { Inter } from "next/font/google";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSession, getSession } from "next-auth/react";
import axios from "axios";
import Modal from "../components/ui/Modal";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faRetweet } from "@fortawesome/free-solid-svg-icons";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tweets, setTweets] = useState([]);
  const [newTweet, setNewTweet] = useState("");
  const { data: session, status } = useSession();
  const [selectedTweet, setSelectedTweet] = useState(null);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const response = await axios.get("/api/tweets/fetchAll");
        const tweetsWithDefaults = response.data.map((tweet) => ({
          ...tweet,
          likes: tweet.likes || [],
          retweets: tweet.retweets || [],
        }));
        setTweets(tweetsWithDefaults);
      } catch (error) {
        console.error("Error fetching tweets:", error);
      }
    };

    fetchTweets();
  }, []);

  const handlePostNewTweet = async (e) => {
    e.preventDefault();
    if (!newTweet.trim()) return;

    try {
      const session = await getSession();
      if (!session || !session.accessToken) {
        console.error("No session or access token found");
        return;
      }

      const response = await axios.post(
        "/api/tweets/create",
        { content: newTweet },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      setTweets([{ ...response.data, likes: [], retweets: [] }, ...tweets]);
      setNewTweet("");
    } catch (error) {
      console.error("Error posting new tweet:", error);
    }
  };

  const handleLike = async (tweetId) => {
    if (!session) {
      setIsModalOpen(true);
      return;
    }

    try {
      const session = await getSession();
      if (!session || !session.accessToken) {
        console.error("No session or access token found");
        return;
      }

      await axios.post(
        "/api/tweets/like",
        { tweetId },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      setTweets((prevTweets) =>
        prevTweets.map((tweet) =>
          tweet.id === tweetId
            ? {
                ...tweet,
                likes: [...(tweet.likes || []), { userId: session.user.id }],
              }
            : tweet
        )
      );

      if (selectedTweet && selectedTweet.id === tweetId) {
        setSelectedTweet((prevSelectedTweet) => ({
          ...prevSelectedTweet,
          likes: [
            ...(prevSelectedTweet.likes || []),
            { userId: session.user.id },
          ],
        }));
      }
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  };

  const handleRetweet = async (tweetId) => {
    if (!session) {
      setIsModalOpen(true);
      return;
    }

    try {
      const session = await getSession();
      if (!session || !session.accessToken) {
        console.error("No session or access token found");
        return;
      }

      await axios.post(
        "/api/tweets/retweet",
        { tweetId },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      setTweets((prevTweets) =>
        prevTweets.map((tweet) =>
          tweet.id === tweetId
            ? {
                ...tweet,
                retweets: [
                  ...(tweet.retweets || []),
                  { userId: session.user.id },
                ],
              }
            : tweet
        )
      );

      if (selectedTweet && selectedTweet.id === tweetId) {
        setSelectedTweet((prevSelectedTweet) => ({
          ...prevSelectedTweet,
          retweets: [
            ...(prevSelectedTweet.retweets || []),
            { userId: session.user.id },
          ],
        }));
      }
    } catch (error) {
      console.error("Error retweeting tweet:", error);
    }
  };

  const handleExpandTweet = (tweet) => {
    if (!session) {
      setIsModalOpen(true);
      return;
    }
    setSelectedTweet(tweet);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-white">
      <div className="flex flex-1">
        <MainContent
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onTweetSubmit={handlePostNewTweet}
          tweets={tweets}
          newTweet={newTweet}
          setNewTweet={setNewTweet}
          selectedTweet={selectedTweet}
          setSelectedTweet={setSelectedTweet}
          onLike={handleLike}
          onRetweet={handleRetweet}
          onExpandTweet={handleExpandTweet}
          session={session}
        />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

const MainContent = ({
  onToggleSidebar,
  onTweetSubmit,
  tweets,
  newTweet,
  setNewTweet,
  selectedTweet,
  setSelectedTweet,
  onLike,
  onRetweet,
  onExpandTweet,
  session,
}) => (
  <main className="flex-1 p-4">
    <button
      className="md:hidden mb-4 p-2 bg-blue-500 text-white rounded"
      onClick={onToggleSidebar}
    >
      Toggle Sidebar
    </button>
    <TweetForm
      onSubmit={onTweetSubmit}
      newTweet={newTweet}
      setNewTweet={setNewTweet}
    />
    {selectedTweet ? (
      <ExpandedTweet
        tweet={selectedTweet}
        onBack={() => setSelectedTweet(null)}
        onLike={onLike}
        onRetweet={onRetweet}
        session={session}
      />
    ) : (
      <div className="space-y-4 mt-4">
        {tweets.map((tweet) =>
          tweet.user ? (
            <Tweet
              key={tweet.id}
              tweet={tweet}
              onClick={() => onExpandTweet(tweet)}
              onLike={onLike}
              onRetweet={onRetweet}
              session={session}
            />
          ) : (
            <div key={tweet.id} className="p-4 bg-red-100 rounded-lg shadow-lg">
              <p>Tweet data is incomplete</p>
            </div>
          )
        )}
      </div>
    )}
  </main>
);

const TweetForm = ({ onSubmit, newTweet, setNewTweet }) => (
  <motion.form
    className="bg-gray-700 p-4 rounded shadow-md"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5 }}
    onSubmit={onSubmit}
  >
    <textarea
      className="w-full p-2 rounded border border-gray-600 bg-gray-800 text-white focus:outline-none focus:border-blue-500"
      rows="3"
      placeholder="What's happening?"
      value={newTweet}
      onChange={(e) => setNewTweet(e.target.value)}
    ></textarea>
    <button
      type="submit"
      className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Tweet
    </button>
  </motion.form>
);

const Tweet = ({ tweet, onClick, onLike, onRetweet, session }) => {
  const hasLiked = tweet.likes?.some(
    (like) => like.userId === session?.user?.id
  );
  const hasRetweeted = tweet.retweets?.some(
    (retweet) => retweet.userId === session?.user?.id
  );

  return (
    <motion.div
      className="flex flex-col md:flex-row space-x-4 p-4 bg-gray-800 rounded-lg shadow-md hover:shadow-lg border border-gray-700 cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
    >
      <Link href={`/profile/${tweet.user.username}`}>
        <Image
          src={tweet.user.profilePic || "/default-avatar.png"}
          alt={`${tweet.user.name}'s avatar`}
          width={50}
          height={50}
          className="rounded-full cursor-pointer"
        />
      </Link>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <Link href={`/profile/${tweet.user.username}`}>
            {tweet.user.name}
          </Link>
          <span className="text-gray-400">@{tweet.user.username}</span>
        </div>
        <p className="mt-1">{tweet.content}</p>
        <div className="mt-2 flex items-center space-x-4 text-gray-400">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(tweet.id);
            }}
            className="hover:text-white"
          >
            <FontAwesomeIcon
              icon={faHeart}
              className={hasLiked ? "text-red-500" : "text-gray-400"}
            />
            ({tweet.likes?.length || 0})
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetweet(tweet.id);
            }}
            className="hover:text-white"
          >
            <FontAwesomeIcon
              icon={faRetweet}
              className={hasRetweeted ? "text-green-500" : "text-gray-400"}
            />
            ({tweet.retweets?.length || 0})
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ExpandedTweet = ({ tweet, onBack, onLike, onRetweet, session }) => {
  const hasLiked = tweet.likes?.some(
    (like) => like.userId === session?.user?.id
  );
  const hasRetweeted = tweet.retweets?.some(
    (retweet) => retweet.userId === session?.user?.id
  );

  return (
    <motion.div
      className="flex-1 flex flex-col p-4 bg-gray-900 overflow-y-auto rounded-lg shadow-md border border-gray-700"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <button
        className="self-start mb-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={onBack}
      >
        Back
      </button>
      <div className="flex flex-col md:flex-row space-x-4 p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700">
        <Link href={`/profile/${tweet.user.username}`}>
          <Image
            src={tweet.user.profilePic || "/default-avatar.png"}
            alt={`${tweet.user.name}'s avatar`}
            width={50}
            height={50}
            className="rounded-full cursor-pointer"
          />
        </Link>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Link href={`/profile/${tweet.user.username}`}>
              {tweet.user.name}
            </Link>
            <span className="text-gray-400">@{tweet.user.username}</span>
          </div>
          <p className="mt-1">{tweet.content}</p>

          <div className="mt-2 flex items-center space-x-4 text-gray-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(tweet.id);
              }}
              className="hover:text-white"
            >
              <FontAwesomeIcon
                icon={faHeart}
                className={hasLiked ? "text-red-500" : "text-gray-400"}
              />
              ({tweet.likes?.length || 0})
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetweet(tweet.id);
              }}
              className="hover:text-white"
            >
              <FontAwesomeIcon
                icon={faRetweet}
                className={hasRetweeted ? "text-green-500" : "text-gray-400"}
              />
              ({tweet.retweets?.length || 0})
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
