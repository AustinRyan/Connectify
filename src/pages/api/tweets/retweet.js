// src/pages/api/tweets/retweet.js
import prisma from "../../../../prisma";
import { getSession } from "next-auth/react";
import jwt from "jsonwebtoken";

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

    // Check if the user has already retweeted the tweet
    const existingRetweet = await prisma.retweet.findFirst({
      where: {
        userId,
        tweetId,
      },
    });

    if (existingRetweet) {
      return res.status(400).json({ error: "Already retweeted" });
    }

    // Create a new retweet
    const newRetweet = await prisma.retweet.create({
      data: {
        userId,
        tweetId,
      },
    });

    res.status(201).json(newRetweet);
  } catch (error) {
    console.error("Error retweeting:", error);
    res.status(500).json({ error: "Failed to retweet" });
  }
};
