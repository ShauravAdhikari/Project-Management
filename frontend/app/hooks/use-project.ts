import type { CreateProjectFormData } from "@/components/project/create-project";
import { fetchData, postData } from "@/lib/fetch-util";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceQueryKeys } from "./use-workspace";

export const UseCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      projectData: CreateProjectFormData;
      workspaceId: string;
    }) =>
      postData(
        `/projects/${data.workspaceId}/create-project`,
        data.projectData
      ),
    onSuccess: async (data: any, variables) => {
      const workspaceId = variables.workspaceId;

      queryClient.setQueryData(
        workspaceQueryKeys.projects(workspaceId),
        (currentData: any) => {
          if (!currentData) {
            return currentData;
          }

          return {
            ...currentData,
            projects: [
              data,
              ...(currentData.projects ?? []).filter(
                (project: any) => project._id !== data._id
              ),
            ],
          };
        }
      );
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.projects(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.stats(workspaceId),
      });
    },
  });
};

export const UseProjectQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchData(`/projects/${projectId}/tasks`),
  });
};
