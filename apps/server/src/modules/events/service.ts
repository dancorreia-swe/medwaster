import type { EventData, EventHandler, EventName, EventRegistry } from "./types";

/**
 * Event Service
 * Core event system that modules can use to emit and handle events
 */
class EventServiceImpl {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Register an event handler for a specific event
   */
  on<K extends EventName>(
    eventName: K,
    handler: EventHandler<K extends keyof EventRegistry ? EventRegistry[K] : EventData>
  ): void {
    if (!this.handlers.has(eventName as string)) {
      this.handlers.set(eventName as string, new Set());
    }
    this.handlers.get(eventName as string)!.add(handler as EventHandler);
  }

  /**
   * Remove an event handler
   */
  off<K extends EventName>(
    eventName: K,
    handler: EventHandler<K extends keyof EventRegistry ? EventRegistry[K] : EventData>
  ): void {
    const handlers = this.handlers.get(eventName as string);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<K extends EventName>(
    eventName: K,
    data?: K extends keyof EventRegistry ? EventRegistry[K] : EventData
  ): Promise<void> {
    const handlers = this.handlers.get(eventName as string);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises = Array.from(handlers).map((handler) =>
      Promise.resolve(handler(data as any)).catch((error) => {
        console.error(`Error in event handler for ${eventName as string}:`, error);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Emit an event without waiting for handlers to complete
   */
  emitAsync<K extends EventName>(
    eventName: K,
    data?: K extends keyof EventRegistry ? EventRegistry[K] : EventData
  ): void {
    this.emit(eventName, data).catch((error) => {
      console.error(`Error emitting event ${eventName as string}:`, error);
    });
  }

  /**
   * Get all registered event names
   */
  getEventNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers for a specific event
   */
  clearHandlers(eventName: string): void {
    this.handlers.delete(eventName);
  }

  /**
   * Clear all handlers
   */
  clearAllHandlers(): void {
    this.handlers.clear();
  }
}

export const EventService = new EventServiceImpl();
