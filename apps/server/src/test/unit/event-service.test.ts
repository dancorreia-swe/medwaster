import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { EventService } from "../../modules/events/service";
import type { EventData } from "../../modules/events/types";

// Test event types
interface TestEventData extends EventData {
  userId: string;
  message: string;
  count: number;
}

interface AnotherTestEventData extends EventData {
  userId: string;
  success: boolean;
}

// Augment the registry for testing
declare module "../../modules/events/registry" {
  export interface EventRegistry {
    "test.event": TestEventData;
    "test.another": AnotherTestEventData;
  }
}

describe("EventService", () => {
  beforeEach(() => {
    // Clear all handlers before each test
    EventService.clearAllHandlers();
  });

  afterEach(() => {
    // Clean up after each test
    EventService.clearAllHandlers();
  });

  describe("on() - Event Registration", () => {
    test("should register an event handler", () => {
      const handler = vi.fn();

      EventService.on("test.event", handler);

      expect(EventService.getEventNames()).toContain("test.event");
    });

    test("should register multiple handlers for the same event", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      EventService.on("test.event", handler1);
      EventService.on("test.event", handler2);

      expect(EventService.getEventNames()).toContain("test.event");
    });

    test("should register handlers for different events", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      EventService.on("test.event", handler1);
      EventService.on("test.another", handler2);

      const eventNames = EventService.getEventNames();
      expect(eventNames).toContain("test.event");
      expect(eventNames).toContain("test.another");
    });
  });

  describe("emit() - Event Emission", () => {
    test("should call registered handler when event is emitted", async () => {
      const handler = vi.fn();
      EventService.on("test.event", handler);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "Hello",
        count: 1,
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        userId: "user123",
        message: "Hello",
        count: 1,
      });
    });

    test("should call all registered handlers for an event", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      EventService.on("test.event", handler1);
      EventService.on("test.event", handler2);
      EventService.on("test.event", handler3);

      const eventData = {
        userId: "user123",
        message: "Test",
        count: 5,
      };

      await EventService.emit("test.event", eventData);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);

      expect(handler1).toHaveBeenCalledWith(eventData);
      expect(handler2).toHaveBeenCalledWith(eventData);
      expect(handler3).toHaveBeenCalledWith(eventData);
    });

    test("should not call handlers for different events", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      EventService.on("test.event", handler1);
      EventService.on("test.another", handler2);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "Test",
        count: 1,
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });

    test("should handle async handlers", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);

      EventService.on("test.event", handler);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "Async test",
        count: 1,
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    test("should handle sync handlers", async () => {
      const handler = vi.fn();

      EventService.on("test.event", handler);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "Sync test",
        count: 1,
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    test("should not throw if no handlers are registered", async () => {
      await EventService.emit("test.event", {
        userId: "user123",
        message: "No handlers",
        count: 1,
      });

      // If we get here without throwing, test passes
      expect(true).toBe(true);
    });

    test("should handle handler errors without breaking other handlers", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const errorHandler = vi.fn().mockRejectedValue(new Error("Handler error"));
      const successHandler = vi.fn().mockResolvedValue(undefined);

      EventService.on("test.event", errorHandler);
      EventService.on("test.event", successHandler);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "Error test",
        count: 1,
      });

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(successHandler).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error in event handler for test.event"),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    test("should emit event with optional data", async () => {
      const handler = vi.fn();
      EventService.on("test.event", handler);

      await EventService.emit("test.event");

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(undefined);
    });
  });

  describe("emitAsync() - Async Event Emission", () => {
    test("should emit event asynchronously", () => {
      const handler = vi.fn();
      EventService.on("test.event", handler);

      // emitAsync doesn't wait for handlers
      EventService.emitAsync("test.event", {
        userId: "user123",
        message: "Async emit",
        count: 1,
      });

      // Handler might not be called immediately
      // Wait for next tick
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(handler).toHaveBeenCalledTimes(1);
          resolve(undefined);
        }, 10);
      });
    });

    test("should not block execution", () => {
      const handler = vi.fn();
      EventService.on("test.event", handler);

      const startTime = Date.now();
      EventService.emitAsync("test.event", {
        userId: "user123",
        message: "Non-blocking",
        count: 1,
      });
      const endTime = Date.now();

      // Should return immediately
      expect(endTime - startTime).toBeLessThan(10);
    });
  });

  describe("off() - Event Unregistration", () => {
    test("should remove a specific handler", async () => {
      const handler = vi.fn();

      EventService.on("test.event", handler);
      EventService.off("test.event", handler);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "After off",
        count: 1,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    test("should remove only the specified handler", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      EventService.on("test.event", handler1);
      EventService.on("test.event", handler2);

      EventService.off("test.event", handler1);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "Selective off",
        count: 1,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    test("should handle removing non-existent handler", () => {
      const handler = vi.fn();

      expect(() => {
        EventService.off("test.event", handler);
      }).not.toThrow();
    });
  });

  describe("clearHandlers() - Clear Specific Event", () => {
    test("should clear all handlers for a specific event", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      EventService.on("test.event", handler1);
      EventService.on("test.event", handler2);

      EventService.clearHandlers("test.event");

      await EventService.emit("test.event", {
        userId: "user123",
        message: "After clear",
        count: 1,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    test("should only clear handlers for specified event", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      EventService.on("test.event", handler1);
      EventService.on("test.another", handler2);

      EventService.clearHandlers("test.event");

      await EventService.emit("test.another", {
        userId: "user123",
        success: true,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearAllHandlers() - Clear All Events", () => {
    test("should clear all handlers for all events", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      EventService.on("test.event", handler1);
      EventService.on("test.event", handler2);
      EventService.on("test.another", handler3);

      EventService.clearAllHandlers();

      await EventService.emit("test.event", {
        userId: "user123",
        message: "After clear all",
        count: 1,
      });

      await EventService.emit("test.another", {
        userId: "user123",
        success: true,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });

    test("should allow re-registration after clearAll", async () => {
      const handler = vi.fn();

      EventService.on("test.event", handler);
      EventService.clearAllHandlers();
      EventService.on("test.event", handler);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "Re-registered",
        count: 1,
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("getEventNames()", () => {
    test("should return empty array when no events registered", () => {
      expect(EventService.getEventNames()).toEqual([]);
    });

    test("should return registered event names", () => {
      const handler = vi.fn();

      EventService.on("test.event", handler);
      EventService.on("test.another", handler);

      const eventNames = EventService.getEventNames();
      expect(eventNames).toContain("test.event");
      expect(eventNames).toContain("test.another");
      expect(eventNames).toHaveLength(2);
    });
  });

  describe("Type Safety", () => {
    test("should work with typed event data", async () => {
      const handler = vi.fn<[TestEventData], void>();

      EventService.on("test.event", handler);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "Typed event",
        count: 42,
      });

      expect(handler).toHaveBeenCalledWith({
        userId: "user123",
        message: "Typed event",
        count: 42,
      });
    });

    test("should handle events with different data structures", async () => {
      const handler1 = vi.fn<[TestEventData], void>();
      const handler2 = vi.fn<[AnotherTestEventData], void>();

      EventService.on("test.event", handler1);
      EventService.on("test.another", handler2);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "First event",
        count: 1,
      });

      await EventService.emit("test.another", {
        userId: "user456",
        success: true,
      });

      expect(handler1).toHaveBeenCalledWith({
        userId: "user123",
        message: "First event",
        count: 1,
      });

      expect(handler2).toHaveBeenCalledWith({
        userId: "user456",
        success: true,
      });
    });
  });

  describe("Real-world Scenarios", () => {
    test("should handle quiz completion event flow", async () => {
      const achievementHandler = vi.fn();
      const analyticsHandler = vi.fn();

      EventService.on("test.event", achievementHandler);
      EventService.on("test.event", analyticsHandler);

      await EventService.emit("test.event", {
        userId: "user123",
        message: "Quiz completed",
        count: 100,
      });

      expect(achievementHandler).toHaveBeenCalledTimes(1);
      expect(analyticsHandler).toHaveBeenCalledTimes(1);
    });

    test("should handle multiple events in sequence", async () => {
      const events: string[] = [];

      EventService.on("test.event", async () => {
        events.push("event1");
      });

      EventService.on("test.another", async () => {
        events.push("event2");
      });

      await EventService.emit("test.event", {
        userId: "user123",
        message: "First",
        count: 1,
      });

      await EventService.emit("test.another", {
        userId: "user123",
        success: true,
      });

      expect(events).toEqual(["event1", "event2"]);
    });

    test("should handle event chain reactions", async () => {
      const results: string[] = [];

      EventService.on("test.event", async (data) => {
        results.push("handler1");
        // Trigger another event
        await EventService.emit("test.another", {
          userId: data.userId,
          success: true,
        });
      });

      EventService.on("test.another", async () => {
        results.push("handler2");
      });

      await EventService.emit("test.event", {
        userId: "user123",
        message: "Chain start",
        count: 1,
      });

      expect(results).toEqual(["handler1", "handler2"]);
    });
  });
});
