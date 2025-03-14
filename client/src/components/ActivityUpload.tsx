import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ActivityUploadProps {
  subject: string;
}

export function ActivityUpload({ subject }: ActivityUploadProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!image) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('subject', subject);

      const response = await fetch('/api/activities/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      toast({
        title: "Great work! 🌟",
        description: data.feedback,
        duration: 5000
      });
      // Dispatch event when feedback is received
      window.dispatchEvent(new Event('feedbackReceived'));
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Oops!",
        description: error instanceof Error ? error.message : "I had trouble analyzing your work. Could you try uploading a clearer picture?",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Share Your Work! 📸</h3>
        <p className="text-muted-foreground">
          Take a picture of your completed activity and get friendly AI feedback!
        </p>
      </div>

      <Card className="border-2 border-dashed">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col items-center justify-center">
            <Label
              htmlFor="image-upload"
              className="w-full cursor-pointer"
            >
              <div className="flex flex-col items-center gap-4 p-6">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground text-center">
                      Click to upload a picture of your work
                    </p>
                  </>
                )}
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </Label>

            {preview && (
              <Button
                className="mt-4"
                onClick={handleUpload}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Get Feedback
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
