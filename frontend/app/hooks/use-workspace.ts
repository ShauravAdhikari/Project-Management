import type { WorkspaceForm } from "@/components/workspace/create-workspace";
import { fetchData, postData } from "@/lib/fetch-util";
import type { Workspace } from "@/types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const WORKSPACES_STALE_TIME = 60 * 1000;
const WORKSPACE_DATA_STALE_TIME = 15 * 1000;

export const workspaceQueryKeys = {
  all: ["workspace"] as const,
  list: ["workspaces"] as const,
  projects: (workspaceId?: string | null) => ["workspace", workspaceId] as const,
  stats: (workspaceId?: string | null) =>
    ["workspace", workspaceId, "stats"] as const,
  details: (workspaceId?: string | null) =>
    ["workspace", workspaceId, "details"] as const,
};

export const getWorkspacesQueryOptions = () => ({
  queryKey: workspaceQueryKeys.list,
  queryFn: async () => fetchData<Workspace[]>("/workspaces"),
  staleTime: WORKSPACES_STALE_TIME,
});

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WorkspaceForm) => postData("/workspaces", data),
    onSuccess: (workspace: any) => {
      queryClient.setQueryData<Workspace[]>(
        workspaceQueryKeys.list,
        (current = []) => [
          workspace,
          ...current.filter((item) => item._id !== workspace._id),
        ]
      );
    },
  });
};

export const useGetWorkspacesQuery = () => {
  return useQuery(getWorkspacesQueryOptions());
};

export const useGetWorkspaceQuery = (workspaceId?: string | null) => {
  return useQuery({
    queryKey: workspaceQueryKeys.projects(workspaceId),
    queryFn: async () => fetchData(`/workspaces/${workspaceId}/projects`),
    enabled: Boolean(workspaceId),
    staleTime: WORKSPACE_DATA_STALE_TIME,
    placeholderData: keepPreviousData,
  });
};

export const useGetWorkspaceStatsQuery = (workspaceId?: string | null) => {
  return useQuery({
    queryKey: workspaceQueryKeys.stats(workspaceId),
    queryFn: async () => fetchData(`/workspaces/${workspaceId}/stats`),
    enabled: Boolean(workspaceId),
    staleTime: WORKSPACE_DATA_STALE_TIME,
    placeholderData: keepPreviousData,
  });
};

export const useGetWorkspaceDetailsQuery = (workspaceId?: string | null) => {
  return useQuery({
    queryKey: workspaceQueryKeys.details(workspaceId),
    queryFn: async () => fetchData(`/workspaces/${workspaceId}`),
    enabled: Boolean(workspaceId),
    staleTime: WORKSPACE_DATA_STALE_TIME,
    placeholderData: keepPreviousData,
  });
};

export const useInviteMemberMutation = () => {
  return useMutation({
    mutationFn: (data: { email: string; role: string; workspaceId: string }) =>
      postData(`/workspaces/${data.workspaceId}/invite-member`, data),
  });
};

export const useAcceptInviteByTokenMutation = () => {
  return useMutation({
    mutationFn: (token: string) =>
      postData(`/workspaces/accept-invite-token`, {
        token,
      }),
  });
};

export const useAcceptGenerateInviteMutation = () => {
  return useMutation({
    mutationFn: (workspaceId: string) =>
      postData(`/workspaces/${workspaceId}/accept-generate-invite`, {}),
  });
};
