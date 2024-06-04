// src/pages/api/messages/markAsRead.js
import prisma from "../../../../prisma";
import jwt from "jsonwebtoken";

export default async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    const { userId } = decodedToken;
    const { senderId } = req.body;

    await prisma.message.updateMany({
      where: {
        senderId: senderId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};
