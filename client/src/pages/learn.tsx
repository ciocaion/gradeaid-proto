import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LearningProfile, LearningSession } from "@shared/schema";
import { LearningGame } from "@/components/LearningGame";
import { AIAvatar } from "@/components/AIAvatar";
import { ActivityUpload } from "@/components/ActivityUpload";
import { TextToSpeech } from "@/components/TextToSpeech";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Star, CheckCircle2 } from "lucide-react";

export default function Learn() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);

  const profileQuery = useQuery<LearningProfile>({
    queryKey: [`/api/profiles/${params.id}`],
  });

  const sessionsQuery = useQuery<LearningSession[]>({
    queryKey: [`/api/sessions/profile/${params.id}`],
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

  // Ensure useEffect is called unconditionally
  useEffect(() => {
    if (sessionsQuery.isSuccess) {
      const currentSession = sessionsQuery.data[0];
      // Perform any content generation logic here
      // For example, set initial content or state based on currentSession
    }
  }, [sessionsQuery.isSuccess]);

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const goToNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  // Add event listener for custom event
  useEffect(() => {
    const handleFeedbackReceived = () => {
      handleStepComplete(2); // Practice is step 2
    };

    window.addEventListener('feedbackReceived', handleFeedbackReceived);
    return () => window.removeEventListener('feedbackReceived', handleFeedbackReceived);
  }, []);

  const handleQuizAnswer = (questionIndex: number, answerIndex: number, correctAnswer: number) => {
    setQuizAnswers([...quizAnswers, answerIndex]);
    
    if (answerIndex === correctAnswer) {
      toast({
        title: "Correct! 🎉",
        description: "Great job! Click Next to continue!",
      });
      handleStepComplete(1); // Quiz is step 1
    } else {
      toast({
        title: "Try Again",
        description: "That's not quite right. Give it another try!",
        variant: "destructive",
      });
    }
  };

  const sessions = sessionsQuery.data || [];
  const currentSession = sessions[0]; // We'll focus on the most recent session

  if (!currentSession) return null;

  const content = currentSession.content as any;
  
  const emojiList = [
    { emoji: "😊", label: "Happy" },        // Positive
    { emoji: "🎉", label: "Celebration" },  // Positive
    { emoji: "👍", label: "Good Job" },      // Positive
    { emoji: "😕", label: "Confused" },      // Negative
    { emoji: "👎", label: "Not Good" },      // Negative
  ];

  const steps = [
    {
      title: "Introduction",
      content: (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="prose">
              {content.text}
            </div>
            <TextToSpeech text={content.text} />
          </div>
          <Button 
            onClick={() => handleStepComplete(0)}
            className="w-full"
          >
            I understand!
          </Button>
          {completedSteps.includes(0) && (
            <Button 
              onClick={goToNextStep}
              className="w-full"
              variant="secondary"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )
    },
    {
      title: "Quick Quiz",
      content: (
        <div className="space-y-4">
          {content.quiz.map((q: any, i: number) => (
            <div key={i} className="space-y-2">
              <p className="font-medium">{q.question}</p>
              <div className="grid gap-2">
                {q.options.map((option: string, j: number) => (
                  <Button
                    key={j}
                    variant={quizAnswers[i] === j ? "secondary" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleQuizAnswer(i, j, q.correctAnswer)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              {quizAnswers[i] === q.correctAnswer && (
                <p className="text-sm text-muted-foreground">{q.explanation}</p>
              )}
            </div>
          ))}
          {completedSteps.includes(1) && (
            <Button 
              onClick={goToNextStep}
              className="w-full mt-4"
              variant="secondary"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )
    },
    {
      title: "Practice",
      content: (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">{content.practice.description}</h3>
              <ol className="list-decimal list-inside space-y-2">
                {content.practice.steps.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <div className="mt-6">
                <ActivityUpload subject={currentSession.topic} />
              </div>
            </CardContent>
          </Card>
          {completedSteps.includes(2) && (
            <Button 
              onClick={goToNextStep}
              className="w-full mt-4"
              variant="secondary"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )
    },
    {
      title: "Game Time",
      content: (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {!content?.game ? (
                <div className="text-center text-muted-foreground p-4">
                  No game available for this lesson.
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-medium mb-4">{content.game.title || 'Learning Game'}</h3>
                  <p className="mb-4">{content.game.description || 'Practice what you learned in this interactive game!'}</p>
                  <div className="aspect-square max-w-xl mx-auto">
                    <LearningGame 
                      game={content.game}
                      onComplete={() => handleStepComplete(3)}
                    />
                  </div>
                  {completedSteps.includes(3) && (
                    <Button 
                      onClick={goToNextStep}
                      className="w-full mt-4"
                      variant="secondary"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Video Examples",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.videos?.map((video: any) => (
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
          <div className="col-span-full space-y-4">
            <Button 
              onClick={() => handleStepComplete(4)}
              className="w-full"
            >
              I've watched the videos!
            </Button>
            {completedSteps.includes(4) && (
              <Button 
                onClick={goToNextStep}
                className="w-full"
                variant="secondary"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )
    },
    {
      title: "Thank You!",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Thank You for Participating! 🎉</h2>
          <p>We hope you enjoyed the learning experience! Your feedback is valuable to us.</p>
          <div className="flex flex-wrap gap-4">
            {emojiList.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <Button
                  onClick={() => {
                    toast({
                      title: "Feedback Received!",
                      description: `You selected: ${item.emoji}`,
                      duration: 3000,
                    });
                  }}
                  className="text-2xl"
                >
                  {item.emoji}
                </Button>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
          <Button
            onClick={() => {
              toast({
                title: "Thank You!",
                description: "Your feedback is appreciated! 🎉",
                duration: 3000,
              });
            }}
          >
            Submit Feedback
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{currentSession.topic}</h2>
                <p className="text-muted-foreground">{currentSession.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      completedSteps.includes(i)
                        ? "bg-green-500"
                        : i === currentStep
                        ? "bg-blue-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-medium">{steps[currentStep].title}</h3>
                  {completedSteps.includes(currentStep) && (
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                  )}
                </div>
                {steps[currentStep].content}
              </motion.div>
            </AnimatePresence>

            {completedSteps.length === steps.length && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500 w-6 h-6" />
                  <h3 className="text-xl font-medium">Congratulations!</h3>
                </div>
                <p>You've completed all the steps! How was your learning experience?</p>
                <Textarea
                  placeholder="Share your thoughts on this lesson..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <Button
                  onClick={() => feedbackMutation.mutate(currentSession.id)}
                  disabled={feedbackMutation.isPending}
                >
                  Submit Feedback
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}