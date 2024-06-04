import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useSession, getSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faRetweet } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import Link from "next/link";

const Profile = () => {
  const router = useRouter();
  const { username } = router.query;
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newCoverPic, setNewCoverPic] = useState(null);
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [newTweet, setNewTweet] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/user/${username}`);
        setUser(response.data);

        setNewName(response.data.name);
        setNewBio(response.data.bio);

        if (session) {
          const followingResponse = await axios.get(
            `/api/user/following/${session.user.id}`
          );
          setIsFollowing(
            followingResponse.data.some(
              (follow) => follow.followingId === response.data.id
            )
          );
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (username) {
      fetchUser();
    }
  }, [username, session]);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const response = await axios.get(`/api/tweets/${user.id}`);
        setTweets(response.data);
      } catch (error) {
        console.error("Error fetching tweets:", error);
      }
    };

    if (user) {
      fetchTweets();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    const formData = new FormData();
    formData.append("userId", user.id);
    formData.append("name", newName);
    formData.append("bio", newBio);
    if (newCoverPic) formData.append("coverPic", newCoverPic);
    if (newProfilePic) formData.append("profilePic", newProfilePic);

    const session = await getSession();
    if (!session || !session.accessToken) {
      console.error("No session or access token found");
      return;
    }

    try {
      await axios.put(`/api/user/update`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      setIsEditing(false);
      axios.get(`/api/user/${username}`).then((response) => {
        setUser(response.data);
        setNewName(response.data.name);
        setNewBio(response.data.bio);
      });
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handlePostNewTweet = async () => {
    if (!newTweet.trim()) return;

    try {
      const session = await getSession();
      if (!session || !session.accessToken) {
        console.error("No session or access token found");
        return;
      }

      const response = await axios.post(
        "/api/tweets/create",
        {
          content: newTweet,
        },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      const newTweetData = {
        ...response.data,
        likes: [],
        retweets: [],
      };

      setTweets([newTweetData, ...tweets]);
      setNewTweet("");
    } catch (error) {
      console.error("Error posting new tweet:", error);
    }
  };

  const handleLike = async (tweetId) => {
    try {
      const session = await getSession();
      if (!session || !session.accessToken) {
        console.error("No session or access token found");
        return;
      }

      let accessToken = session.accessToken;

      await axios.post(
        "/api/tweets/like",
        { tweetId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setTweets((prevTweets) =>
        prevTweets.map((tweet) =>
          tweet.id === tweetId
            ? { ...tweet, likes: [...tweet.likes, { userId: session.user.id }] }
            : tweet
        )
      );
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  };

  const handleRetweet = async (tweetId) => {
    try {
      const session = await getSession();
      if (!session || !session.accessToken) {
        console.error("No session or access token found");
        return;
      }

      let accessToken = session.accessToken;

      await axios.post(
        "/api/tweets/retweet",
        { tweetId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setTweets((prevTweets) =>
        prevTweets.map((tweet) =>
          tweet.id === tweetId
            ? {
                ...tweet,
                retweets: [...tweet.retweets, { userId: session.user.id }],
              }
            : tweet
        )
      );
    } catch (error) {
      console.error("Error retweeting:", error);
    }
  };

  const handleFollow = async () => {
    try {
      const session = await getSession();
      if (!session || !session.accessToken) {
        console.error("No session or access token found");
        return;
      }

      await axios.post(
        "/api/user/follow",
        { userIdToFollow: user.id },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      setIsFollowing(true);
      setUser({
        ...user,
        followers: [...user.followers, { followerId: session.user.id }],
      });
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async () => {
    try {
      const session = await getSession();
      if (!session || !session.accessToken) {
        console.error("No session or access token found");
        return;
      }

      await axios.post(
        "/api/user/unfollow",
        { userIdToUnfollow: user.id },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      setIsFollowing(false);
      setUser({
        ...user,
        followers: user.followers.filter(
          (follower) => follower.followerId !== session.user.id
        ),
      });
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!session || !session.user.username) {
    return (
      <div className="flex-1 flex flex-col bg-gray-900 text-white">
        <div className="max-w-xl w-full mx-auto rounded-none md:rounded-2xl p-8 md:p-12 shadow-input  dark:bg-black">
          <motion.div
            className=" left-1/2 transform -translate-x-1/2 bg-gray-800 p-6 rounded-lg shadow-lg text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-4">Welcome to Connectify</h1>
            <p className="mb-4">Please sign in to view this page.</p>
            <div className="flex justify-center space-x-4">
              <Link href="/auth/signup">
                <div className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300">
                  Sign Up
                </div>
              </Link>
              <Link href="/auth/signin">
                <div className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300">
                  Sign In
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const isCurrentUserProfile = session.user.username === username;

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="flex-1 flex flex-col items-center bg-gray-900 text-white">
      <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="relative h-48 bg-blue-600">
          {user.coverPic && (
            <Image
              src={user.coverPic}
              alt={`${user.name}'s cover picture`}
              layout="fill"
              objectFit="cover"
              className="absolute top-0 left-0"
            />
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center space-x-4 px-4 py-6 bg-gray-800 relative">
          <div className="relative">
            {user.profilePic && (
              <Image
                src={user.profilePic}
                alt={`${user.name}'s profile picture`}
                width={150}
                height={150}
                className="rounded-full border-4 border-gray-800 -mt-20"
              />
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded border border-gray-500 w-full"
              />
            ) : (
              <h1 className="text-3xl font-bold">{user.name}</h1>
            )}
            <p className="text-gray-500">@{user.username}</p>
          </div>
          {isCurrentUserProfile && !isEditing && (
            <button
              className="mt-4 sm:mt-0 sm:ml-auto bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
          {!isCurrentUserProfile && (
            <button
              className={`mt-4 sm:mt-0 sm:ml-auto ${
                isFollowing ? "bg-red-500" : "bg-blue-500"
              } text-white px-4 py-2 rounded`}
              onClick={isFollowing ? handleUnfollow : handleFollow}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>
        <div className="px-4 py-6 bg-gray-800">
          {isEditing ? (
            <>
              <textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                className="w-full text-black p-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500"
                rows="3"
                placeholder="Update your bio"
              ></textarea>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={handleSaveProfile}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4">{user.bio}</p>
              <div className="mt-4 flex space-x-4">
                <div>
                  <span className="font-bold">{user.followers.length}</span>{" "}
                  Followers
                </div>
                <div>
                  <span className="font-bold">{user.following.length}</span>{" "}
                  Following
                </div>
              </div>
            </>
          )}
        </div>
        <div className="px-4 py-6 bg-gray-900">
          <h2 className="text-2xl font-bold">Tweets</h2>
          {isCurrentUserProfile && (
            <div className="mt-4 mb-6">
              <textarea
                value={newTweet}
                onChange={(e) => setNewTweet(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded border border-gray-500 focus:outline-none focus:border-blue-500"
                rows="3"
                placeholder="What's happening?"
              ></textarea>
              <button
                onClick={handlePostNewTweet}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Post Tweet
              </button>
            </div>
          )}
          <div className="space-y-4 mt-4">
            {tweets.map((tweet) => {
              tweet.likes = tweet.likes || [];
              tweet.retweets = tweet.retweets || [];

              const hasLiked = tweet.likes.some(
                (like) => like.userId === session?.user?.id
              );
              const hasRetweeted = tweet.retweets.some(
                (retweet) => retweet.userId === session?.user?.id
              );

              return (
                <div
                  key={tweet.id}
                  className="p-4 bg-gray-800 rounded-lg shadow-lg"
                >
                  <p>{tweet.content}</p>
                  <div className="flex space-x-5 items-center mt-2">
                    <button
                      onClick={() => handleLike(tweet.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      <FontAwesomeIcon
                        icon={faHeart}
                        className={hasLiked ? "text-red-500" : "text-gray-400"}
                      />{" "}
                      {tweet.likes.length} Likes
                    </button>
                    <button
                      onClick={() => handleRetweet(tweet.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      <FontAwesomeIcon
                        icon={faRetweet}
                        className={
                          hasRetweeted ? "text-green-500" : "text-gray-400"
                        }
                      />{" "}
                      {tweet.retweets.length} Retweets
                    </button>
                  </div>
                  <span className="text-gray-500 text-sm">
                    {new Date(tweet.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
