import { RoutingStrategy } from './conversation.model';

export interface AppSettings {
  apiBaseUrl: string;
  apiKey: string;
  defaultModel: RoutingStrategy;
  temperature: number;
  maxTokens: number;
  topP: number;
  isDarkMode: boolean;
  systemPrompt: string;
}
