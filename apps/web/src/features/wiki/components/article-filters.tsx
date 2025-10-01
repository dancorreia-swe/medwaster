import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Calendar } from "lucide-react";

export function ArticleFilters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");

  const activeFiltersCount = [
    selectedStatus !== "all",
    selectedCategory !== "all", 
    selectedAuthor !== "all",
    searchTerm.length > 0
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedCategory("all");
    setSelectedAuthor("all");
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Search and Primary Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search articles by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {/* TODO: Load categories dynamically */}
                <SelectItem value="biological">Biological Waste</SelectItem>
                <SelectItem value="chemical">Chemical Waste</SelectItem>
                <SelectItem value="pathological">Pathological Waste</SelectItem>
                <SelectItem value="pharmaceutical">Pharmaceutical Waste</SelectItem>
              </SelectContent>
            </Select>

            {/* Author Filter */}
            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by author" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                <SelectItem value="me">My Articles</SelectItem>
                {/* TODO: Load authors dynamically */}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="mr-2">
                    {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                  </Badge>
                )}
                Filters
              </span>
            </div>

            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="mr-2 h-4 w-4" />
                Clear all
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="outline" className="px-2 py-1">
                  Search: "{searchTerm}"
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 text-gray-500 hover:text-gray-700"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {selectedStatus !== "all" && (
                <Badge variant="outline" className="px-2 py-1">
                  Status: {selectedStatus}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 text-gray-500 hover:text-gray-700"
                    onClick={() => setSelectedStatus("all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {selectedCategory !== "all" && (
                <Badge variant="outline" className="px-2 py-1">
                  Category: {selectedCategory}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 text-gray-500 hover:text-gray-700"
                    onClick={() => setSelectedCategory("all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {selectedAuthor !== "all" && (
                <Badge variant="outline" className="px-2 py-1">
                  Author: {selectedAuthor}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 text-gray-500 hover:text-gray-700"
                    onClick={() => setSelectedAuthor("all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}