// pages/api/user/[username].js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async (req, res) => {
  const { username } = req.query;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      tweets: true,
      followers: { include: { follower: true } },
      following: { include: { following: true } },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.status(200).json(user);
};
