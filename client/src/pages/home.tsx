import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertLearningProfileSchema, type InsertLearningProfile } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Book, MessageSquare, PenTool } from "lucide-react";

type Question = {
  text: string;
  icon: JSX.Element;
  render: (props: {
    subject: string;
    setSubject: (value: string) => void;
    setValue: (field: string, value: any) => void;
    onNext: () => void;
  }) => JSX.Element;
};

const questions: Question[] = [
  {
    text: "Choose your preferred language",
    icon: <MessageSquare className="w-6 h-6 text-[#FF6F00]" />,
    render: ({ setValue, onNext }) => (
      <Select
        name="language"
        onValueChange={(value) => {
          setValue("preferences.language", value);
          onNext();
        }}
      >
        <SelectTrigger className="mt-4">
          <SelectValue placeholder="Select your preferred language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="da">Danish (Dansk)</SelectItem>
        </SelectContent>
      </Select>
    )
  },
  {
    text: "What would you like to learn today?",
    icon: <Book className="w-6 h-6 text-[#6F00FF]" />,
    render: ({ subject, setSubject, onNext }) => (
      <div className="mt-4">
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Multiplication with 2-digit numbers"
          className="text-lg border-2 border-[#6F00FF] focus:ring-[#FF6F00]"
        />
        <Button 
          className="mt-4 w-full bg-gradient-to-r from-[#6F00FF] to-[#FF6F00] hover:opacity-90"
          onClick={() => subject.trim() && onNext()}
        >
          Let's Start Learning! ✨
        </Button>
      </div>
    )
  },
  {
    text: "How do you prefer to learn?",
    icon: <Brain className="w-6 h-6 text-[#FF6F00]" />,
    render: ({ setValue, onNext }) => (
      <Select
        name="learningStyle"
        onValueChange={(value) => {
          setValue("learningStyle", value);
          onNext();
        }}
      >
        <SelectTrigger className="mt-4">
          <SelectValue placeholder="Select your learning style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="visual">👀 I learn best by seeing (videos and diagrams)</SelectItem>
          <SelectItem value="auditory">👂 I learn best by listening (audio explanations)</SelectItem>
          <SelectItem value="interactive">🎮 I learn best by doing (interactive exercises)</SelectItem>
          <SelectItem value="reading">📚 I learn best by reading (detailed text)</SelectItem>
        </SelectContent>
      </Select>
    )
  },
  {
    text: "How would you like to show what you've learned?",
    icon: <PenTool className="w-6 h-6 text-[#6F00FF]" />,
    render: ({ setValue, onNext }) => (
      <Select
        name="preferredDemonstration"
        onValueChange={(value) => {
          setValue("preferredDemonstration", value);
          onNext();
        }}
      >
        <SelectTrigger className="mt-4">
          <SelectValue placeholder="Select how you want to demonstrate" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="quiz">✅ Through quizzes and tests</SelectItem>
          <SelectItem value="project">🎨 By creating my own projects</SelectItem>
          <SelectItem value="discussion">💭 By discussing and explaining</SelectItem>
          <SelectItem value="writing">✍️ By writing essays or summaries</SelectItem>
        </SelectContent>
      </Select>
    )
  }
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState("");

  const form = useForm<InsertLearningProfile>({
    resolver: zodResolver(insertLearningProfileSchema),
    defaultValues: {
      learningStyle: "visual",
      preferredDemonstration: "quiz",
      preferences: {
        textSize: "medium",
        highContrast: false,
        voiceEnabled: false,
        language: "en"
      }
    }
  });

  const profileMutation = useMutation({
    mutationFn: async (data: InsertLearningProfile) => {
      const profileRes = await apiRequest("POST", "/api/profiles", data);
      const profile = await profileRes.json();

      const sessionRes = await apiRequest("POST", "/api/sessions", {
        profileId: profile.id,
        subject,
        content: {
          learningStyle: data.learningStyle,
          preferredDemonstration: data.preferredDemonstration,
          preferences: data.preferences
        }
      });
      await sessionRes.json();

      return profile;
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Ready to Learn!",
        description: "Your personalized learning adventure is about to begin!",
      });
      setLocation(`/learn/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Oops!",
        description: "Something went wrong. Let's try again!",
        variant: "destructive"
      });
    }
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, questions.length));
  const currentQuestion = questions[step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-[#6F00FF] to-[#FF6F00] bg-clip-text text-transparent">
              Welcome to GradeAid!
            </span>
          </motion.h1>
          <p className="text-lg text-muted-foreground">
            Let's make learning fun and exciting! 🚀
          </p>
        </div>

        <Card className="border-2 border-[#6F00FF]/20">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => profileMutation.mutate(data))}>
                <AnimatePresence mode="wait">
                  {currentQuestion && (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#6F00FF]/10 to-[#FF6F00]/10 rounded-lg">
                        {currentQuestion.icon}
                        <p className="text-xl font-medium">{currentQuestion.text}</p>
                      </div>
                      {currentQuestion.render({
                        subject,
                        setSubject,
                        setValue: form.setValue,
                        onNext: nextStep
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {step === questions.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="space-y-4">
                      <Label className="text-lg font-medium">Accessibility Options</Label>
                      <div className="space-y-3 p-4 bg-gradient-to-r from-[#6F00FF]/10 to-[#FF6F00]/10 rounded-lg">
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

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-[#6F00FF] to-[#FF6F00] hover:opacity-90 text-white font-medium text-lg h-12"
                      disabled={profileMutation.isPending}
                    >
                      {profileMutation.isPending ? "🌟 Preparing Your Adventure..." : "🚀 Start Learning!"}
                    </Button>
                  </motion.div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}