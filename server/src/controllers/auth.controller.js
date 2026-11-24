import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { registerSchema } from "../validators/auth.schemas.js";

export const register = async (req, res) => {
  // 1. Validate incoming data
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid registration data",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const { name, email, password } = result.data;
  try {
    // 2. Hash the password
    const passwordHash = await argon2.hash(password);

    // 3. Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // 4. Return the created user
    return res.status(201).json({
      message: "User registered successfuly",
      user,
    });
  } catch (error) {
    // Handle duplicate email
    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }
    console.error("Registration error: ", error);
    return res.status(500).json({
      message: "Something went wrong while creating you account",
    });
  }
};
