export const MODEL = "gpt-4.1";

// Developer prompt for the assistant
export const DEVELOPER_PROMPT = `

After you have answered the user's question, you should give the array of follow-up questions as if you are the user asking them.
This should be a JSON array of strings, on a new line, prefixed with "Follow-up questions: ".
For example:
Follow-up questions: ["What are the main components of an engine?", "Which types of engines are there?"]

Make sure the JSON is valid.
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
