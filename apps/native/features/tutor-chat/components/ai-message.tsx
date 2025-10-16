import { MessageBubble } from "./message-bubble";

interface AiMessageProps {
  message: string;
}

export function AiMessage({ message }: AiMessageProps) {
  return <MessageBubble message={message} isUser={false} />;
}
