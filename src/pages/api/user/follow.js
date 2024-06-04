// src/pages/api/user/follow.js
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
    const { userIdToFollow } = req.body;

    // Check if the user is already following
    const existingFollow = await prisma.follower.findFirst({
      where: {
        followerId: userId,
        followingId: userIdToFollow,
      },
    });

    if (existingFollow) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Create a new follow entry
    await prisma.follower.create({
      data: {
        followerId: userId,
        followingId: userIdToFollow,
      },
    });

    res.status(201).json({ message: "User followed successfully" });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
};
