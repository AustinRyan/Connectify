import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Image from "next/image";

const Messages = () => {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [content, setContent] = useState("");
  const [users, setUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      if (session) {
        try {
          const response = await axios.get("/api/messages/conversations", {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });
          const uniqueConversations = [];
          const userSet = new Set();

          response.data.forEach((conversation) => {
            const userId =
              conversation.senderId === session.user.id
                ? conversation.receiverId
                : conversation.senderId;

            if (!userSet.has(userId)) {
              uniqueConversations.push(conversation);
              userSet.add(userId);
            }
          });

          setConversations(uniqueConversations);
        } catch (error) {
          console.error("Error fetching conversations:", error);
        }
      }
    };
    fetchConversations();
  }, [session]);

  const fetchMessages = async (userId) => {
    if (session) {
      try {
        const response = await axios.get("/api/messages/fetch", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const userMessages = response.data.filter(
          (message) =>
            (message.senderId === userId || message.receiverId === userId) &&
            (message.senderId === session.user.id ||
              message.receiverId === session.user.id)
        );
        setMessages(userMessages);
        setSelectedUser(userId);

        // Mark messages as read
        await axios.post(
          "/api/messages/markAsRead",
          { senderId: userId },
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !content) return;

    try {
      const response = await axios.post(
        "/api/messages/create",
        {
          receiverId: selectedUser,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      const newMessage = response.data;
      newMessage.sender = {
        name: session.user.name,
        username: session.user.username,
        profilePic: session.user.image || "",
      };
      setMessages([...messages, newMessage]);
      setContent("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleShowUsers = async () => {
    setShowUserDropdown(!showUserDropdown);
    if (users.length === 0) {
      try {
        const response = await axios.get("/api/user/fetchAllUsers", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }
  };

  const handleUserSelection = (userId) => {
    fetchMessages(userId);
    setShowUserDropdown(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <div className="flex space-x-4">
        <div className="w-1/3 shadow-md rounded-lg p-4">
          <h2 className="text-2xl font-semibold mb-4">Conversations</h2>
          <button
            onClick={handleShowUsers}
            className="bg-blue-500 text-white px-4 py-2 rounded mb-4 w-full"
          >
            Message Another User
          </button>
          {showUserDropdown && (
            <div className="mb-4">
              <select
                onChange={(e) => handleUserSelection(e.target.value)}
                className="border p-2 w-full text-black rounded"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const user =
                conversation.senderId === session.user.id
                  ? conversation.receiver
                  : conversation.sender;
              return (
                <div
                  key={user.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => fetchMessages(user.id)}
                >
                  <div className="flex items-center space-x-4">
                    <Image
                      src={user.profilePic || ""}
                      alt="Profile"
                      className="rounded-full"
                      width={40}
                      height={40}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                    <div>
                      <p className="font-bold">{user.name}</p>
                      <p className="text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="w-2/3 shadow-md rounded-lg p-4">
          {selectedUser && (
            <>
              <div className="mb-4 bg-gray-800 text-white p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  Messaging{" "}
                  {users.find((user) => user.id === selectedUser)?.name}
                </h3>
              </div>
              <div className="space-y-4 mb-4">
                {messages.map((message) => (
                  <div key={message.id} className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={message.sender?.profilePic || ""}
                        alt="Profile"
                        className="rounded-full"
                        width={32}
                        height={32}
                        onError={(e) => (e.target.style.display = "none")}
                      />
                      <div>
                        <p className="font-bold">
                          {message.sender?.name || "Unknown"}
                        </p>
                        <p className="text-gray-500">
                          @{message.sender?.username || "unknown"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2">{message.content}</p>
                    <p className="text-gray-500 text-sm">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message"
                  className="border p-2 w-full mb-2 text-black rounded"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded w-full"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
