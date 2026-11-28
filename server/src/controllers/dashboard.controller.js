import { prisma } from "../lib/prisma.js";

export const getDashboard = async (req, res) => {
  const userId = req.session.userId;

  // Define the current time and the next 7 days
  const now = new Date();

  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Only consider tasks in projects the user currently belongs to
  const projectMembershipFilter = {
    project: {
      is: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  };

  // Tasks assigned to the current user
  const assignedTasksFilter = {
    assignedToId: userId,
    ...projectMembershipFilter,
  };

  try {
    // Execute independent database queries concurrently
    const [
      totalProjects,
      totalAssignedTasks,
      taskGroups,
      overdueTasks,
      dueInNext7Days,
      upcomingTasks,
      recentProjects,
    ] = await Promise.all([
      // 1. Count projects the user belongs to
      prisma.project.count({
        where: {
          members: {
            some: {
              userId,
            },
          },
        },
      }),

      // 2. Count all tasks assigned to user
      prisma.task.count({
        where: assignedTasksFilter,
      }),

      // 3. Group assigned tasks by status
      prisma.task.groupBy({
        by: ["status"],
        where: assignedTasksFilter,
        _count: {
          _all: true,
        },
      }),

      // 4. Count overdue, unfinished tasks
      prisma.task.count({
        where: {
          ...assignedTasksFilter,
          status: {
            not: "DONE",
          },
          dueDate: {
            lt: now,
          },
        },
      }),

      // 5. Count tasks due within the next 7 days
      prisma.task.count({
        where: {
          ...assignedTasksFilter,
          status: {
            not: "DONE",
          },
          dueDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
      }),

      // 6. Retrieve the next 5 upcoming tasks
      prisma.task.findMany({
        where: {
          ...assignedTasksFilter,
          status: {
            not: "DONE",
          },
          dueDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
        orderBy: [
          {
            dueDate: "asc",
          },
          {
            id: "asc",
          },
        ],
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // 7. Retrieve the 5 most recently created projects
      prisma.project.findMany({
        where: {
          members: {
            some: {
              userId,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
      }),
    ]);

    // Initialize every status with zero
    const taskByStatus = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    // Fill the actual counts returned by Prisma
    for (const group of taskGroups) {
      taskByStatus[group.status] = group._count._all;
    }
    return res.status(200).json({
      summary: {
        totalProjects,
        totalAssignedTasks,
        overdueTasks,
        dueInNext7Days,
      },
      taskByStatus,
      upcomingTasks,
      recentProjects,
    });
  } catch (error) {
    console.error("Get dashboard error: ", error);
    return res.status(500).json({
      message: "Something went wrong while retrieving dashboard data",
    });
  }
};
