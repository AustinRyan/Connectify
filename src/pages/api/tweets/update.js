// src/pages/api/tweets/update.js
import prisma from "../../../../prisma";
import { getSession } from "next-auth/react";

export default async (req, res) => {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { tweetId, content } = req.body;

  try {
    const tweet = await prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (tweet.userId !== session.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updatedTweet = await prisma.tweet.update({
      where: { id: tweetId },
      data: { content },
    });

    res.status(200).json(updatedTweet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update tweet" });
  }
};
