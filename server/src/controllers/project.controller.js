import { prisma } from "../lib/prisma.js";
import { createProjectSchema } from "../validators/projects/project.schema.js";

// Create a project
export const createProject = async (req, res) => {
  // 1. Validate incoming data
  const result = createProjectSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid project data",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const { name, description } = result.data;

  try {
    // 2. Create project and its owner membership
    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdBy: {
          connect: {
            id: req.session.userId,
          },
        },
        members: {
          create: {
            user: {
              connect: {
                id: req.session.userId,
              },
            },
            role: "OWNER",
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            userId: true,
            role: true,
            joinedAt: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error: ", error);
    return res.status(500).json({
      message: "Something went wrong while creating the project",
    });
  }
};

// Get projects belonging to the authenticated user
export const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.session.userId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: {
            userId: req.session.userId,
          },
          select: {
            role: true,
            joinedAt: true,
          },
        },
      },
    });

    const formattedProjects = projects.map(({ members, ...project }) => ({
      ...project,
      membership: members[0],
    }));

    return res.status(200).json({
      projects: formattedProjects,
    });
  } catch (error) {
    console.error("Get projects error: ", error);
    return res.status(500).json({
      message: "Something went wrong while retrieving projects",
    });
  }
};
