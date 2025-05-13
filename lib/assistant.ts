import { parse } from "partial-json";
import { handleTool } from "@/lib/tools/tools-handling";
import useConversationStore from "@/stores/useConversationStore";
import { getTools } from "./tools/tools";
import { Annotation } from "@/components/annotations";
import { functionsMap } from "@/config/functions";

export interface ContentItem {
  type: "input_text" | "output_text" | "refusal" | "output_audio";
  annotations?: Annotation[];
  text?: string;
  followUpQuestions?: string[];
}

// Message items for storing conversation history matching API shape
export interface MessageItem {
  type: "message";
  role: "user" | "assistant" | "system";
  id?: string;
  content: ContentItem[];
}

// Custom items to display in chat
export interface ToolCallItem {
  type: "tool_call";
  tool_type: "file_search_call" | "web_search_call" | "function_call";
  status: "in_progress" | "completed" | "failed" | "searching";
  id: string;
  name?: string | null;
  call_id?: string;
  arguments?: string;
  parsedArguments?: any;
  output?: string | null;
}

export type Item = MessageItem | ToolCallItem;

export const handleTurn = async (
  messages: any[],
  tools: any[],
  onMessage: (data: any) => void
) => {
  try {
    // Get response from the API (defined in app/api/turn_response/route.ts)
    const response = await fetch("/api/turn_response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages,
        tools: tools,
      }),
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return;
    }

    // Reader for streaming data
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      buffer += chunkValue;

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6);
          if (dataStr === "[DONE]") {
            done = true;
            break;
          }
          const data = JSON.parse(dataStr);
          onMessage(data);
        }
      }
    }

    // Handle any remaining data in buffer
    if (buffer && buffer.startsWith("data: ")) {
      const dataStr = buffer.slice(6);
      if (dataStr !== "[DONE]") {
        const data = JSON.parse(dataStr);
        onMessage(data);
      }
    }
  } catch (error) {
    console.error("Error handling turn:", error);
  }
};

export const processMessages = async () => {
  const {
    chatMessages,
    conversationItems,
    setChatMessages,
    setConversationItems,
    developerPrompt,
    setIsWaitingForReply,
  } = useConversationStore.getState();

  const tools = getTools();
  const allConversationItems = [
    // Adding developer prompt as first item in the conversation
    {
      role: "developer",
      content: developerPrompt,
    },
    ...conversationItems,
  ];

  let assistantMessageContent = "";
  let functionArguments = "";

  // Set waiting state to true before handling the turn
  setIsWaitingForReply(true);
  let hasReceivedInitialResponse = false;

  try {
    await handleTurn(allConversationItems, tools, async ({ event, data }) => {
      // Set waiting state to false on first relevant event
      if (!hasReceivedInitialResponse &&
          (event.startsWith("response.output_text") || 
           event === "response.output_item.added" || 
           event.startsWith("response.function_call"))) {
        useConversationStore.getState().setIsWaitingForReply(false); // Use latest state
        hasReceivedInitialResponse = true;
      }

      switch (event) {
        case "response.output_text.delta":
        case "response.output_text.annotation.added": {
          const { delta, item_id, annotation } = data;

          let partial = "";
          if (typeof delta === "string") {
            partial = delta;
          }
          assistantMessageContent += partial;

          let displayText = assistantMessageContent;
          const followUpMarker = "Follow-up questions: ";
          const markerIndex = assistantMessageContent.lastIndexOf(followUpMarker);

          if (markerIndex !== -1) {
            displayText = assistantMessageContent.substring(0, markerIndex).trim();
          }

          const lastItem = chatMessages[chatMessages.length - 1];
          if (
            !lastItem ||
            lastItem.type !== "message" ||
            lastItem.role !== "assistant" ||
            (lastItem.id && lastItem.id !== item_id)
          ) {
            chatMessages.push({
              type: "message",
              role: "assistant",
              id: item_id,
              content: [
                {
                  type: "output_text",
                  text: displayText,
                  followUpQuestions: [],
                },
              ],
            } as MessageItem);
          } else {
            const contentItem = lastItem.content[0];
            if (contentItem && contentItem.type === "output_text") {
              contentItem.text = displayText;
              if (annotation) {
                contentItem.annotations = [
                  ...(contentItem.annotations ?? []),
                  annotation,
                ];
              }
            }
          }
          setChatMessages([...chatMessages]);
          break;
        }

        case "response.output_item.added": {
          const { item } = data || {};
          if (!item || !item.type) {
            break;
          }
          switch (item.type) {
            case "message": {
              const text = item.content?.text || "";
              chatMessages.push({
                type: "message",
                role: "assistant",
                id: item.id,
                content: [
                  {
                    type: "output_text",
                    text: text,
                    followUpQuestions: [],
                  },
                ],
              } as MessageItem);
              setChatMessages([...chatMessages]);
              break;
            }
            case "function_call": {
              functionArguments += item.arguments || "";
              chatMessages.push({
                type: "tool_call",
                tool_type: "function_call",
                status: "in_progress",
                id: item.id,
                name: item.name,
                arguments: item.arguments || "",
                parsedArguments: {},
                output: null,
              });
              setChatMessages([...chatMessages]);
              break;
            }
            case "web_search_call": {
              chatMessages.push({
                type: "tool_call",
                tool_type: "web_search_call",
                status: item.status || "in_progress",
                id: item.id,
              });
              setChatMessages([...chatMessages]);
              break;
            }
            case "file_search_call": {
              chatMessages.push({
                type: "tool_call",
                tool_type: "file_search_call",
                status: item.status || "in_progress",
                id: item.id,
              });
              setChatMessages([...chatMessages]);
              break;
            }
          }
          break;
        }

        case "response.output_item.done": {
          const { item } = data || {};
          if (!item || !item.id) break;

          const chatMessageIndex = chatMessages.findIndex((m) => m.id === item.id);
          let finalChatMessage: MessageItem | ToolCallItem | undefined = chatMessageIndex !== -1 ? chatMessages[chatMessageIndex] : undefined;

          if (item.type === "message" && item.role === "assistant" && item.content && item.content[0].type === "output_text") {
            let textContent = item.content[0].text || "";
            const followUpMarker = "Follow-up questions: ";
            let parsedQuestions: string[] = [];
            let textWithoutFollowUps = textContent;

            const markerIndex = textContent.lastIndexOf(followUpMarker);

            if (markerIndex !== -1) {
              const potentialJsonSection = textContent.substring(markerIndex + followUpMarker.length);
              const arrayStartIndex = potentialJsonSection.indexOf('[');
              const arrayEndIndex = potentialJsonSection.lastIndexOf(']');

              if (arrayStartIndex !== -1 && arrayEndIndex > arrayStartIndex) {
                const actualJsonArrayString = potentialJsonSection.substring(arrayStartIndex, arrayEndIndex + 1);
                try {
                  const questions = JSON.parse(actualJsonArrayString);
                  if (Array.isArray(questions) && questions.every(q => typeof q === 'string')) {
                    textWithoutFollowUps = textContent.substring(0, markerIndex).trim();
                    parsedQuestions = questions;
                  }
                } catch (e) {
                  console.warn("Failed to parse JSON for follow-up questions:", e, "String was:", actualJsonArrayString);
                }
              }
            }
            
            item.content[0].text = textWithoutFollowUps;
            item.content[0].followUpQuestions = parsedQuestions;

            if (finalChatMessage && finalChatMessage.type === "message" && finalChatMessage.role === "assistant") {
              finalChatMessage.content[0].text = textWithoutFollowUps;
              finalChatMessage.content[0].followUpQuestions = parsedQuestions;
              if (chatMessageIndex !== -1) chatMessages[chatMessageIndex] = finalChatMessage;
            }
          } else if (item.type === "tool_call" && finalChatMessage && finalChatMessage.type === "tool_call") {
            finalChatMessage.call_id = item.call_id;
            chatMessages[chatMessageIndex] = finalChatMessage;
          }
          
          setChatMessages([...chatMessages]);
          
          conversationItems.push(item);
          setConversationItems([...conversationItems]);

          if (
            finalChatMessage &&
            finalChatMessage.type === "tool_call" &&
            finalChatMessage.tool_type === "function_call"
          ) {
            const toolResult = await handleTool(
              finalChatMessage.name as keyof typeof functionsMap,
              finalChatMessage.parsedArguments
            );

            finalChatMessage.output = JSON.stringify(toolResult);
            setChatMessages([...chatMessages]);
            conversationItems.push({
              type: "function_call_output",
              call_id: finalChatMessage.call_id,
              status: "completed",
              output: JSON.stringify(toolResult),
            });
            setConversationItems([...conversationItems]);

            await processMessages();
          }
          break;
        }

        case "response.function_call_arguments.delta": {
          functionArguments += data.delta || "";
          let parsedFunctionArguments = {};

          const toolCallMessage = chatMessages.find((m) => m.id === data.item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.arguments = functionArguments;
            try {
              if (functionArguments.length > 0) {
                parsedFunctionArguments = parse(functionArguments);
              }
              toolCallMessage.parsedArguments = parsedFunctionArguments;
            } catch {
              // partial JSON can fail parse; ignore
            }
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.function_call_arguments.done": {
          const { item_id, arguments: finalArgs } = data;

          functionArguments = finalArgs;

          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.arguments = finalArgs;
            toolCallMessage.parsedArguments = parse(finalArgs);
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.web_search_call.completed": {
          const { item_id, output } = data;
          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.output = output;
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.file_search_call.completed": {
          const { item_id, output } = data;
          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.output = output;
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        // Handle other events as needed
      }
    });
  } catch (error) {
    console.error("Error during handleTurn in processMessages:", error);
    // Ensure isWaitingForReply is reset if handleTurn throws an error directly
    useConversationStore.getState().setIsWaitingForReply(false);
  } finally {
    // Ensure isWaitingForReply is reset if handleTurn completes but no initial response was flagged
    if (!hasReceivedInitialResponse) {
      useConversationStore.getState().setIsWaitingForReply(false);
    }
  }
};
