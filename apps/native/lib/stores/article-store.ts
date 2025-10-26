import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ArticleState {
  readArticles: Set<string>;
  favoriteArticles: Set<string>;
  
  markAsRead: (articleId: string) => void;
  markAsUnread: (articleId: string) => void;
  isRead: (articleId: string) => boolean;
  
  toggleFavorite: (articleId: string) => void;
  isFavorite: (articleId: string) => boolean;
}

export const useArticleStore = create<ArticleState>()(
  persist(
    (set, get) => ({
      readArticles: new Set<string>(),
      favoriteArticles: new Set<string>(),
      
      markAsRead: (articleId: string) =>
        set((state) => ({
          readArticles: new Set(state.readArticles).add(articleId),
        })),
      
      markAsUnread: (articleId: string) =>
        set((state) => {
          const newSet = new Set(state.readArticles);
          newSet.delete(articleId);
          return { readArticles: newSet };
        }),
      
      isRead: (articleId: string) => get().readArticles.has(articleId),
      
      toggleFavorite: (articleId: string) =>
        set((state) => {
          const newSet = new Set(state.favoriteArticles);
          if (newSet.has(articleId)) {
            newSet.delete(articleId);
          } else {
            newSet.add(articleId);
          }
          return { favoriteArticles: newSet };
        }),
      
      isFavorite: (articleId: string) => get().favoriteArticles.has(articleId),
    }),
    {
      name: 'article-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        readArticles: Array.from(state.readArticles),
        favoriteArticles: Array.from(state.favoriteArticles),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        readArticles: new Set(persistedState?.readArticles || []),
        favoriteArticles: new Set(persistedState?.favoriteArticles || []),
      }),
    }
  )
);
