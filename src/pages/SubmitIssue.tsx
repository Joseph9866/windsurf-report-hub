import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { issueSchema, IssueFormData } from "@/lib/validations";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Bug, Upload, X, Loader2 } from "lucide-react";

const categories = [
  { value: "bug", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "performance", label: "Performance Issue" },
  { value: "security", label: "Security Concern" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "low", label: "Low", description: "Minor issue, can wait" },
  { value: "medium", label: "Medium", description: "Should be addressed soon" },
  { value: "high", label: "High", description: "Needs prompt attention" },
  { value: "critical", label: "Critical", description: "Urgent, blocking issue" },
];

export default function SubmitIssue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);

  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
      affected_system: "",
      priority: undefined,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });
      setAttachments(prev => [...prev, ...validFiles].slice(0, 5));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (): Promise<string[]> => {
    if (!user || attachments.length === 0) return [];
    
    setUploadProgress(true);
    const urls: string[] = [];

    for (const file of attachments) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("issue-attachments")
        .upload(fileName, file);

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from("issue-attachments")
          .getPublicUrl(fileName);
        urls.push(publicUrl);
      }
    }

    setUploadProgress(false);
    return urls;
  };

  const onSubmit = async (data: IssueFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const attachmentUrls = await uploadAttachments();

      const { data: issue, error } = await supabase
        .from("technical_issues")
        .insert([{
          user_id: user.id,
          title: data.title,
          description: data.description,
          category: data.category,
          affected_system: data.affected_system || null,
          priority: data.priority,
          attachment_urls: attachmentUrls,
        }])
        .select("tracking_number")
        .single();

      if (error) throw error;

      toast({
        title: "Issue submitted!",
        description: `Tracking number: ${issue.tracking_number}`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Submit an Issue</h1>
          <p className="text-muted-foreground mt-1">Report a bug, request a feature, or flag a concern</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bug className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Issue Details</CardTitle>
                <CardDescription>Provide as much detail as possible</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of the issue"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              {/* Category & Priority */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select onValueChange={(value: any) => form.setValue("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Select onValueChange={(value: any) => form.setValue("priority", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((pri) => (
                        <SelectItem key={pri.value} value={pri.value}>
                          <div className="flex flex-col">
                            <span>{pri.label}</span>
                            <span className="text-xs text-muted-foreground">{pri.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.priority && (
                    <p className="text-sm text-destructive">{form.formState.errors.priority.message}</p>
                  )}
                </div>
              </div>

              {/* Affected System */}
              <div className="space-y-2">
                <Label htmlFor="affected_system">Affected System (optional)</Label>
                <Input
                  id="affected_system"
                  placeholder="e.g., Dashboard, API, Mobile App"
                  {...form.register("affected_system")}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail. Include steps to reproduce, expected behavior, and actual behavior."
                  rows={6}
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label>Attachments (optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    accept="image/*,.pdf,.txt,.log"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="attachments" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, PDF, TXT up to 10MB (max 5 files)
                    </p>
                  </label>
                </div>
                
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || uploadProgress}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadProgress ? "Uploading files..." : "Submitting..."}
                  </>
                ) : (
                  "Submit Issue"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}