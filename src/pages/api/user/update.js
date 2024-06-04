// src/pages/api/user/update.js
import prisma from "../../../../prisma";
import { getSession } from "next-auth/react";
import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle multipart form data
  },
};

const handler = async (req, res) => {
  const session = await getSession({ req });

  console.log("Session Data in API:", session); // Debugging log

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Use formidable to parse multipart form data
  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to parse form data" });
    }

    // Ensure userId is handled correctly if it's an array
    const userId = Array.isArray(fields.userId)
      ? fields.userId[0]
      : fields.userId;
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const bio = Array.isArray(fields.bio) ? fields.bio[0] : fields.bio;

    let profilePic = fields.profilePic;
    let coverPic = fields.coverPic;

    // If files are provided, handle file upload (e.g., save to a public directory)
    if (files.profilePic) {
      const oldPath = files.profilePic.filepath;
      const newPath = path.join(
        process.cwd(),
        "public/uploads",
        files.profilePic.originalFilename
      );
      await fs.rename(oldPath, newPath);
      profilePic = `/uploads/${files.profilePic.originalFilename}`;
    }

    if (files.coverPic) {
      const oldPath = files.coverPic.filepath;
      const newPath = path.join(
        process.cwd(),
        "public/uploads",
        files.coverPic.originalFilename
      );
      await fs.rename(oldPath, newPath);
      coverPic = `/uploads/${files.coverPic.originalFilename}`;
    }

    console.log("User ID from Session:", session.user.id); // Debugging log
    console.log("User ID from Request:", userId); // Debugging log

    if (session.user.id !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          bio,
          profilePic,
          coverPic,
        },
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
};

export default handler;
