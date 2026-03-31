import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import User from "../models/user.js";
import WorkspaceInvite from "../models/workspace-invite.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../libs/send-email.js";
import { recordActivity } from "../libs/index.js";
import { shouldBypassEmail } from "../libs/runtime-config.js";

const createWorkspace = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    const workspace = await Workspace.create({
      name,
      description,
      color,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.user._id,
    })
      .select("name description color members createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(workspaces);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getWorkspaceDetails = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById({
      _id: workspaceId,
    }).populate("members.user", "name email profilePicture");

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    return res.status(200).json(workspace);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getWorkspaceProjects = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    }).populate("members.user", "name email profilePicture");

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: false,
      members: { $elemMatch: { user: req.user._id } },
    })
      .populate("tasks", "status")
      .sort({ createdAt: -1 });

    res.status(200).json({ projects, workspace });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getWorkspaceStats = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    })
      .select("_id")
      .lean();

    if (!workspace) {
      const workspaceExists = await Workspace.exists({ _id: workspaceId });

      return res.status(workspaceExists ? 403 : 404).json({
        message: workspaceExists
          ? "You are not a member of this workspace"
          : "Workspace not found",
      });
    }

    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: false,
    })
      .select("title description status tasks createdAt")
      .populate(
        "tasks",
        "title status dueDate project updatedAt isArchived priority"
      )
      .sort({ createdAt: -1 })
      .lean();

    const totalProjects = projects.length;
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const getDateKey = (date) =>
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    const taskTrendsData = last7Days.map((date) => ({
      name: date.toLocaleDateString("en-US", { weekday: "short" }),
      completed: 0,
      inProgress: 0,
      toDo: 0,
    }));

    const taskTrendLookup = new Map(
      last7Days.map((date, index) => [getDateKey(date), taskTrendsData[index]])
    );

    const projectStatusData = [
      { name: "Completed", value: 0, color: "#10b981" },
      { name: "In Progress", value: 0, color: "#3b82f6" },
      { name: "Planning", value: 0, color: "#f59e0b" },
    ];

    const taskPriorityData = [
      { name: "High", value: 0, color: "#ef4444" },
      { name: "Medium", value: 0, color: "#f59e0b" },
      { name: "Low", value: 0, color: "#6b7280" },
    ];

    let totalTasks = 0;
    let totalProjectInProgress = 0;
    let totalTaskCompleted = 0;
    let totalTaskToDo = 0;
    let totalTaskInProgress = 0;
    const workspaceProductivityData = [];
    const upcomingTasks = [];
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const project of projects) {
      if (project.status === "Completed") {
        projectStatusData[0].value++;
      } else if (project.status === "In Progress") {
        projectStatusData[1].value++;
        totalProjectInProgress++;
      } else if (project.status === "Planning") {
        projectStatusData[2].value++;
      }

      let projectTaskCount = 0;
      let projectCompletedTaskCount = 0;

      for (const task of project.tasks ?? []) {
        totalTasks++;
        projectTaskCount++;

        if (task.status === "Done") {
          totalTaskCompleted++;
          if (task.isArchived === false) {
            projectCompletedTaskCount++;
          }
        } else if (task.status === "In Progress") {
          totalTaskInProgress++;
        } else if (task.status === "To Do") {
          totalTaskToDo++;
        }

        if (task.priority === "High") {
          taskPriorityData[0].value++;
        } else if (task.priority === "Medium") {
          taskPriorityData[1].value++;
        } else if (task.priority === "Low") {
          taskPriorityData[2].value++;
        }

        if (task.dueDate) {
          const taskDueDate = new Date(task.dueDate);

          if (taskDueDate > now && taskDueDate <= next7Days) {
            upcomingTasks.push(task);
          }
        }

        if (!task.updatedAt) {
          continue;
        }

        const trendBucket = taskTrendLookup.get(
          getDateKey(new Date(task.updatedAt))
        );

        if (!trendBucket) {
          continue;
        }

        if (task.status === "Done") {
          trendBucket.completed++;
        } else if (task.status === "In Progress") {
          trendBucket.inProgress++;
        } else if (task.status === "To Do") {
          trendBucket.toDo++;
        }
      }

      workspaceProductivityData.push({
        name: project.title,
        completed: projectCompletedTaskCount,
        total: projectTaskCount,
      });
    }

    const stats = {
      totalProjects,
      totalTasks,
      totalProjectInProgress,
      totalTaskCompleted,
      totalTaskToDo,
      totalTaskInProgress,
    };

    res.status(200).json({
      stats,
      taskTrendsData,
      projectStatusData,
      taskPriorityData,
      workspaceProductivityData,
      upcomingTasks: upcomingTasks
        .sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
        .slice(0, 5),
      recentProjects: projects.slice(0, 5),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const inviteUserToWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const userMemberInfo = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!userMemberInfo || !["admin", "owner"].includes(userMemberInfo.role)) {
      return res.status(403).json({
        message: "You are not authorized to invite members to this workspace",
      });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === existingUser._id.toString()
    );

    if (isMember) {
      return res.status(400).json({
        message: "User already a member of this workspace",
      });
    }

    const isInvited = await WorkspaceInvite.findOne({
      user: existingUser._id,
      workspaceId: workspaceId,
    });

    if (isInvited && isInvited.expiresAt > new Date()) {
      return res.status(400).json({
        message: "User already invited to this workspace",
      });
    }

    if (isInvited && isInvited.expiresAt < new Date()) {
      await WorkspaceInvite.deleteOne({ _id: isInvited._id });
    }

    const inviteToken = jwt.sign(
      {
        user: existingUser._id,
        workspaceId: workspaceId,
        role: role || "member",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await WorkspaceInvite.create({
      user: existingUser._id,
      workspaceId: workspaceId,
      token: inviteToken,
      role: role || "member",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const invitationLink = `${process.env.FRONTEND_URL}/workspace-invite/${workspace._id}?tk=${inviteToken}`;

    const emailContent = `
      <p>You have been invited to join ${workspace.name} workspace</p>
      <p>Click here to join: <a href="${invitationLink}">${invitationLink}</a></p>
    `;

    if (shouldBypassEmail) {
      console.log(`[dev] Workspace invite link for ${email}: ${invitationLink}`);
      return res.status(200).json({
        message:
          "Invitation link generated in local development. Check the backend terminal for the link.",
        invitationLink,
      });
    }

    const isEmailSent = await sendEmail(
      email,
      "You have been invited to join a workspace",
      emailContent
    );

    if (!isEmailSent) {
      return res.status(500).json({
        message: "Failed to send workspace invitation email",
      });
    }

    return res.status(200).json({
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const acceptGenerateInvite = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({
        message: "You are already a member of this workspace",
      });
    }

    workspace.members.push({
      user: req.user._id,
      role: "member",
      joinedAt: new Date(),
    });

    await workspace.save();

    await recordActivity(
      req.user._id,
      "joined_workspace",
      "Workspace",
      workspaceId,
      {
        description: `Joined ${workspace.name} workspace`,
      }
    );

    return res.status(200).json({
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const acceptInviteByToken = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { user, workspaceId, role } = decoded;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === user.toString()
    );

    if (isMember) {
      return res.status(400).json({
        message: "User already a member of this workspace",
      });
    }

    const inviteInfo = await WorkspaceInvite.findOne({
      user: user,
      workspaceId: workspaceId,
    });

    if (!inviteInfo) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (inviteInfo.expiresAt < new Date()) {
      return res.status(400).json({
        message: "Invitation has expired",
      });
    }

    workspace.members.push({
      user: user,
      role: role || "member",
      joinedAt: new Date(),
    });

    await workspace.save();

    await Promise.all([
      WorkspaceInvite.deleteOne({ _id: inviteInfo._id }),
      recordActivity(user, "joined_workspace", "Workspace", workspaceId, {
        description: `Joined ${workspace.name} workspace`,
      }),
    ]);

    return res.status(200).json({
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
export {
  createWorkspace,
  getWorkspaces,
  getWorkspaceDetails,
  getWorkspaceProjects,
  getWorkspaceStats,
  inviteUserToWorkspace,
  acceptGenerateInvite,
  acceptInviteByToken,
};
