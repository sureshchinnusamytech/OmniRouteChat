export type RoutingStrategy = 'auto' | 'auto/coding' | 'auto/fast' | 'auto/offline';

export interface ImageAttachment {
  id: string;
  base64: string;       // data:image/...;base64,...
  mimeType: string;     // image/png, image/jpeg, etc.
  name: string;
  sizeBytes: number;
}

export interface MessageMetadata {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  model?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
  images?: ImageAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  routingStrategy: RoutingStrategy;
  systemPrompt: string;
}
