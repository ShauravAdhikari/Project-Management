import { cn } from "@/lib/utils";
import { useAuth } from "@/provider/auth-context";
import type { AiChatMessage, Workspace } from "@/types";
import { useAiAssistantMutation } from "@/hooks/use-ai";
import { LoaderCircle, MessageSquare, SendHorizonal, Sparkles, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";

const createMessage = (
  role: AiChatMessage["role"],
  content: string,
  isError = false
): AiChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  isError,
});

const starterSuggestions = [
  "Help me understand this page.",
  "Suggest a plan for my current workspace.",
  "Turn a project idea into clear next tasks.",
];

export const AssistantChat = ({
  currentWorkspace,
}: {
  currentWorkspace: Workspace | null;
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([
    createMessage(
      "assistant",
      user?.name
        ? `Hi ${user.name}, I'm your Yutani Foundation assistant. Ask me for help with this page, planning tasks, or organizing project work.`
        : "Hi, I'm your Yutani Foundation assistant. Ask me for help with this page, planning tasks, or organizing project work."
    ),
  ]);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const { mutateAsync, isPending } = useAiAssistantMutation();

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = async (messageText?: string) => {
    const trimmedMessage = (messageText ?? input).trim();

    if (!trimmedMessage || isPending) {
      return;
    }

    const nextUserMessage = createMessage("user", trimmedMessage);
    const requestMessages = [...messages, nextUserMessage]
      .filter((message) => !message.isError)
      .map(({ role, content }) => ({ role, content }));

    setMessages((currentMessages) => [...currentMessages, nextUserMessage]);
    setInput("");
    setIsOpen(true);

    try {
      const response = await mutateAsync({
        messages: requestMessages,
        context: {
          currentPath: `${location.pathname}${location.search}`,
          workspaceName: currentWorkspace?.name,
          pageTitle:
            typeof document !== "undefined" ? document.title : undefined,
        },
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage("assistant", response.reply),
      ]);
    } catch (error: any) {
      const fallbackMessage =
        error?.response?.data?.message ||
        "The assistant is unavailable right now. Please try again in a moment.";

      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage("assistant", fallbackMessage, true),
      ]);
    }
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await sendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[380px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-3xl border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/12">
                <Sparkles className="size-5" />
              </div>

              <div>
                <p className="text-sm font-semibold">Yutani AI Assistant</p>
                <p className="text-xs text-white/70">
                  Help with navigation, planning, and task drafting
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          <ScrollArea className="h-[360px]">
            <div className="space-y-4 px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : message.isError
                        ? "border border-destructive/30 bg-destructive/10 text-destructive"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2">
                  {starterSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="rounded-full border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition hover:border-blue-300 hover:text-foreground"
                      onClick={() => sendMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div ref={endOfMessagesRef} />
            </div>
          </ScrollArea>

          <div className="border-t bg-card px-4 py-4">
            <div className="mb-3 rounded-2xl border bg-muted/60 p-3 text-xs text-muted-foreground">
              Context:
              <span className="ml-1 font-medium text-foreground">
                {currentWorkspace?.name || "No workspace selected"}
              </span>
              <span className="mx-2 text-muted-foreground/60">|</span>
              <span>{location.pathname}</span>
            </div>

            <div className="space-y-3">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for help with this page, task planning, or project ideas..."
                className="min-h-24 resize-none"
              />

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  AI can help draft and explain, but it does not change your data.
                </p>

                <Button
                  type="button"
                  className="shrink-0"
                  onClick={() => sendMessage()}
                  disabled={isPending || !input.trim()}
                >
                  {isPending ? (
                    <>
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      Thinking
                    </>
                  ) : (
                    <>
                      <SendHorizonal className="mr-2 size-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="rounded-full px-5 shadow-lg"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <MessageSquare className="mr-2 size-4" />
        {isOpen ? "Close Assistant" : "Ask AI"}
      </Button>
    </div>
  );
};
