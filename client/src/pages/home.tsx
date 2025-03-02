import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertLearningProfileSchema, type InsertLearningProfile } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<InsertLearningProfile>({
    resolver: zodResolver(insertLearningProfileSchema),
    defaultValues: {
      learningStyle: "visual",
      preferredDemonstration: "quiz",
      preferences: {
        textSize: "medium",
        highContrast: false,
        voiceEnabled: false
      }
    }
  });

  const profileMutation = useMutation({
    mutationFn: async (data: InsertLearningProfile) => {
      const res = await apiRequest("POST", "/api/profiles", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Created!",
        description: "Let's start learning!",
      });
      setLocation(`/learn/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Welcome to GradeAid
          </h1>
          <p className="text-muted-foreground">
            Your personalized AI learning assistant
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Let's personalize your learning experience</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => profileMutation.mutate(data))} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>How do you prefer to learn?</Label>
                    <Select
                      name="learningStyle"
                      onValueChange={(value) => form.setValue("learningStyle", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select learning style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visual">Visual</SelectItem>
                        <SelectItem value="auditory">Auditory</SelectItem>
                        <SelectItem value="interactive">Interactive</SelectItem>
                        <SelectItem value="reading">Reading/Writing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>How would you like to demonstrate your learning?</Label>
                    <Select
                      name="preferredDemonstration"
                      onValueChange={(value) => form.setValue("preferredDemonstration", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select demonstration method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quizzes</SelectItem>
                        <SelectItem value="project">Projects</SelectItem>
                        <SelectItem value="discussion">Discussion</SelectItem>
                        <SelectItem value="writing">Writing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Any special needs or requirements?</Label>
                    <Input 
                      placeholder="E.g., 'I need step-by-step instructions'" 
                      {...form.register("specialNeeds")}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Accessibility Preferences</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="highContrast">High Contrast Mode</Label>
                        <Switch
                          id="highContrast"
                          onCheckedChange={(checked) => 
                            form.setValue("preferences.highContrast", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="voiceEnabled">Voice Assistance</Label>
                        <Switch
                          id="voiceEnabled"
                          onCheckedChange={(checked) => 
                            form.setValue("preferences.voiceEnabled", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={profileMutation.isPending}
                >
                  {profileMutation.isPending ? "Creating Profile..." : "Start Learning"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}