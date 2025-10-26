/**
 * Core Event Interface
 * Base types and interfaces that all module-specific events should extend
 */

export interface EventData {
  userId?: string;
  [key: string]: unknown;
}

export type EventHandler<T extends EventData = EventData> = (
  data: T,
) => Promise<void> | void;

import type { EventRegistry } from "./registry";

// Event name type - either a registered event or any string
// The (string & {}) allows unregistered events while prioritizing registered ones
export type EventName = keyof EventRegistry | (string & {});

export interface EventEmitter {
  emit<K extends EventName>(
    eventName: K,
    data?: K extends keyof EventRegistry ? EventRegistry[K] : EventData,
  ): Promise<void>;

  on<K extends EventName>(
    eventName: K,
    handler: EventHandler<
      K extends keyof EventRegistry ? EventRegistry[K] : EventData
    >,
  ): void;

  off<K extends EventName>(
    eventName: K,
    handler: EventHandler<
      K extends keyof EventRegistry ? EventRegistry[K] : EventData
    >,
  ): void;
}
