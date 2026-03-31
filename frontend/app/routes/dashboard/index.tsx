import { RecentProjects } from "@/components/dashboard/recnt-projects";
import { StatsCard } from "@/components/dashboard/stat-card";
import { StatisticsCharts } from "@/components/dashboard/statistics-charts";
import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";
import { UpcomingTasks } from "@/components/upcoming-tasks";
import { useGetWorkspaceStatsQuery } from "@/hooks/use-workspace";
import type {
  DashboardOutletContext,
  Project,
  ProjectStatusData,
  StatsCardProps,
  Task,
  TaskPriorityData,
  TaskTrendsData,
  WorkspaceProductivityData,
} from "@/types";
import { useNavigate, useOutletContext, useSearchParams } from "react-router";

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useOutletContext<DashboardOutletContext>();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") ?? currentWorkspace?._id;

  const { data, isPending } = useGetWorkspaceStatsQuery(workspaceId) as {
    data: {
      stats: StatsCardProps;
      taskTrendsData: TaskTrendsData[];
      projectStatusData: ProjectStatusData[];
      taskPriorityData: TaskPriorityData[];
      workspaceProductivityData: WorkspaceProductivityData[];
      upcomingTasks: Task[];
      recentProjects: Project[];
    };
    isPending: boolean;
  };

  if (!workspaceId) {
    return (
      <NoDataFound
        title="Select a workspace"
        description="Choose a workspace to load your dashboard data."
        buttonText="View Workspaces"
        buttonAction={() => navigate("/workspaces")}
      />
    );
  }

  if (isPending) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (!data) {
    return (
      <NoDataFound
        title="Dashboard unavailable"
        description="We couldn't load workspace stats yet. Try refreshing or selecting the workspace again."
        buttonText="Open Workspaces"
        buttonAction={() => navigate("/workspaces")}
      />
    );
  }

  return (
    <div className="space-y-8 2xl:space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <StatsCard data={data.stats} />

      <StatisticsCharts
        stats={data.stats}
        taskTrendsData={data.taskTrendsData}
        projectStatusData={data.projectStatusData}
        taskPriorityData={data.taskPriorityData}
        workspaceProductivityData={data.workspaceProductivityData}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentProjects data={data.recentProjects} workspaceId={workspaceId} />
        <UpcomingTasks data={data.upcomingTasks} workspaceId={workspaceId} />
      </div>
    </div>
  );
};

export default Dashboard;
