import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ArticleState {
  readArticles: Set<number>;
  unreadArticles: Set<number>; // Explicitly marked as unread by user
  favoriteArticles: Set<number>;

  setReadArticles: (articleIds: number[]) => void;
  setFavoriteArticles: (articleIds: number[]) => void;

  markAsRead: (articleId: number) => void;
  markAsUnread: (articleId: number) => void;
  isRead: (articleId: number) => boolean;
  isExplicitlyUnread: (articleId: number) => boolean;

  addFavorite: (articleId: number) => void;
  removeFavorite: (articleId: number) => void;
  isFavorite: (articleId: number) => boolean;
}

const setsEqual = (a: Set<number>, b: Set<number>) => {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
};

export const useArticleStore = create<ArticleState>()(
  persist(
    (set, get) => ({
      readArticles: new Set<number>(),
      unreadArticles: new Set<number>(),
      favoriteArticles: new Set<number>(),

      setReadArticles: (articleIds: number[]) =>
        set((state) => {
          const next = new Set(articleIds);
          if (setsEqual(state.readArticles, next)) {
            return state;
          }
          return { readArticles: next };
        }),

      setFavoriteArticles: (articleIds: number[]) =>
        set((state) => {
          const next = new Set(articleIds);
          if (setsEqual(state.favoriteArticles, next)) {
            return state;
          }
          return { favoriteArticles: next };
        }),

      markAsRead: (articleId: number) =>
        set((state) => {
          const updatedRead = new Set(state.readArticles);
          const updatedUnread = new Set(state.unreadArticles);
          updatedRead.add(articleId);
          updatedUnread.delete(articleId); // Remove from unread if it was there
          return { readArticles: updatedRead, unreadArticles: updatedUnread };
        }),

      markAsUnread: (articleId: number) =>
        set((state) => {
          const updatedRead = new Set(state.readArticles);
          const updatedUnread = new Set(state.unreadArticles);
          updatedRead.delete(articleId); // Remove from read
          updatedUnread.add(articleId); // Add to explicitly unread
          return { readArticles: updatedRead, unreadArticles: updatedUnread };
        }),

      isRead: (articleId: number) => get().readArticles.has(articleId),
      
      isExplicitlyUnread: (articleId: number) => get().unreadArticles.has(articleId),

      addFavorite: (articleId: number) =>
        set((state) => {
          const updated = new Set(state.favoriteArticles);
          updated.add(articleId);
          return { favoriteArticles: updated };
        }),

      removeFavorite: (articleId: number) =>
        set((state) => {
          const updated = new Set(state.favoriteArticles);
          updated.delete(articleId);
          return { favoriteArticles: updated };
        }),

      isFavorite: (articleId: number) =>
        get().favoriteArticles.has(articleId),
    }),
    {
      name: "article-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        readArticles: Array.from(state.readArticles),
        unreadArticles: Array.from(state.unreadArticles),
        favoriteArticles: Array.from(state.favoriteArticles),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          readArticles?: number[];
          unreadArticles?: number[];
          favoriteArticles?: number[];
        } | null;

        return {
          ...currentState,
          readArticles: new Set<number>(
            Array.isArray(persisted?.readArticles) ? persisted.readArticles : []
          ),
          unreadArticles: new Set<number>(
            Array.isArray(persisted?.unreadArticles) ? persisted.unreadArticles : []
          ),
          favoriteArticles: new Set<number>(
            Array.isArray(persisted?.favoriteArticles)
              ? persisted.favoriteArticles
              : []
          ),
        };
      },
    },
  ),
);
