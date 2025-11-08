import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chatbotService } from '@/services/chatbotService';
import { useToast } from '@/hooks/use-toast';
import { Brain, Send } from 'lucide-react';

export default function Chatbot() {
  const [courseId, setCourseId] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !question) {
      toast({
        title: 'Please select a course and enter a question',
        variant: 'destructive',
      });
      return;
    }

    const userMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await chatbotService.askQuestion(courseId, question);
      const botMessage = { role: 'assistant', content: response.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-accent" />
              AI Study Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course1">Sample Course 1</SelectItem>
                  <SelectItem value="course2">Sample Course 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-h-[400px] max-h-[500px] overflow-y-auto space-y-4 p-4 border border-border rounded-lg bg-muted/20">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <div>
                    <Brain className="h-12 w-12 mx-auto mb-4 text-accent" />
                    <p>Ask me anything about your course!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border p-4 rounded-lg">
                    <div className="flex gap-2">
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-100"></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleAsk} className="flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !courseId}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
