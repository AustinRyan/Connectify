// src/pages/api/user/unfollow.js
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
    const { userIdToUnfollow } = req.body;

    // Check if the user is following
    const existingFollow = await prisma.follower.findFirst({
      where: {
        followerId: userId,
        followingId: userIdToUnfollow,
      },
    });

    if (!existingFollow) {
      return res.status(400).json({ error: "Not following this user" });
    }

    // Delete the follow entry
    await prisma.follower.delete({
      where: { id: existingFollow.id },
    });

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
};
