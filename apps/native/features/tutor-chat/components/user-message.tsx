import { MessageBubble } from "./message-bubble";

interface UserMessageProps {
  message: string;
}

export function UserMessage({ message }: UserMessageProps) {
  return <MessageBubble message={message} isUser={true} />;
}

