import { prisma } from "../lib/prisma.js";
import {
  projectParamsSchema,
  projectMemberParamsSchema,
  addProjectMemberSchema,
  updateProjectMemberRoleSchema,
} from "../validators/project-member.schema.js";

// Find a user's membership in a particular project
const findMembership = (projectId, userId) => {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
};

// Retrieve project members
export const getProjectMembers = async (req, res) => {
  const result = projectParamsSchema.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid project ID",
    });
  }

  const { projectId } = result.data;

  try {
    // Check whether the requester belongs to this project
    const requesterMembership = await findMembership(
      projectId,
      req.session.userId,
    );

    if (!requesterMembership) {
      return res.status(404).json({
        message: "Project not found or you are not a member",
      });
    }

    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
      },
      orderBy: {
        joinedAt: "asc",
      },
      select: {
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({ members });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong while retrieving project members",
    });
  }
};

// Add a member to a project
export const addProjectMember = async (req, res) => {
  const paramsResult = projectParamsSchema.safeParse(req.params);
  const bodyResult = addProjectMemberSchema.safeParse(req.body);

  if (!paramsResult.success || !bodyResult.success) {
    return res.status(400).json({
      message: "Invalid request data",
    });
  }

  const { projectId } = paramsResult.data;
  const { email } = bodyResult.data;

  try {
    // 1. Check the requester's membership
    const requesterMembership = await findMembership(
      projectId,
      req.session.userId,
    );

    if (!requesterMembership) {
      return res.status(404).json({
        message: "Project not found or you are not a member",
      });
    }

    // 2. Check permission
    if (!["OWNER", "ADMIN"].includes(requesterMembership.role)) {
      return res.status(403).json({
        message: "You don't have permission to add members",
      });
    }

    // 3. Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 4. Create membership
    const membership = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: "MEMBER",
      },
      select: {
        projectId: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return res.status(201).json({
      message: "Member added successfully",
      membership,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "This user is already a member of the project",
      });
    }
    console.error("Add project member error: ", error);
    return res.status(500).json({
      message: "Something went wrong while adding the member",
    });
  }
};

// Update a member's role
export const updateProjectMemberRole = async (req, res) => {
  const paramsResult = projectMemberParamsSchema.safeParse(req.params);
  const bodyResult = updateProjectMemberRoleSchema.safeParse(req.body);

  if (!paramsResult.success || !bodyResult.success) {
    return res.status(400).json({
      message: "Invalid request data",
    });
  }

  const { projectId, userId } = paramsResult.data;
  const { role } = bodyResult.data;

  try {
    // 1. Check the requester's membership
    const requesterMembership = await findMembership(
      projectId,
      req.session.userId,
    );

    if (!requesterMembership) {
      return res.status(404).json({
        message: "Project not found or you are not a member",
      });
    }

    // 2. Only the owner can change roles
    if (requesterMembership.role !== "OWNER") {
      return res.status(403).json({
        message: "Only the project owner can change member roles",
      });
    }

    // 3. Find the target membership
    const targetMembership = await findMembership(projectId, userId);

    if (!targetMembership) {
      return res.status(404).json({
        message: "Project member not found",
      });
    }

    // 4. Protect the owner
    if (targetMembership.role === "OWNER") {
      return res.status(403).json({
        message: "The project owner's role cannot be changed here",
      });
    }

    // 5. Update the role
    const updatedMembership = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },

      data: {
        role,
      },

      select: {
        projectId: true,
        role: true,
        joinedAt: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Member role updated successfully",
      membership: updatedMembership,
    });
  } catch (error) {
    console.error("Update member role error:", error);

    return res.status(500).json({
      message: "Something went wrong while updating the member role",
    });
  }
};

// Remove a member from a project
export const removeProjectMember = async (req, res) => {
  const result = projectMemberParamsSchema.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid request parameters",
    });
  }

  const { projectId, userId } = result.data;

  try {
    // 1. Check the requester's membership
    const requesterMembership = await findMembership(
      projectId,
      req.session.userId,
    );

    if (!requesterMembership) {
      return res.status(404).json({
        message: "Project not found or you are not a member",
      });
    }

    // 2. Find the target membership
    const targetMembership = await findMembership(projectId, userId);

    if (!targetMembership) {
      return res.status(404).json({
        message: "Project member not found",
      });
    }

    // 3. Protect the owner
    if (targetMembership.role === "OWNER") {
      return res.status(403).json({
        message: "The project owner cannot be removed",
      });
    }

    // 4. Check permissions
    const isOwner = requesterMembership.role === "OWNER";

    const isAdminRemovingMember =
      requesterMembership.role === "ADMIN" &&
      targetMembership.role === "MEMBER";

    if (!isOwner && !isAdminRemovingMember) {
      return res.status(403).json({
        message: "You don't have permission to remove this member",
      });
    }

    // 5. Delete membership
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return res.status(200).json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove project member error:", error);

    return res.status(500).json({
      message: "Something went wrong while removing the member",
    });
  }
};
