/**
 * Event Utilities
 * Helper functions and utilities for working with events
 */

import type { EventData, EventHandler } from "./types";
import { EventService } from "./service";

/**
 * Create a typed event emitter function for a specific event
 * @example
 * const emitUserLogin = createEventEmitter<{ ipAddress: string }>("auth.user_logged_in");
 * await emitUserLogin({ userId: "123", ipAddress: "127.0.0.1" });
 */
export function createEventEmitter<T extends EventData = EventData>(
  eventName: string
) {
  return async (data: T = {} as T) => {
    return EventService.emit(eventName, data);
  };
}

/**
 * Create a typed async event emitter (fire and forget)
 */
export function createAsyncEventEmitter<T extends EventData = EventData>(
  eventName: string
) {
  return (data: T = {} as T) => {
    EventService.emitAsync(eventName, data);
  };
}

/**
 * Batch emit multiple events
 */
export async function emitBatch(
  events: Array<{ name: string; data?: EventData }>
): Promise<void> {
  await Promise.all(events.map((event) => EventService.emit(event.name, event.data)));
}

/**
 * Create an event logger that logs all events of a specific type
 */
export function createEventLogger(eventName: string, logger = console.log) {
  EventService.on(eventName, (data: EventData) => {
    logger(`[Event: ${eventName}]`, data);
  });
}

/**
 * Create a rate-limited event emitter
 */
export function createRateLimitedEmitter<T extends EventData = EventData>(
  eventName: string,
  maxPerMinute: number
) {
  let count = 0;
  let resetTime = Date.now() + 60000;

  return async (data: T = {} as T) => {
    const now = Date.now();
    if (now >= resetTime) {
      count = 0;
      resetTime = now + 60000;
    }

    if (count >= maxPerMinute) {
      console.warn(`Rate limit exceeded for event: ${eventName}`);
      return;
    }

    count++;
    return EventService.emit(eventName, data);
  };
}

