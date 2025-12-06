import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { toast } from "@/hooks/use-toast";
import { 
  Bug, 
  MessageSquare, 
  Search, 
  Filter, 
  Download,
  Trash2,
  Eye,
  StickyNote,
  RefreshCw,
  Users
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  affected_system: string | null;
  tracking_number: string;
  created_at: string;
  user_id: string;
  attachment_urls: string[];
}

interface FeedbackEntry {
  id: string;
  subject: string;
  feedback_text: string;
  category: string | null;
  status: "new" | "in_progress" | "resolved" | "closed";
  created_at: string;
}

interface IssueNote {
  id: string;
  note_text: string;
  created_at: string;
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const [notes, setNotes] = useState<IssueNote[]>([]);
  const [newNote, setNewNote] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    
    const [issuesRes, feedbackRes] = await Promise.all([
      supabase
        .from("technical_issues")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("feedback_entries")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (issuesRes.data) setIssues(issuesRes.data as Issue[]);
    if (feedbackRes.data) setFeedback(feedbackRes.data as FeedbackEntry[]);
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchNotes = async (issueId: string) => {
    const { data } = await supabase
      .from("issue_notes")
      .select("*")
      .eq("issue_id", issueId)
      .order("created_at", { ascending: false });
    
    if (data) setNotes(data);
  };

  const updateIssueStatus = async (issueId: string, newStatus: "new" | "in_progress" | "resolved" | "closed") => {
    const { error } = await supabase
      .from("technical_issues")
      .update({ status: newStatus })
      .eq("id", issueId);

    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    } else {
      toast({ title: "Status updated" });
      fetchData();
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: "new" | "in_progress" | "resolved" | "closed") => {
    const { error } = await supabase
      .from("feedback_entries")
      .update({ status: newStatus })
      .eq("id", feedbackId);

    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    } else {
      toast({ title: "Status updated" });
      fetchData();
    }
  };

  const addNote = async () => {
    if (!selectedIssue || !newNote.trim()) return;

    const { error } = await supabase
      .from("issue_notes")
      .insert({
        issue_id: selectedIssue.id,
        note_text: newNote,
      });

    if (error) {
      toast({ title: "Error adding note", variant: "destructive" });
    } else {
      toast({ title: "Note added" });
      setNewNote("");
      fetchNotes(selectedIssue.id);
    }
  };

  const deleteIssue = async (issueId: string) => {
    const { error } = await supabase
      .from("technical_issues")
      .delete()
      .eq("id", issueId);

    if (error) {
      toast({ title: "Error deleting issue", variant: "destructive" });
    } else {
      toast({ title: "Issue deleted" });
      setSelectedIssue(null);
      fetchData();
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    const { error } = await supabase
      .from("feedback_entries")
      .delete()
      .eq("id", feedbackId);

    if (error) {
      toast({ title: "Error deleting feedback", variant: "destructive" });
    } else {
      toast({ title: "Feedback deleted" });
      setSelectedFeedback(null);
      fetchData();
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map(item => 
      Object.values(item).map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.tracking_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFeedback = feedback.filter(fb => {
    const matchesSearch = fb.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || fb.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="glass-card max-w-md text-center p-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have admin permissions to view this page.</p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Manage issues and feedback submissions</p>
          </div>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Bug className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{issues.length}</p>
                  <p className="text-sm text-muted-foreground">Total Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{feedback.length}</p>
                  <p className="text-sm text-muted-foreground">Feedback</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-status-new/20 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-status-new" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {issues.filter(i => i.status === "new").length + feedback.filter(f => f.status === "new").length}
                  </p>
                  <p className="text-sm text-muted-foreground">New</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-status-resolved/20 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-status-resolved" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {issues.filter(i => i.status === "resolved").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or tracking number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList>
            <TabsTrigger value="issues" className="gap-2">
              <Bug className="h-4 w-4" />
              Issues ({filteredIssues.length})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback ({filteredFeedback.length})
            </TabsTrigger>
          </TabsList>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportToCSV(issues, "issues")}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredIssues.length === 0 ? (
              <Card className="glass-card text-center py-12">
                <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No issues found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredIssues.map((issue) => (
                  <Card key={issue.id} className="glass-card hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-xs font-mono text-muted-foreground">
                              {issue.tracking_number}
                            </code>
                            <StatusBadge status={issue.status} />
                            <PriorityBadge priority={issue.priority} />
                          </div>
                          <h3 className="font-medium text-foreground truncate">{issue.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {issue.category} • {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={issue.status}
                            onValueChange={(value) => updateIssueStatus(issue.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  fetchNotes(issue.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <code className="text-sm font-mono text-muted-foreground">
                                    {issue.tracking_number}
                                  </code>
                                  {issue.title}
                                </DialogTitle>
                                <DialogDescription>
                                  {issue.category} • {issue.affected_system || "No system specified"}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 mt-4">
                                <div className="flex gap-2">
                                  <StatusBadge status={issue.status} />
                                  <PriorityBadge priority={issue.priority} />
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Description</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {issue.description}
                                  </p>
                                </div>

                                {issue.attachment_urls?.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Attachments</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {issue.attachment_urls.map((url, i) => (
                                        <a
                                          key={i}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-primary hover:underline"
                                        >
                                          Attachment {i + 1}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Notes */}
                                <div>
                                  <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <StickyNote className="h-4 w-4" />
                                    Internal Notes
                                  </h4>
                                  <div className="space-y-2 mb-3">
                                    {notes.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">No notes yet</p>
                                    ) : (
                                      notes.map((note) => (
                                        <div key={note.id} className="p-3 bg-muted rounded-lg">
                                          <p className="text-sm">{note.note_text}</p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                                          </p>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Textarea
                                      placeholder="Add a note..."
                                      value={newNote}
                                      onChange={(e) => setNewNote(e.target.value)}
                                      rows={2}
                                    />
                                    <Button onClick={addNote} disabled={!newNote.trim()}>
                                      Add
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteIssue(issue.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Issue
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportToCSV(feedback, "feedback")}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredFeedback.length === 0 ? (
              <Card className="glass-card text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No feedback found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredFeedback.map((fb) => (
                  <Card key={fb.id} className="glass-card hover:border-accent/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={fb.status} />
                            {fb.category && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                {fb.category}
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-foreground">{fb.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {fb.feedback_text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(fb.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={fb.status}
                            onValueChange={(value) => updateFeedbackStatus(fb.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedFeedback(fb)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{fb.subject}</DialogTitle>
                                <DialogDescription>
                                  {fb.category || "Uncategorized"} • Anonymous Feedback
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 mt-4">
                                <StatusBadge status={fb.status} />
                                
                                <div>
                                  <h4 className="font-medium mb-2">Feedback</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {fb.feedback_text}
                                  </p>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                  Submitted {format(new Date(fb.created_at), "PPpp")}
                                </p>

                                <div className="flex justify-end pt-4 border-t">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteFeedback(fb.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Feedback
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}