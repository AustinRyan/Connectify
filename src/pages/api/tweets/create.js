// src/pages/api/tweets/create.js
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

    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Tweet content cannot be empty" });
    }

    const newTweet = await prisma.tweet.create({
      data: {
        content,
        userId,
        createdAt: new Date(),
      },
      include: {
        user: true, // Include user data in the response
      },
    });

    res.status(201).json(newTweet);
  } catch (error) {
    console.error("Error creating tweet:", error);
    res.status(500).json({ error: "Failed to create tweet" });
  }
};
