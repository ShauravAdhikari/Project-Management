import { BackButton } from "@/components/back-button";
import { Loader } from "@/components/loader";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UseProjectQuery } from "@/hooks/use-project";
import { useDeleteProjectMutation } from "@/hooks/use-project";
import { getProjectProgress } from "@/lib";
import { cn } from "@/lib/utils";
import { useAuth } from "@/provider/auth-context";
import type { Project, Task, TaskStatus } from "@/types";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Trash2,
  Clock3,
  ListTodo,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

const STATUS_ORDER: TaskStatus[] = ["To Do", "In Progress", "Done"];

const statusPillStyles: Record<TaskStatus, string> = {
  "To Do":
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200",
  "In Progress":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/80 dark:bg-amber-950/50 dark:text-amber-300",
  Done:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/50 dark:text-emerald-300",
};

const priorityBadgeStyles: Record<string, string> = {
  High: "bg-red-500 text-white hover:bg-red-500",
  Medium: "bg-orange-500 text-white hover:bg-orange-500",
  Low: "bg-slate-600 text-white hover:bg-slate-600",
};

const ProjectDetails = () => {
  const { projectId, workspaceId } = useParams<{
    projectId: string;
    workspaceId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreateTask, setIsCreateTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskStatus | "All">("All");
  const { mutate: deleteProject, isPending: isDeletingProject } =
    useDeleteProjectMutation();

  const { data, isLoading } = UseProjectQuery(projectId!) as {
    data: {
      tasks: Task[];
      project: Project;
    };
    isLoading: boolean;
  };

  const project = data?.project;
  const tasks = data?.tasks ?? [];
  const projectProgress = getProjectProgress(tasks);

  const statusCounts = useMemo(
    () => ({
      "To Do": tasks.filter((task) => task.status === "To Do").length,
      "In Progress": tasks.filter((task) => task.status === "In Progress").length,
      Done: tasks.filter((task) => task.status === "Done").length,
    }),
    [tasks]
  );

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.dueDate &&
          task.status !== "Done" &&
          new Date(task.dueDate).getTime() < Date.now()
      ).length,
    [tasks]
  );

  const totalMembers = project?.members?.length ?? 0;
  const canDeleteProject = useMemo(() => {
    if (!user || !project) {
      return false;
    }

    const createdById =
      typeof project.createdBy === "string"
        ? project.createdBy
        : project.createdBy?._id;

    if (createdById === user._id) {
      return true;
    }

    return (
      project.members?.some((member) => {
        const memberUserId =
          typeof member.user === "string" ? member.user : member.user?._id;

        return memberUserId === user._id && member.role === "manager";
      }) ?? false
    );
  }, [project, user]);

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  const handleTaskClick = (taskId: string) => {
    navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
  };

  const handleDeleteProject = () => {
    if (!workspaceId || !projectId) {
      toast.error("Unable to delete this project right now");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${project.title}"? This will permanently remove the project and all of its tasks.`
    );

    if (!confirmed) {
      return;
    }

    deleteProject(
      {
        projectId,
        workspaceId,
      },
      {
        onSuccess: () => {
          toast.success("Project deleted successfully");
          navigate(`/workspaces/${workspaceId}`);
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to delete project";
          toast.error(errorMessage);
        },
      }
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <BackButton />

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    {project.title}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      project.status === "Completed"
                        ? statusPillStyles.Done
                        : project.status === "In Progress"
                        ? statusPillStyles["In Progress"]
                        : statusPillStyles["To Do"]
                    )}
                  >
                    {project.status}
                  </Badge>
                </div>

                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {project.description ||
                    "This project is ready for task planning. Add tasks, assign owners, and track progress from one place."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {STATUS_ORDER.map((status) => (
                  <Badge
                    key={status}
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      statusPillStyles[status]
                    )}
                  >
                    {statusCounts[status]} {status}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex w-full flex-col gap-4 xl:max-w-sm">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    Project Progress
                  </span>
                  <span className="text-muted-foreground">{projectProgress}%</span>
                </div>
                <Progress value={projectProgress} className="h-2.5" />

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <StatTile
                    label="Tasks"
                    value={tasks.length}
                    icon={<ListTodo className="size-4" />}
                  />
                  <StatTile
                    label="Members"
                    value={totalMembers}
                    icon={<CheckCircle2 className="size-4" />}
                  />
                  <StatTile
                    label="Overdue"
                    value={overdueTasks}
                    icon={<Clock3 className="size-4" />}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {canDeleteProject && (
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/40"
                    onClick={handleDeleteProject}
                    disabled={isDeletingProject}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {isDeletingProject ? "Deleting..." : "Delete Project"}
                  </Button>
                )}

                <Button
                  className="h-11 rounded-xl px-5"
                  onClick={() => setIsCreateTask(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Task
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1 md:w-auto md:grid-cols-4">
                <TabsTrigger value="all" onClick={() => setTaskFilter("All")}>
                  All Tasks
                </TabsTrigger>
                <TabsTrigger value="todo" onClick={() => setTaskFilter("To Do")}>
                  To Do
                </TabsTrigger>
                <TabsTrigger
                  value="in-progress"
                  onClick={() => setTaskFilter("In Progress")}
                >
                  In Progress
                </TabsTrigger>
                <TabsTrigger value="done" onClick={() => setTaskFilter("Done")}>
                  Done
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Board Summary</span>
                <span className="hidden text-muted-foreground/60 md:inline">•</span>
                <span>
                  Viewing:{" "}
                  <span className="font-medium text-foreground">{taskFilter}</span>
                </span>
              </div>
            </div>

            <TabsContent value="all" className="m-0">
              <div className="grid gap-5 xl:grid-cols-3">
                {STATUS_ORDER.map((status) => (
                  <TaskColumn
                    key={status}
                    title={status}
                    tasks={tasks.filter((task) => task.status === status)}
                    onTaskClick={handleTaskClick}
                    onAddTask={() => setIsCreateTask(true)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="todo" className="m-0">
              <TaskColumn
                title="To Do"
                tasks={tasks.filter((task) => task.status === "To Do")}
                onTaskClick={handleTaskClick}
                onAddTask={() => setIsCreateTask(true)}
                isFullWidth
              />
            </TabsContent>

            <TabsContent value="in-progress" className="m-0">
              <TaskColumn
                title="In Progress"
                tasks={tasks.filter((task) => task.status === "In Progress")}
                onTaskClick={handleTaskClick}
                onAddTask={() => setIsCreateTask(true)}
                isFullWidth
              />
            </TabsContent>

            <TabsContent value="done" className="m-0">
              <TaskColumn
                title="Done"
                tasks={tasks.filter((task) => task.status === "Done")}
                onTaskClick={handleTaskClick}
                onAddTask={() => setIsCreateTask(true)}
                isFullWidth
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <CreateTaskDialog
        open={isCreateTask}
        onOpenChange={setIsCreateTask}
        projectId={projectId!}
        projectMembers={project.members as any}
      />
    </div>
  );
};

export default ProjectDetails;

const StatTile = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) => {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-3">
      <div className="mb-2 flex items-center justify-between text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
};

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onAddTask: () => void;
  isFullWidth?: boolean;
}

const TaskColumn = ({
  title,
  tasks,
  onTaskClick,
  onAddTask,
  isFullWidth = false,
}: TaskColumnProps) => {
  return (
    <Card className="border-border/70 bg-background/80 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length === 0
              ? "No tasks in this stage yet"
              : `${tasks.length} task${tasks.length > 1 ? "s" : ""} in this stage`}
          </p>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          {tasks.length}
        </Badge>
      </CardHeader>

      <CardContent className="p-4">
        {tasks.length === 0 ? (
          <button
            type="button"
            onClick={onAddTask}
            className="flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 text-center text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
          >
            <Plus className="mb-3 size-5" />
            <span className="font-medium">Add a task</span>
            <span className="mt-1 text-xs text-muted-foreground">
              Click here to create the first task in this project.
            </span>
          </button>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              isFullWidth ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
            )}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick(task._id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TaskCard = ({ task, onClick }: { task: Task; onClick: () => void }) => {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue =
    dueDate !== null &&
    task.status !== "Done" &&
    dueDate.getTime() < Date.now();

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <Badge
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              priorityBadgeStyles[task.priority] ?? priorityBadgeStyles.Low
            )}
          >
            {task.priority}
          </Badge>

          <div
            className="flex items-center gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            {task.status !== "To Do" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full"
                title="Mark as To Do"
              >
                <AlertCircle className="size-4" />
                <span className="sr-only">Mark as To Do</span>
              </Button>
            )}
            {task.status !== "In Progress" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full"
                title="Mark as In Progress"
              >
                <Clock3 className="size-4" />
                <span className="sr-only">Mark as In Progress</span>
              </Button>
            )}
            {task.status !== "Done" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full"
                title="Mark as Done"
              >
                <CheckCircle2 className="size-4" />
                <span className="sr-only">Mark as Done</span>
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold leading-6">{task.title}</h3>
          {task.description && (
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex -space-x-2">
                {task.assignees.slice(0, 4).map((member) => (
                  <Avatar
                    key={member._id}
                    className="size-8 border-2 border-background shadow-sm"
                    title={member.name}
                  >
                    <AvatarImage src={member.profilePicture} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 4 && (
                  <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground shadow-sm">
                    +{task.assignees.length - 4}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Unassigned</span>
            )}
          </div>

          {dueDate && (
            <div
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                isOverdue
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300"
                  : "border-border bg-muted/40 text-muted-foreground"
              )}
            >
              <Calendar className="mr-1.5 size-3.5" />
              {format(dueDate, "MMM d, yyyy")}
            </div>
          )}
        </div>

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {task.subtasks.filter((subtask) => subtask.completed).length} /{" "}
            {task.subtasks.length} subtasks completed
          </div>
        )}
      </CardContent>
    </Card>
  );
};
