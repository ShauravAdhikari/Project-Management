import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
import Comment from "../models/comment.js";
import ActivityLog from "../models/activity.js";

const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, status, startDate, dueDate, tags, members } =
      req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this workspace",
      });
    }

    const workspaceMemberIds = new Set(
      workspace.members.map((member) => member.user.toString())
    );

    const normalizedMembers = Array.isArray(members)
      ? members.reduce((acc, member) => {
          const memberId = member.user.toString();

          if (!workspaceMemberIds.has(memberId)) {
            return acc;
          }

          if (acc.some((existingMember) => existingMember.user === memberId)) {
            return acc;
          }

          acc.push({
            user: memberId,
            role: member.role,
          });

          return acc;
        }, [])
      : [];

    const creatorId = req.user._id.toString();

    if (
      !normalizedMembers.some((member) => member.user.toString() === creatorId)
    ) {
      normalizedMembers.unshift({
        user: creatorId,
        role: "manager",
      });
    }

    const tagArray =
      typeof tags === "string"
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

    const newProject = await Project.create({
      title,
      description,
      status,
      startDate,
      dueDate,
      tags: tagArray,
      workspace: workspaceId,
      members: normalizedMembers,
      createdBy: req.user._id,
    });

    workspace.projects.push(newProject._id);
    await workspace.save();

    return res.status(201).json(newProject);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate("members.user");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const tasks = await Task.find({
      project: projectId,
      isArchived: false,
    })
      .populate("assignees", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      project,
      tasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const currentUserId = req.user._id.toString();
    const currentMember = project.members.find(
      (member) => member.user.toString() === currentUserId
    );

    if (!currentMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const canDeleteProject =
      project.createdBy.toString() === currentUserId ||
      currentMember.role === "manager";

    if (!canDeleteProject) {
      return res.status(403).json({
        message: "Only project managers can delete this project",
      });
    }

    const projectTasks = await Task.find({ project: projectId }).select(
      "_id comments"
    );
    const taskIds = projectTasks.map((task) => task._id);
    const commentIds = projectTasks.flatMap((task) => task.comments || []);

    if (commentIds.length > 0) {
      await Comment.deleteMany({
        _id: { $in: commentIds },
      });
    }

    if (taskIds.length > 0) {
      await Task.deleteMany({
        _id: { $in: taskIds },
      });

      await ActivityLog.deleteMany({
        resourceType: "Task",
        resourceId: { $in: taskIds },
      });
    }

    await ActivityLog.deleteMany({
      resourceType: "Project",
      resourceId: project._id,
    });

    await Workspace.findByIdAndUpdate(project.workspace, {
      $pull: { projects: project._id },
    });

    await Project.findByIdAndDelete(projectId);

    return res.status(200).json({
      message: "Project deleted successfully",
      deletedProjectId: projectId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export { createProject, getProjectDetails, getProjectTasks, deleteProject };
