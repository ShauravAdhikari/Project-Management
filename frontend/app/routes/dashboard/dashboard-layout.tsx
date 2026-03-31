import { AssistantChat } from "@/components/ai/assistant-chat";
import { Header } from "@/components/layout/header";
import { SidebarComponent } from "@/components/layout/sidebar-component";
import { Loader } from "@/components/loader";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import {
  getWorkspacesQueryOptions,
  workspaceQueryKeys,
} from "@/hooks/use-workspace";
import { useAuth } from "@/provider/auth-context";
import { queryClient } from "@/provider/react-query-provider";
import type { DashboardOutletContext, Workspace } from "@/types";
import { useState } from "react";
import {
  Navigate,
  Outlet,
  useLoaderData,
  useParams,
  useSearchParams,
} from "react-router";

export const clientLoader = async () => {
  try {
    const workspaces = await queryClient.ensureQueryData(
      getWorkspacesQueryOptions()
    );
    return { workspaces };
  } catch (error) {
    console.log(error);
    queryClient.setQueryData(workspaceQueryKeys.list, []);
    return { workspaces: [] };
  }
};
const DashboardLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { workspaceId: routeWorkspaceId } = useParams();
  const [searchParams] = useSearchParams();
  const { workspaces = [] } = useLoaderData() as {
    workspaces?: Workspace[];
  };
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const queryWorkspaceId = searchParams.get("workspaceId");
  const activeWorkspaceId = queryWorkspaceId ?? routeWorkspaceId ?? null;
  const currentWorkspace =
    workspaces.find((workspace) => workspace._id === activeWorkspaceId) ??
    workspaces[0] ??
    null;

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />;
  }

  const handleWorkspaceSelected = () => undefined;
  const outletContext: DashboardOutletContext = {
    currentWorkspace,
    workspaces,
  };

  return (
    <div className="flex h-screen w-full">
      <SidebarComponent currentWorkspace={currentWorkspace} />

      <div className="flex flex-1 flex-col h-full">
        <Header
          onWorkspaceSelected={handleWorkspaceSelected}
          selectedWorkspace={currentWorkspace}
          onCreateWorkspace={() => setIsCreatingWorkspace(true)}
        />

        <main className="flex-1 overflow-y-auto h-full w-full">
          <div className="mx-auto container px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full h-full">
            <Outlet context={outletContext} />
          </div>
        </main>
      </div>

      <CreateWorkspace
        isCreatingWorkspace={isCreatingWorkspace}
        setIsCreatingWorkspace={setIsCreatingWorkspace}
      />
      <AssistantChat currentWorkspace={currentWorkspace} />
    </div>
  );
};

export default DashboardLayout;
