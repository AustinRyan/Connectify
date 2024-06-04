import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async (req, res) => {
  const { userId } = req.query;

  try {
    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      include: {
        following: true,
      },
    });

    res.status(200).json(following);
  } catch (error) {
    console.error("Error fetching following list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
