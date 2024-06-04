// src/pages/api/notifications/unreadCount.js
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

    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        read: false,
      },
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch unread notification count" });
  }
};
