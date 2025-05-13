import React from "react";

import { ToolCallItem, processMessages, MessageItem } from "@/lib/assistant";
import useConversationStore from "@/stores/useConversationStore";
import { BookOpenText, Clock, Globe, Zap } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ToolCallProps {
  toolCall: ToolCallItem;
}

/**
 * Renders a cell for an API call, displaying its status, arguments, and output.
 */

// Component to render an API call
function ApiCallCell({ toolCall }: ToolCallProps) {
  return (
    <div className="flex flex-col w-[70%] relative mb-[-8px]">
      <div>
        <div className="flex flex-col text-sm rounded-[16px]">
          <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
            <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
              <Zap size={16} />
              <div className="text-sm font-medium">
                {/* Display "Called [toolName]" or "Calling [toolName]..." based on status */}
                {toolCall.status === "completed"
                  ? `Called ${toolCall.name}`
                  : `Calling ${toolCall.name}...`}
              </div>
            </div>
          </div>

          {/* Default rendering for tool calls */}
          <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
            {/* Display tool arguments */}
            <div className="max-h-96 overflow-y-scroll text-xs border-b mx-6 p-2">
              <SyntaxHighlighter
                customStyle={{
                  backgroundColor: "#fafafa",
                  padding: "8px",
                  paddingLeft: "0px",
                  marginTop: 0,
                  marginBottom: 0,
                }}
                language="json"
                style={coy}
              >
                {/* Stringify parsed arguments for display */}
                {JSON.stringify(toolCall.parsedArguments, null, 2)}
              </SyntaxHighlighter>
            </div>
            {/* Display tool output */}
            <div className="max-h-96 overflow-y-scroll mx-6 p-2 text-xs">
              {toolCall.output ? (
                <SyntaxHighlighter
                  customStyle={{
                    backgroundColor: "#fafafa",
                    padding: "8px",
                    paddingLeft: "0px",
                    marginTop: 0,
                  }}
                  language="json"
                  style={coy}
                >
                  {/* Stringify and parse output for display */}
                  {JSON.stringify(JSON.parse(toolCall.output), null, 2)}
                </SyntaxHighlighter>
              ) : (
                // Display waiting message if output is not yet available
                <div className="text-zinc-500 flex items-center gap-2 py-2">
                  <Clock size={16} /> Waiting for result...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a cell for a file search operation, displaying its status.
 */
// Component to render a file search call
function FileSearchCell({ toolCall }: ToolCallProps) {
  return (
    <div className="flex gap-2 items-center text-blue-500 mb-[-16px] ml-[-8px]">
      <BookOpenText size={16} />
      <div className="text-sm font-medium mb-0.5">
        {/* Display "Searched files" or "Searching files..." based on status */}
        {toolCall.status === "completed"
          ? "Searched files"
          : "Searching files..."}
      </div>
    </div>
  );
}

/**
 * Renders a cell for a web search operation, displaying its status.
 */
// Component to render a web search call
function WebSearchCell({ toolCall }: ToolCallProps) {
  return (
    <div className="flex gap-2 items-center text-blue-500 mb-[-16px] ml-[-8px]">
      <Globe size={16} />
      <div className="text-sm font-medium">
        {/* Display "Searched the web" or "Searching the web..." based on status */}
        {toolCall.status === "completed"
          ? "Searched the web"
          : "Searching the web..."}
      </div>
    </div>
  );
}

/**
 * Main component to render a tool call.
 * It acts as a switcher to display the appropriate cell based on the tool_type.
 */
// Main component to render a tool call
export default function ToolCall({ toolCall }: ToolCallProps) {
  return (
    <div className="flex justify-start pt-2">
      {/* IIFE to switch between different tool call types */}
      {(() => {
        switch (toolCall.tool_type) {
          // Render ApiCallCell for function calls
          case "function_call":
            return <ApiCallCell toolCall={toolCall} />;
          // Render FileSearchCell for file search calls
          case "file_search_call":
            return <FileSearchCell toolCall={toolCall} />;
          // Render WebSearchCell for web search calls
          case "web_search_call":
            return <WebSearchCell toolCall={toolCall} />;
          // Return null for unknown tool types
          default:
            return null;
        }
      })()}
    </div>
  );
}
