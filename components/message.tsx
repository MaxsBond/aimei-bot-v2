import { MessageItem } from "@/lib/assistant";
import React from "react";
import ReactMarkdown from "react-markdown";

interface MessageProps {
  message: MessageItem;
  onSendMessage: (message: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onSendMessage }) => {
  const text = message.content[0].text as string;
  const questionMatch = text.match(/\[(.*?)\?\]/);

  return (
    <div className="text-sm">
      {message.role === "user" ? (
        <div className="flex justify-end">
          <div>
            <div className="ml-4 rounded-[16px] px-4 py-2 md:ml-24 bg-[#ededed] text-stone-900  font-light">
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
                  {questionMatch ? text.split(questionMatch[0])[0] : text}
                </ReactMarkdown>
              </div>
              {/* Add button logic to assistant block */}
              {questionMatch && (
                  <button
                    className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm" /* Adjusted padding/text size */
                    onClick={() => onSendMessage(questionMatch[1] + '?')} /* Add question mark back */
                  >
                    {questionMatch[1]}? {/* Add question mark back */}
                  </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
