// pages/api/user/email/[email].js
import prisma from "../../../../../prisma";

export default async (req, res) => {
  const { email } = req.query;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.status(200).json(user);
};
