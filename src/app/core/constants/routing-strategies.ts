import { RoutingStrategy } from '../models/conversation.model';

export interface RoutingStrategyOption {
  value: RoutingStrategy;
  label: string;
  icon: string;
  description: string;
}

export const ROUTING_STRATEGIES: RoutingStrategyOption[] = [
  {
    value: 'auto',
    label: 'Auto',
    icon: '🔀',
    description: 'Best model for the task — smart routing across 236 providers',
  },
  {
    value: 'auto/coding',
    label: 'Auto Coding',
    icon: '💻',
    description: 'Optimized for code generation, review, and debugging',
  },
  {
    value: 'auto/fast',
    label: 'Auto Fast',
    icon: '⚡',
    description: 'Fastest available model — prioritizes low latency',
  },
  {
    value: 'auto/offline',
    label: 'Auto Offline',
    icon: '🔌',
    description: 'Local providers only — runs completely offline',
  },
];
