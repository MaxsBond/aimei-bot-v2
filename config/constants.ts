export const MODEL = "gpt-4.1-mini";

// Developer prompt for the assistant
export const DEVELOPER_PROMPT = `

After you have answered the user's question, you should give follow-up question as if you are the user asking them. based on context in form [question].
For example, if the user asks 'How does an engine work?', your follow-up could be '[What are the main components of an engine?]'"
`;

// Here is the context that you have available to you:
// ${context}

// Initial message that will be displayed in the chat
export const INITIAL_MESSAGE = `
Hi, how can I help you?
`;

export const defaultVectorStore = {
  id: "",
  name: "Example",
};
