import type { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getProjectProgress, getTaskStatusColor } from "@/lib";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { Progress } from "../ui/progress";

export const RecentProjects = ({
  data,
  workspaceId,
}: {
  data: Project[];
  workspaceId?: string | null;
}) => {
  return (
    <Card className="lg:col-spa-2">
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No Recent project yet
          </p>
        ) : (
          data.map((project) => {
            const projectProgress = getProjectProgress(project.tasks);
            const projectWorkspaceId =
              workspaceId ||
              (typeof project.workspace === "string"
                ? project.workspace
                : project.workspace?._id);

            return (
              <div key={project._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Link
                    to={
                      projectWorkspaceId
                        ? `/workspaces/${projectWorkspaceId}/projects/${project._id}`
                        : "/workspaces"
                    }
                  >
                    <h3 className="font-medium hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                  </Link>

                  <span
                    className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      getTaskStatusColor(project.status)
                    )}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {project.description}
                </p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Progress</span>
                    <span>{projectProgress}%</span>
                  </div>

                  <Progress value={projectProgress} className="h-2" />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
