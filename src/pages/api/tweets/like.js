// src/pages/api/tweets/like.js
import { getSession } from "next-auth/react";
import jwt from "jsonwebtoken";
import prisma from "../../../../prisma";

export default async (req, res) => {
  const { tweetId } = req.body;

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

    // Check if the tweet exists
    const tweet = await prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }

    // Check if the user has already liked the tweet
    const existingLike = await prisma.like.findFirst({
      where: {
        userId,
        tweetId,
      },
    });

    if (existingLike) {
      return res.status(400).json({ error: "Already liked" });
    }

    // Create a new like
    const newLike = await prisma.like.create({
      data: {
        userId,
        tweetId,
      },
    });

    res.status(201).json(newLike);
  } catch (error) {
    console.error("Error liking tweet:", error);
    res.status(500).json({ error: "Failed to like tweet" });
  }
};
