import { Loader } from "@/components/loader";
import { CreateProjectDialog } from "@/components/project/create-project";
import { InviteMemberDialog } from "@/components/workspace/invite-member";
import { ProjectList } from "@/components/workspace/project-list";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import {
  useDeleteWorkspaceMutation,
  useGetWorkspaceQuery,
} from "@/hooks/use-workspace";
import { useAuth } from "@/provider/auth-context";
import type { Project, Workspace } from "@/types";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";

const WorkspaceDetails = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreateProject, setIsCreateProject] = useState(false);
  const [isInviteMember, setIsInviteMember] = useState(false);
  const { mutate: deleteWorkspace, isPending: isDeletingWorkspace } =
    useDeleteWorkspaceMutation();

  if (!workspaceId) {
    return <div>No workspace found</div>;
  }

  const { data, isLoading } = useGetWorkspaceQuery(workspaceId) as {
    data: {
      workspace: Workspace;
      projects: Project[];
    };
    isLoading: boolean;
  };

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  const ownerId =
    typeof data.workspace.owner === "string"
      ? data.workspace.owner
      : data.workspace.owner?._id;
  const canDeleteWorkspace = ownerId === user?._id;

  const handleDeleteWorkspace = () => {
    if (!workspaceId) {
      toast.error("Unable to delete this workspace right now");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${data.workspace.name}"? This will permanently remove the workspace, its projects, and all related tasks.`
    );

    if (!confirmed) {
      return;
    }

    deleteWorkspace(workspaceId, {
      onSuccess: () => {
        toast.success("Workspace deleted successfully");
        navigate("/workspaces");
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to delete workspace";
        toast.error(errorMessage);
      },
    });
  };

  return (
    <div className="space-y-8">
      <WorkspaceHeader
        workspace={data.workspace}
        members={data?.workspace?.members as any}
        onCreateProject={() => setIsCreateProject(true)}
        onInviteMember={() => setIsInviteMember(true)}
        onDeleteWorkspace={handleDeleteWorkspace}
        canDeleteWorkspace={canDeleteWorkspace}
        isDeletingWorkspace={isDeletingWorkspace}
      />

      <ProjectList
        workspaceId={workspaceId}
        projects={data.projects}
        onCreateProject={() => setIsCreateProject(true)}
      />

      <CreateProjectDialog
        isOpen={isCreateProject}
        onOpenChange={setIsCreateProject}
        workspaceId={workspaceId}
        workspaceMembers={data.workspace.members as any}
      />

      <InviteMemberDialog
        isOpen={isInviteMember}
        onOpenChange={setIsInviteMember}
        workspaceId={workspaceId}
      />
    </div>
  );
};

export default WorkspaceDetails;
