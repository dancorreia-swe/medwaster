/**
 * Event Registry
 * 
 * This is the central registry where all modules register their events.
 * It uses TypeScript's "declaration merging" to allow modules to extend
 * the EventRegistry interface with their own events.
 * 
 * HOW IT WORKS:
 * 
 * 1. This file exports an empty EventRegistry interface
 * 2. Each module augments it by declaring their events
 * 3. TypeScript merges all declarations into one big interface
 * 4. EventService uses this interface for type safety
 * 
 * EXAMPLE:
 * 
 * // In modules/quiz/events.ts
 * declare module "@/modules/events/registry" {
 *   interface EventRegistry {
 *     "quiz.completed": QuizCompletedData;
 *   }
 * }
 * 
 * This tells TypeScript: "Hey, add these events to the global registry"
 * 
 * WHY THIS APPROACH?
 * - ✅ Type safety across all modules
 * - ✅ Autocomplete for all registered events
 * - ✅ No need to import types everywhere
 * - ✅ Compiler enforces correct data structures
 */

// This is the base interface that modules will extend
export interface EventRegistry {
  // Empty by default - modules add their events via declaration merging
  // Example after modules register:
  // "quiz.completed": QuizCompletedData;
  // "achievement.unlocked": AchievementUnlockedData;
}

