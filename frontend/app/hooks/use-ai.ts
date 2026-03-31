import { postData } from "@/lib/fetch-util";
import type { AiChatRequest, AiChatResponse } from "@/types";
import { useMutation } from "@tanstack/react-query";

export const useAiAssistantMutation = () => {
  return useMutation({
    mutationFn: (data: AiChatRequest) =>
      postData<AiChatResponse>("/ai/chat", data),
  });
};
