import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FolderTree, Tags, TrendingUp, Plus, Search, Filter } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/admin/wiki/")({
  component: WikiDashboard,
});

function WikiDashboard() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Ready for students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Organization topics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for content management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/wiki/articles/new">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Article
              </Button>
            </Link>
            <Link to="/admin/wiki/articles">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Search className="mr-2 h-4 w-4" />
                Browse All Articles
              </Button>
            </Link>
            <Link to="/admin/wiki/categories">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FolderTree className="mr-2 h-4 w-4" />
                Manage Categories
              </Button>
            </Link>
            <Link to="/admin/wiki/tags">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Tags className="mr-2 h-4 w-4" />
                Manage Tags
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest changes to wiki content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">No recent activity</p>
                  <p className="text-xs text-muted-foreground">
                    Create your first article to see activity here
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Content Status Overview</CardTitle>
          <CardDescription>
            Current state of your knowledge base content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Draft: 0</Badge>
            <Badge variant="default">Published: 0</Badge>
            <Badge variant="outline">Archived: 0</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Start by creating your first educational article about medical waste disposal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}