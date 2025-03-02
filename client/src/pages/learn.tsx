import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LearningProfile, LearningSession } from "@shared/schema";

export default function Learn() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [feedback, setFeedback] = useState("");

  const profileQuery = useQuery<LearningProfile>({
    queryKey: [`/api/profiles/${params.id}`],
  });

  const sessionsQuery = useQuery<LearningSession[]>({
    queryKey: [`/api/sessions/profile/${params.id}`],
  });

  const sessionMutation = useMutation({
    mutationFn: async (data: { subject: string }) => {
      const res = await apiRequest("POST", "/api/sessions", {
        profileId: parseInt(params.id),
        subject: data.subject,
        content: {
          learningStyle: profileQuery.data?.learningStyle,
          specialNeeds: profileQuery.data?.specialNeeds
        }
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Learning Session Created",
        description: "Content has been generated based on your preferences.",
      });
      sessionsQuery.refetch();
      setSubject("");
    }
  });

  const feedbackMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/feedback`, {
        feedback
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      setFeedback("");
      sessionsQuery.refetch();
    }
  });

  if (profileQuery.isLoading) {
    return <div className="p-8">Loading profile...</div>;
  }

  if (!profileQuery.data) {
    return <div className="p-8">Profile not found</div>;
  }

  const sessions = sessionsQuery.data || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Learning style: {profileQuery.data.learningStyle}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What would you like to learn today?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter a subject (e.g., 'Multiplication with 2-digit numbers')"
              />
              <Button
                onClick={() => sessionMutation.mutate({ subject })}
                disabled={sessionMutation.isPending}
              >
                Start Learning
              </Button>
            </div>
          </CardContent>
        </Card>

        {sessions.map((session) => (
          <Card key={session.id} className="mt-4">
            <CardHeader>
              <CardTitle>{session.subject}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="content">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="quiz">Quiz</TabsTrigger>
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                  <TabsTrigger value="activities">Activities</TabsTrigger>
                </TabsList>

                <TabsContent value="content">
                  <div className="prose max-w-none">
                    {(session.content as any).text}
                  </div>
                </TabsContent>

                <TabsContent value="quiz">
                  {(session.content as any).quiz?.map((q: any, i: number) => (
                    <div key={i} className="mb-4">
                      <p className="font-medium mb-2">{q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((option: string, j: number) => (
                          <Button
                            key={j}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              if (j === q.correctAnswer) {
                                toast({
                                  title: "Correct!",
                                  description: "Well done!",
                                });
                              } else {
                                toast({
                                  title: "Try Again",
                                  description: "That's not quite right.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="videos">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(session.content as any).videos?.map((video: any) => (
                      <div key={video.id} className="aspect-video">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${video.id}`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        <p className="mt-2 text-sm font-medium">{video.title}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="activities">
                  <ul className="list-disc pl-6 space-y-2">
                    {(session.content as any).suggestions?.map((suggestion: string, i: number) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>

              {!session.completed && (
                <div className="mt-6 space-y-4">
                  <Textarea
                    placeholder="Share your thoughts on this lesson..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <Button
                    onClick={() => feedbackMutation.mutate(session.id)}
                    disabled={feedbackMutation.isPending}
                  >
                    Submit Feedback
                  </Button>
                </div>
              )}

              {session.feedback && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium">AI Feedback:</p>
                  <p>{session.feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}