import { Elysia } from "elysia";

type EventHandler<T = any> = (data: T) => void | Promise<void>;

interface EventSubscription {
  unsubscribe: () => void;
}

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private onceHandlers: Map<string, Set<EventHandler>> = new Map();

  on<T = any>(event: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(handler);

    return {
      unsubscribe: () => this.off(event, handler),
    };
  }

  once<T = any>(event: string, handler: EventHandler<T>): EventSubscription {
    if (!this.onceHandlers.has(event)) {
      this.onceHandlers.set(event, new Set());
    }
    this.onceHandlers.get(event)!.add(handler);

    return {
      unsubscribe: () => {
        const handlers = this.onceHandlers.get(event);
        if (handlers) {
          handlers.delete(handler);
        }
      },
    };
  }

  off<T = any>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  async emit<T = any>(event: string, data?: T): Promise<void> {
    const handlers = this.handlers.get(event);
    const onceHandlers = this.onceHandlers.get(event);

    const allHandlers = [
      ...(handlers ? Array.from(handlers) : []),
      ...(onceHandlers ? Array.from(onceHandlers) : []),
    ];

    if (onceHandlers) {
      this.onceHandlers.delete(event);
    }

    await Promise.all(allHandlers.map((handler) => handler(data)));
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
      this.onceHandlers.delete(event);
    } else {
      this.handlers.clear();
      this.onceHandlers.clear();
    }
  }

  listenerCount(event: string): number {
    const handlers = this.handlers.get(event);
    const onceHandlers = this.onceHandlers.get(event);
    return (handlers?.size || 0) + (onceHandlers?.size || 0);
  }

  eventNames(): string[] {
    const names = new Set([
      ...this.handlers.keys(),
      ...this.onceHandlers.keys(),
    ]);
    return Array.from(names);
  }
}

export const eventBus = new EventBus();

export const events = new Elysia({ name: "events-plugin" }).decorate(
  "events",
  eventBus,
);
