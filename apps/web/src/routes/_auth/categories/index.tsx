import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CategoriesPage } from "@/features/categories/components";
import { categoriesListQueryOptions } from "@/features/categories/api";

export const Route = createFileRoute("/_auth/categories/")({
  beforeLoad: () => ({ getTitle: () => "Categorias" }),
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(categoriesListQueryOptions());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    // TODO: Add debouncing logic here if needed
    setIsSearching(false);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Handle search submit logic
    setIsSearching(false);
  };

  return (
    <CategoriesPage
      searchValue={searchValue}
      isSearching={isSearching}
      onSearchChange={handleSearchChange}
      onSearchSubmit={handleSearchSubmit}
    />
  );
}
