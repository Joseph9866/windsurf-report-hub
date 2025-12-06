import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feedbackSchema, FeedbackFormData } from "@/lib/validations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Bug, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const feedbackCategories = [
  "General",
  "Product Suggestion",
  "User Experience",
  "Documentation",
  "Support",
  "Other",
];

export default function Feedback() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { theme, setTheme } = useTheme();

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      subject: "",
      feedback_text: "",
      category: "",
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("feedback_entries")
        .insert({
          subject: data.subject,
          feedback_text: data.feedback_text,
          category: data.category || null,
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Feedback submitted!",
        description: "Thank you for your anonymous feedback.",
      });
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

  const handleSubmitAnother = () => {
    setIsSubmitted(false);
    form.reset();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Bug className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">IssueTrack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-xl mx-auto animate-fade-in">
          {/* Privacy Notice */}
          <div className="flex items-center gap-3 p-4 mb-8 rounded-lg bg-accent/10 border border-accent/20">
            <ShieldCheck className="h-5 w-5 text-accent flex-shrink-0" />
            <p className="text-sm text-foreground">
              <strong>100% Anonymous</strong> — No login required. We don't track your identity.
            </p>
          </div>

          {isSubmitted ? (
            <Card className="glass-card text-center">
              <CardContent className="pt-12 pb-8">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-6">
                  Your anonymous feedback has been submitted successfully.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleSubmitAnother} variant="outline">
                    Submit Another
                  </Button>
                  <Button asChild>
                    <Link to="/">Return Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>Anonymous Feedback</CardTitle>
                    <CardDescription>Share your thoughts without revealing your identity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="What's this feedback about?"
                      {...form.register("subject")}
                    />
                    {form.formState.errors.subject && (
                      <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Category (optional)</Label>
                    <Select onValueChange={(value) => form.setValue("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {feedbackCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Feedback Text */}
                  <div className="space-y-2">
                    <Label htmlFor="feedback_text">Your Feedback *</Label>
                    <Textarea
                      id="feedback_text"
                      placeholder="Share your thoughts, suggestions, or concerns..."
                      rows={6}
                      {...form.register("feedback_text")}
                    />
                    {form.formState.errors.feedback_text && (
                      <p className="text-sm text-destructive">{form.formState.errors.feedback_text.message}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Feedback"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Have an account?{" "}
            <Link to="/auth" className="text-primary hover:underline">
              Sign in to submit tracked issues
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}