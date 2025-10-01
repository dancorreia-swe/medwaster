import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Download,
  Clock,
  User,
  Calendar
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ArticleListItem } from "@/features/wiki/api/articles";

interface ArticlesTableProps {
  articles: ArticleListItem[];
}

export function ArticlesTable({ articles }: ArticlesTableProps) {
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary" as const,
      published: "default" as const,
      archived: "outline" as const,
    };
    
    const colors = {
      draft: "text-yellow-700 bg-yellow-50 border-yellow-200",
      published: "text-green-700 bg-green-50 border-green-200", 
      archived: "text-gray-700 bg-gray-50 border-gray-200",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status === "draft" ? "Rascunho" : 
         status === "published" ? "Publicado" :
         "Arquivado"}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
    });
  };

  if (articles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Articles Found</CardTitle>
          <CardDescription>
            Start by creating your first educational article about medical waste disposal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/admin/wiki/articles/new">
            <Button>Create First Article</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedArticles.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedArticles.size} article(s) selected
          </span>
          <Button variant="outline" size="sm">
            Publish Selected
          </Button>
          <Button variant="outline" size="sm">
            Archive Selected
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      )}

      {/* Articles Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedArticles(new Set(articles.map(a => a.id)));
                      } else {
                        setSelectedArticles(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Reading Time</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Views</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedArticles.has(article.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedArticles);
                        if (e.target.checked) {
                          newSelected.add(article.id);
                        } else {
                          newSelected.delete(article.id);
                        }
                        setSelectedArticles(newSelected);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Link 
                        to="/admin/wiki/articles/$articleId/edit"
                        params={{ articleId: article.id.toString() }}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {article.title}
                      </Link>
                      {article.excerpt && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(article.status)}
                  </TableCell>
                  <TableCell>
                    {article.category ? (
                      <Badge variant="outline">
                        {article.category.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">Uncategorized</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {article.author.name || article.author.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {article.readingTimeMinutes || 0} min
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {formatDate(article.updatedAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{article.viewCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link 
                            to="/admin/wiki/articles/$articleId/edit"
                            params={{ articleId: article.id.toString() }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}