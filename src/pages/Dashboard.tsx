import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { Bug, MessageSquare, CheckCircle, Clock, Plus, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Issue {
  id: string;
  title: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  tracking_number: string;
  created_at: string;
}

interface Stats {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<Stats>({ totalIssues: 0, openIssues: 0, resolvedIssues: 0, inProgressIssues: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: issuesData } = await supabase
        .from("technical_issues")
        .select("id, title, status, priority, tracking_number, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (issuesData) {
        setIssues(issuesData as Issue[]);
        
        const total = issuesData.length;
        const open = issuesData.filter(i => i.status === "new").length;
        const resolved = issuesData.filter(i => i.status === "resolved" || i.status === "closed").length;
        const inProgress = issuesData.filter(i => i.status === "in_progress").length;
        
        // Get full count for stats
        const { count } = await supabase
          .from("technical_issues")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setStats({
          totalIssues: count || total,
          openIssues: open,
          resolvedIssues: resolved,
          inProgressIssues: inProgress,
        });
      }

      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: "Total Issues", value: stats.totalIssues, icon: Bug, color: "text-primary" },
    { label: "Open", value: stats.openIssues, icon: Clock, color: "text-status-new" },
    { label: "In Progress", value: stats.inProgressIssues, icon: Clock, color: "text-status-in-progress" },
    { label: "Resolved", value: stats.resolvedIssues, icon: CheckCircle, color: "text-status-resolved" },
  ];

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your issues and feedback submissions</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/feedback">
                <MessageSquare className="mr-2 h-4 w-4" />
                Submit Feedback
              </Link>
            </Button>
            <Button asChild>
              <Link to="/submit-issue">
                <Plus className="mr-2 h-4 w-4" />
                New Issue
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-card group hover:border-primary/50 transition-colors cursor-pointer">
            <Link to="/submit-issue">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bug className="h-6 w-6 text-primary" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="mt-4">Report a Technical Issue</CardTitle>
                <CardDescription>
                  Submit a bug report, feature request, or performance issue with full tracking
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="glass-card group hover:border-accent/50 transition-colors cursor-pointer">
            <Link to="/feedback">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-accent" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <CardTitle className="mt-4">Anonymous Feedback</CardTitle>
                <CardDescription>
                  Share feedback without revealing your identity. No login required.
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Recent Issues */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Issues</CardTitle>
              <CardDescription>Your latest submitted issues</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/my-issues">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bug className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No issues submitted yet</p>
                <Button asChild variant="link" className="mt-2">
                  <Link to="/submit-issue">Submit your first issue</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs text-muted-foreground font-mono">
                          {issue.tracking_number}
                        </code>
                        <StatusBadge status={issue.status} />
                      </div>
                      <p className="font-medium text-foreground truncate">{issue.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <PriorityBadge priority={issue.priority} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}