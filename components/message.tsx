import { MessageItem } from "@/lib/assistant";
import React from "react";
import ReactMarkdown from "react-markdown";

interface MessageProps {
  message: MessageItem;
  onSendMessage: (message: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onSendMessage }) => {
  const contentItem = message.content[0];
  const text = contentItem.text as string;
  const followUpQuestions = contentItem.followUpQuestions;

  return (
    <div className="text-sm">
      {message.role === "user" ? (
        <div className="flex justify-end">
          <div>
            <div className="ml-4 rounded-[16px] px-4 py-2 md:ml-24 bg-[#ededed] text-stone-900 font-light">
              <div>
                <div>
                  <ReactMarkdown>
                    {/* Render the full text for user messages */}
                    {text}
                  </ReactMarkdown>
                </div>
                {/* Remove button logic from user block */}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex">
            <div className="mr-4 rounded-[16px] px-4 py-2 md:mr-24 text-black bg-white font-light">
              <div>
                <ReactMarkdown>
                  {/* Render text before the question for assistant messages */}
                  {text}
                </ReactMarkdown>
              </div>
              {/* Add button logic to assistant block */}
              {followUpQuestions && followUpQuestions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {followUpQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-normal py-2 px-3 rounded-lg border border-slate-200 text-xs text-left shadow-sm"
                      onClick={() => onSendMessage(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
