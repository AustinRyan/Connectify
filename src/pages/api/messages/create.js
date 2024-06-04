// src/pages/api/messages/create.js
import prisma from "../../../../prisma";
import { getSession } from "next-auth/react";
import jwt from "jsonwebtoken";

export default async (req, res) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    // Verify the JWT
    const decodedToken = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    const { userId } = decodedToken;

    const { receiverId, content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }

    const newMessage = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        receiverId,
        createdAt: new Date(),
        read: false,
      },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Failed to create message" });
  }
};
