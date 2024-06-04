import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaHome, FaEnvelope, FaUser } from "react-icons/fa";
import axios from "axios";
import Image from "next/image";

import Modal from "./Modal";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900 text-white">
      <Sidebar isOpen={isSidebarOpen} session={session} />
      <div className="flex-1 flex flex-col">
        <Header session={session} />
        <main className="flex-1 flex flex-col md:flex-row">{children}</main>
      </div>
      <RightSidebar session={session} />
    </div>
  );
};

const Header = ({ session }) => (
  <motion.header
    className="bg-black text-white p-4 flex flex-col md:flex-row justify-between items-center shadow-lg"
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex-1 text-center md:text-left mb-4 md:mb-0">
      <h1 className="text-3xl font-extrabold tracking-tight font-inter">
        Connectify
      </h1>
    </div>
    <nav className="space-x-0 md:space-x-6 text-lg flex flex-col md:flex-row items-center">
      {session ? (
        <>
          <span className="font-medium truncate text-center md:text-left w-full md:w-auto">
            Welcome, {session.user.name}!
          </span>
          <button
            onClick={() => signOut()}
            className="hover:underline focus:outline-none mt-2 md:mt-0"
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <Link href="/auth/signup" className="hover:underline mt-2 md:mt-0">
            Sign Up
          </Link>
          <Link href="/auth/signin" className="hover:underline mt-2 md:mt-0">
            Sign In
          </Link>
        </>
      )}
    </nav>
  </motion.header>
);

const Sidebar = ({ isOpen, session }) => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUnreadCounts = async () => {
    if (session) {
      try {
        const messagesResponse = await axios.get("/api/messages/unreadCount", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        setUnreadMessages(messagesResponse.data.unreadCount);

        const notificationsResponse = await axios.get(
          "/api/notifications/unreadCount",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );
        setUnreadNotifications(notificationsResponse.data.unreadCount);
      } catch (error) {
        console.error("Error fetching unread counts:", error);
      }
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
  }, [session]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCounts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleMessagesClick = (e) => {
    if (!session) {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };

  const handleProfileClick = (e) => {
    if (!session) {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <motion.aside
        className={`bg-black w-64 p-4 md:block fixed md:relative ${
          isOpen ? "block" : "hidden"
        } md:block`}
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="space-y-4">
          <Link
            href="/"
            className="p-4 flex items-center hover:bg-gray-700 rounded text-lg"
          >
            <FaHome className="mr-3" /> Home
          </Link>

          <Link
            href="/messages"
            className="p-4 flex items-center hover:bg-gray-700 rounded text-lg relative"
            onClick={handleMessagesClick}
          >
            <FaEnvelope className="mr-3" /> Messages
            {unreadMessages > 0 && (
              <span className="absolute right-4 bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
                {unreadMessages}
              </span>
            )}
          </Link>
          <Link
            href={session ? `/profile/${session.user.username}` : "/profile"}
            className="p-4 flex items-center hover:bg-gray-700 rounded text-lg"
            onClick={handleProfileClick}
          >
            <FaUser className="mr-3" /> My Profile
          </Link>
        </nav>
      </motion.aside>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

const RightSidebar = ({ session }) => {
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultProfilePic = "https://randomuser.me/api/portraits/lego/0.jpg";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/user/fetchAllUsers");
        setUsers(response.data);
        if (session) {
          const followingResponse = await axios.get(
            `/api/user/following/${session.user.id}`
          );
          setFollowing(followingResponse.data.map((f) => f.followingId));
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [session]);

  const handleFollow = async (userIdToFollow) => {
    if (!session) {
      setIsModalOpen(true);
      return;
    }

    try {
      const response = await axios.post(
        "/api/user/follow",
        { userIdToFollow },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (response.status === 201) {
        setFollowing([...following, userIdToFollow]);
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async (userIdToUnfollow) => {
    try {
      const response = await axios.post(
        "/api/user/unfollow",
        { userIdToUnfollow },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        setFollowing(following.filter((id) => id !== userIdToUnfollow));
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  return (
    <>
      <aside className="bg-black w-full md:w-80 p-4">
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded shadow-md">
            <h2 className="text-xl font-bold mb-2">Who to follow</h2>
            <div className="space-y-4">
              {users
                .filter((user) => user.id !== session?.user.id)
                .map((user) => (
                  <div key={user.id} className="flex items-center space-x-4">
                    <Image
                      src={user.profilePic || defaultProfilePic}
                      alt={`${user.name}'s avatar`}
                      width={50}
                      height={50}
                      className="rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${user.username}`}
                        className="text-white font-bold hover:underline truncate block"
                      >
                        {user.name}
                      </Link>
                      <p className="text-gray-400 truncate">@{user.username}</p>
                    </div>
                    {following.includes(user.id) ? (
                      <button
                        onClick={() => handleUnfollow(user.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Unfollow
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollow(user.id)}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Follow
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </aside>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Layout;
