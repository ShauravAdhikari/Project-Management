import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetMyTasksQuery } from "@/hooks/use-task";
import type { Task } from "@/types";
import { format } from "date-fns";
import { Archive, ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router";

const Achieved = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetMyTasksQuery() as {
    data?: Task[];
    isLoading: boolean;
  };

  const archivedTasks = (data ?? [])
    .filter((task) => task.isArchived)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (archivedTasks.length === 0) {
    return (
      <NoDataFound
        title="No archived tasks yet"
        description="Archive completed or paused tasks to keep them here for quick reference."
        buttonText="Open My Tasks"
        buttonAction={() => navigate("/my-tasks")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Archived Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Review tasks you have archived across your workspaces.
          </p>
        </div>

        <Badge variant="outline" className="px-3 py-1">
          {archivedTasks.length} archived
        </Badge>
      </div>

      <div className="grid gap-4">
        {archivedTasks.map((task) => {
          const projectId =
            typeof task.project === "string" ? task.project : task.project?._id;
          const workspaceId =
            typeof task.project === "string"
              ? undefined
              : typeof task.project.workspace === "string"
                ? task.project.workspace
                : task.project.workspace?._id;

          return (
            <Card key={task._id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription>
                      {task.description || "No description available"}
                    </CardDescription>
                  </div>

                  <Badge variant="secondary" className="shrink-0">
                    <Archive className="mr-1 size-3" />
                    Archived
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{task.status}</Badge>
                  <Badge
                    variant={
                      task.priority === "High" ? "destructive" : "secondary"
                    }
                  >
                    {task.priority}
                  </Badge>
                  <span>
                    Updated{" "}
                    {task.updatedAt
                      ? format(new Date(task.updatedAt), "MMM d, yyyy")
                      : "recently"}
                  </span>
                </div>

                <Link
                  to={
                    workspaceId && projectId
                      ? `/workspaces/${workspaceId}/projects/${projectId}/tasks/${task._id}`
                      : "/my-tasks"
                  }
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
                >
                  Open Task
                  <ArrowUpRight className="ml-1 size-4" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Achieved;
