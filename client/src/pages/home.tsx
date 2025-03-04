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
  description: string;
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
    description: "Select the language you're most comfortable learning in",
    render: ({ setValue, onNext }) => (
      <Select
        name="language"
        onValueChange={(value) => {
          setValue("preferences.language", value);
          onNext();
        }}
      >
        <SelectTrigger className="mt-4 text-lg">
          <SelectValue placeholder="Select your preferred language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">🇬🇧 English</SelectItem>
          <SelectItem value="da">🇩🇰 Danish (Dansk)</SelectItem>
        </SelectContent>
      </Select>
    )
  },
  {
    text: "What would you like to learn today?",
    icon: <Book className="w-6 h-6 text-[#6F00FF]" />,
    description: "Tell us what subject or topic you want to explore",
    render: ({ subject, setSubject, onNext }) => (
      <div className="mt-4 space-y-4">
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Multiplication with 2-digit numbers"
          className="text-lg border-2 border-[#6F00FF] focus:ring-[#FF6F00]"
          aria-label="Enter what you want to learn"
        />
        <Button 
          className="w-full bg-gradient-to-r from-[#6F00FF] to-[#FF6F00] hover:opacity-90 text-lg font-medium"
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
    description: "Everyone learns differently - choose what works best for you",
    render: ({ setValue, onNext }) => (
      <div className="mt-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { value: "visual", icon: "👀", label: "By Seeing", desc: "Videos and diagrams" },
            { value: "auditory", icon: "👂", label: "By Listening", desc: "Audio explanations" },
            { value: "interactive", icon: "🎮", label: "By Doing", desc: "Interactive exercises" },
            { value: "reading", icon: "📚", label: "By Reading", desc: "Detailed text" }
          ].map(option => (
            <Button
              key={option.value}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:border-[#6F00FF] hover:bg-[#6F00FF]/5"
              onClick={() => {
                setValue("learningStyle", option.value);
                onNext();
              }}
            >
              <span className="text-2xl">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
              <span className="text-sm text-muted-foreground">{option.desc}</span>
            </Button>
          ))}
        </div>
      </div>
    )
  },
  {
    text: "How would you like to show what you've learned?",
    icon: <PenTool className="w-6 h-6 text-[#6F00FF]" />,
    description: "Choose how you'd like to demonstrate your understanding",
    render: ({ setValue, onNext }) => (
      <div className="mt-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { value: "quiz", icon: "✅", label: "Quizzes", desc: "Test your knowledge" },
            { value: "project", icon: "🎨", label: "Projects", desc: "Create something new" },
            { value: "discussion", icon: "💭", label: "Discussion", desc: "Talk about what you learned" },
            { value: "writing", icon: "✍️", label: "Writing", desc: "Express through words" }
          ].map(option => (
            <Button
              key={option.value}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:border-[#6F00FF] hover:bg-[#6F00FF]/5"
              onClick={() => {
                setValue("preferredDemonstration", option.value);
                onNext();
              }}
            >
              <span className="text-2xl">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
              <span className="text-sm text-muted-foreground">{option.desc}</span>
            </Button>
          ))}
        </div>
      </div>
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
  const progress = ((step + 1) / (questions.length + 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
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
          <p className="text-xl text-muted-foreground">
            Let's make learning fun and exciting! 🚀
          </p>
        </div>

        <Card className="border-2 border-[#6F00FF]/20">
          <CardContent className="pt-6">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#6F00FF] to-[#FF6F00]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Step {step + 1} of {questions.length + 1}
              </p>
            </div>

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
                      <div className="flex flex-col gap-3 p-4 bg-gradient-to-r from-[#6F00FF]/10 to-[#FF6F00]/10 rounded-lg">
                        <div className="flex items-center gap-3">
                          {currentQuestion.icon}
                          <h2 className="text-2xl font-medium">{currentQuestion.text}</h2>
                        </div>
                        <p className="text-muted-foreground ml-9">
                          {currentQuestion.description}
                        </p>
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
                    className="mt-6 space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-[#FF6F00]" />
                        <h2 className="text-2xl font-medium">Accessibility Options</h2>
                      </div>
                      <div className="space-y-4 p-6 bg-gradient-to-r from-[#6F00FF]/10 to-[#FF6F00]/10 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="highContrast" className="text-lg">High Contrast Mode</Label>
                          <p className="text-sm text-muted-foreground">Makes text and elements easier to see</p>
                          <Switch
                            id="highContrast"
                            onCheckedChange={(checked) => 
                              form.setValue("preferences.highContrast", checked)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="voiceEnabled" className="text-lg">Voice Assistance</Label>
                          <p className="text-sm text-muted-foreground">Enables audio feedback and instructions</p>
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
                      className="w-full bg-gradient-to-r from-[#6F00FF] to-[#FF6F00] hover:opacity-90 text-white font-medium text-xl h-14"
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