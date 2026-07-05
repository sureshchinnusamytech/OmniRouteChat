export interface ChatMessageContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string; detail?: 'auto' | 'low' | 'high' };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatMessageContentPart[];
}

export interface ModelParams {
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'usage'; promptTokens: number; completionTokens: number; totalTokens: number; model: string }
  | { type: 'done'; latencyMs: number }
  | { type: 'aborted' };

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`API Error ${status}: ${body}`);
    this.name = 'ApiError';
  }
}

export interface ModelListResponse {
  data: Array<{ id: string; object: string; owned_by: string }>;
}
