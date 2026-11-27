import { prisma } from "../lib/prisma.js";
import {
  projectTaskParamsSchema,
  taskParamsSchema,
  createTaskSchema,
  updateTaskSchema,
} from "../validators/task.schemas.js";

// Find a user's membership in a project
const findProjectMembership = (projectId, userId) => {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
};

// Fields we want returned whenever we retrieve a task
const taskSelection = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  projectId: true,
  createdById: true,
  assignedToId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

// Create a task

export const createTask = async (req, res) => {
  const paramsResult = projectTaskParamsSchema.safeParse(req.params);
  const bodyResult = createTaskSchema.safeParse(req.body);

  if (!paramsResult.success || !bodyResult.success) {
    return res.status(400).json({
      message: "Invalid request data",
    });
  }

  const { projectId } = paramsResult.data;
  const { title, description, priority, dueDate, assignedToId } =
    bodyResult.data;

  try {
    // 1. Verify project membership
    const membership = await findProjectMembership(
      projectId,
      req.session.userId,
    );

    if (!membership) {
      return res.status(404).json({
        message: "Project not found or you are not a member",
      });
    }

    // 2. Verify that the assignee belongs to this project
    if (assignedToId != null) {
      const assigneeMembership = await findProjectMembership(
        projectId,
        assignedToId,
      );

      if (!assigneeMembership) {
        return res.status(400).json({
          message: "Assignee must be a member of this project",
        });
      }
    }

    // 3. Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        priority: priority ?? "MEDIUM",
        dueDate: dueDate ?? null,

        project: {
          connect: { id: projectId },
        },

        createdBy: {
          connect: { id: req.session.userId },
        },

        ...(assignedToId != null && {
          assignedTo: {
            connect: { id: assignedToId },
          },
        }),
      },

      select: taskSelection,
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      message: "Something went wrong while creating the task",
    });
  }
};

// Retrieving project tasks

export const getProjectTasks = async (req, res) => {
  const paramsResult = projectTaskParamsSchema.safeParse(req.params);

  if (!paramsResult.success) {
    return res.status(400).json({
      message: "Invalid project ID",
    });
  }

  const { projectId } = paramsResult.data;

  try {
    // 1. Verify project membership
    const membership = await findProjectMembership(
      projectId,
      req.session.userId,
    );

    if (!membership) {
      return res.status(404).json({
        message: "Project not found or you are not a member",
      });
    }

    // 2. Retrieve tasks
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
      },

      orderBy: [{ createdAt: "desc" }, { id: "desc" }],

      select: taskSelection,
    });

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("Get project tasks error:", error);

    return res.status(500).json({
      message: "Something went wrong while retrieving tasks",
    });
  }
};

// Update a task

export const updateTask = async (req, res) => {
  const paramsResult = taskParamsSchema.safeParse(req.params);
  const bodyResult = updateTaskSchema.safeParse(req.body);

  if (!paramsResult.success || !bodyResult.success) {
    return res.status(400).json({
      message: "Invalid request data",
    });
  }

  const { projectId, taskId } = paramsResult.data;
  const { assignedToId, ...fieldsToUpdate } = bodyResult.data;

  try {
    // 1. Verify project membership
    const membership = await findProjectMembership(
      projectId,
      req.session.userId,
    );

    if (!membership) {
      return res.status(404).json({
        message: "Project not found or you are not a member",
      });
    }

    // 2. Verify that the task belongs to this project
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      select: {
        id: true,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // 3. Verify the new assignee if one was provided
    if (assignedToId != null) {
      const assigneeMembership = await findProjectMembership(
        projectId,
        assignedToId,
      );

      if (!assigneeMembership) {
        return res.status(400).json({
          message: "Assignee must be a member of this project",
        });
      }
    }

    // 4. Prepare update data
    const updateData = { ...fieldsToUpdate };

    // Handle assignment separately
    if (assignedToId !== undefined) {
      updateData.assignedTo =
        assignedToId === null
          ? { disconnect: true }
          : { connect: { id: assignedToId } };
    }

    // 5. Update task
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },

      data: updateData,

      select: taskSelection,
    });

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      message: "Something went wrong while updating the task",
    });
  }
};

// Delete a task

export const deleteTask = async (req, res) => {
  const paramsResult = taskParamsSchema.safeParse(req.params);

  if (!paramsResult.success) {
    return res.status(400).json({
      message: "Invalid request parameters",
    });
  }

  const { projectId, taskId } = paramsResult.data;

  try {
    // 1. Verify project membership
    const membership = await findProjectMembership(
      projectId,
      req.session.userId,
    );

    if (!membership) {
      return res.status(404).json({
        message: "Project not found or you are not a member",
      });
    }

    // 2. Find the task inside this project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      select: {
        id: true,
        createdById: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // 3. Check deletion permissions
    const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(membership.role);

    const isTaskCreator = task.createdById === req.session.userId;

    if (!isOwnerOrAdmin && !isTaskCreator) {
      return res.status(403).json({
        message: "You don't have permission to delete this task",
      });
    }

    // 4. Delete task
    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      message: "Something went wrong while deleting the task",
    });
  }
};
