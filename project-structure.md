# Project Structure Breakdown

## Overview
This is a Next.js application that implements an AI assistant interface using the OpenAI API. The app provides a chat interface where users can interact with the assistant, which supports various tools including file search, web search, and custom function calls.

## Tech Stack
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Integration**: OpenAI API
- **UI Components**: Various React components including Radix UI

## Directory Structure

### App Directory (`/app`)
- `page.tsx`: Main page component that sets up the layout with Assistant and ToolsPanel
- `layout.tsx`: Root layout component for the Next.js app
- `globals.css`: Global CSS styles
- `api/`: API route handlers

### Components (`/components`)
- `assistant.tsx`: The main assistant component that handles message processing
- `chat.tsx`: Chat interface component for user interaction
- `message.tsx`: Message display component in the chat
- `tool-call.tsx`: Handles tool calls issued by the assistant
- `tools-panel.tsx`: UI panel for configuring and managing available tools
- `file-upload.tsx`: Component for handling file uploads
- `functions-view.tsx`: Displays available functions
- `websearch-config.tsx`: Configuration for web search functionality
- `panel-config.tsx`: Configuration panel UI
- `country-selector.tsx`: Country selection component
- `file-search-setup.tsx`: Setup component for file search functionality
- `annotations.tsx`: Handles text annotations in the chat

### State Management (`/stores`)
- `useConversationStore.ts`: State management for conversation history
- `useToolsStore.ts`: State management for tools configuration

### Core Functionality (`/lib`)
- `assistant.ts`: Core implementation of the assistant with message processing logic
- `tools/`: Directory containing implementation of various tools
- `utils.ts`: Utility functions used throughout the application

### Configuration (`/config`)
- `constants.ts`: Application-wide constants
- `functions.ts`: Function definitions for tool calls
- `tools-list.ts`: List of available tools and their configuration

## Key Features
1. **AI Assistant Integration**: Connects to OpenAI API to provide intelligent responses
2. **Tool Integration**: Extends assistant capabilities with custom tools
3. **Streaming Responses**: Implements streaming for a more dynamic user experience
4. **Responsive UI**: Adapts to different screen sizes with responsive design
5. **State Management**: Uses Zustand for efficient state management

## Component Relationships
- The main `page.tsx` renders the `Assistant` component and `ToolsPanel`
- `Assistant` component uses the `Chat` component to display messages
- `Chat` component displays a series of `message.tsx` components
- Tool calls are handled via `tool-call.tsx`
- State is managed through Zustand stores that maintain conversation history and tool configurations

## Data Flow
1. User inputs a message through the chat interface
2. The message is stored in the conversation store
3. The assistant processes the message through the OpenAI API
4. Responses and tool calls are streamed back to the UI
5. Tool calls are executed and their results are fed back into the conversation
6. The UI updates in real-time with the assistant's responses

This modular architecture allows for easy extension with new tools and capabilities while maintaining a clean separation of concerns. 