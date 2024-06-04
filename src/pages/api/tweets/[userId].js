// src/pages/api/tweets/[userId].js
import prisma from "../../../../prisma";

export default async (req, res) => {
  const { userId } = req.query;

  try {
    const tweets = await prisma.tweet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            username: true,
            profilePic: true,
          },
        },
        likes: true,
        retweets: true,
      },
    });
    res.status(200).json(tweets);
  } catch (error) {
    console.error("Error fetching tweets:", error);
    res.status(500).json({ error: "Failed to fetch tweets" });
  }
};
