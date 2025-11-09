import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { quizService } from '@/services/quizService';
import { chatbotService } from '@/services/chatbotService';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Clock,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Play,
  Edit,
  Trash2,
  Send,
  Sparkles,
  Trophy,
  Medal,
  Award,
} from 'lucide-react';

interface Question {
  questionText: string;
  questionType: 'mcq_single' | 'mcq_multiple' | 'numerical';
  options?: string[];
  correctAnswer?: string | number;
  correctAnswers?: string[];
  points: number;
  explanation?: string;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  questions: Question[];
  totalPoints: number;
  timeLimit?: number;
  isPublished: boolean;
  showResults: boolean;
  createdAt: string;
  attempt?: {
    _id: string;
    totalScore: number;
    percentage: number;
    submittedAt: string;
    isGraded: boolean;
  } | null;
}

interface QuizzesTabProps {
  courseId: string;
}

export default function QuizzesTab({ courseId }: QuizzesTabProps) {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAttemptDialogOpen, setIsAttemptDialogOpen] = useState(false);
  const [isLeaderboardDialogOpen, setIsLeaderboardDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const { toast } = useToast();

  const isProfessor = user?.role === 'professor' || user?.role === 'admin';

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await quizService.getQuizzes(courseId);
      setQuizzes(data);
    } catch (error: any) {
      toast({
        title: 'Error loading quizzes',
        description: error.response?.data?.message || 'Failed to load quizzes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttemptQuiz = async (quiz: Quiz) => {
    try {
      const data = await quizService.getQuiz(quiz._id);
      setSelectedQuiz(data);
      setIsAttemptDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error loading quiz',
        description: error.response?.data?.message || 'Failed to load quiz',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{isProfessor ? 'Curate Quiz' : 'Attempt Quiz'}</CardTitle>
            <CardDescription>
              {isProfessor
                ? 'Create and manage quizzes for your students'
                : 'Take quizzes and get instant results'}
            </CardDescription>
          </div>
          {isProfessor && (
            <CreateQuizDialog
              courseId={courseId}
              onSuccess={fetchQuizzes}
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isProfessor ? 'No quizzes yet. Create your first quiz!' : 'No quizzes available'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz._id}
                quiz={quiz}
                isProfessor={isProfessor}
                onAttempt={() => handleAttemptQuiz(quiz)}
                onViewStandings={() => {
                  setSelectedQuiz(quiz);
                  setIsLeaderboardDialogOpen(true);
                }}
                onPublish={async (isPublished) => {
                  try {
                    await quizService.publishQuiz(quiz._id, isPublished);
                    toast({
                      title: 'Success',
                      description: isPublished ? 'Quiz published' : 'Quiz unpublished',
                    });
                    fetchQuizzes();
                  } catch (error: any) {
                    toast({
                      title: 'Error',
                      description: error.response?.data?.message || 'Failed to update quiz',
                      variant: 'destructive',
                    });
                  }
                }}
              />
            ))}
          </div>
        )}
      </CardContent>

      {selectedQuiz && (
        <>
          <QuizAttemptDialog
            quiz={selectedQuiz}
            open={isAttemptDialogOpen}
            onOpenChange={setIsAttemptDialogOpen}
            onSuccess={fetchQuizzes}
          />
          <QuizLeaderboardDialog
            quiz={selectedQuiz}
            open={isLeaderboardDialogOpen}
            onOpenChange={setIsLeaderboardDialogOpen}
          />
        </>
      )}
    </Card>
  );
}

function QuizCard({
  quiz,
  isProfessor,
  onAttempt,
  onViewStandings,
  onPublish,
}: {
  quiz: Quiz;
  isProfessor: boolean;
  onAttempt: () => void;
  onViewStandings: () => void;
  onPublish: (isPublished: boolean) => void;
}) {
  const hasAttempted = quiz.attempt && quiz.attempt.isGraded;

  return (
    <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-lg">{quiz.title}</h4>
            {!quiz.isPublished && isProfessor && (
              <Badge variant="outline">Draft</Badge>
            )}
            {hasAttempted && !isProfessor && (
              <Badge variant="default">
                Score: {quiz.attempt?.totalScore}/{quiz.totalPoints} ({quiz.attempt?.percentage.toFixed(1)}%)
              </Badge>
            )}
          </div>
          {quiz.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {quiz.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Questions: {quiz.questions.length}</span>
            <span>Total Points: {quiz.totalPoints}</span>
            {quiz.timeLimit && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {quiz.timeLimit} min
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isProfessor && (
            <>
              <Button
                variant={quiz.isPublished ? 'outline' : 'default'}
                size="sm"
                onClick={() => onPublish(!quiz.isPublished)}
              >
                {quiz.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            </>
          )}
          {!isProfessor && (
            <>
              {!hasAttempted ? (
                <Button
                  onClick={onAttempt}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Attempt Quiz
                </Button>
              ) : (
                <Button
                  onClick={onViewStandings}
                  size="sm"
                  variant="outline"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  View Standings
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Quiz Dialog Component
function CreateQuizDialog({
  courseId,
  onSuccess,
  open,
  onOpenChange,
}: {
  courseId: string;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    timeLimit: '',
    showResults: true,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    topic: '',
    questionType: 'mcq_single' as 'mcq_single' | 'mcq_multiple' | 'numerical',
    numQuestions: 1,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });
  const { toast } = useToast();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        questionType: 'mcq_single',
        options: ['Option 1', 'Option 2'],
        correctAnswer: undefined,
        points: 1,
        explanation: '',
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = [];
    }
    const optionCount = updated[questionIndex].options.length;
    updated[questionIndex].options = [...updated[questionIndex].options, `Option ${optionCount + 1}`];
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options = updated[questionIndex].options?.filter((_, i) => i !== optionIndex);
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options[optionIndex] = value;
      setQuestions(updated);
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleGenerateQuestions = async () => {
    if (!aiFormData.topic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic for question generation',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAiGenerating(true);
      const response = await chatbotService.generateQuestions(
        aiFormData.topic,
        aiFormData.questionType,
        aiFormData.numQuestions,
        aiFormData.difficulty
      );

      if (response.questions && response.questions.length > 0) {
        // Convert AI-generated questions to our format
        const newQuestions: Question[] = response.questions.map((q: any) => ({
          questionText: q.questionText || '',
          questionType: q.questionType || aiFormData.questionType,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          correctAnswers: q.correctAnswers,
          points: q.points || 1,
          explanation: q.explanation || '',
        }));

        // Add generated questions to existing questions
        setQuestions([...questions, ...newQuestions]);
        
        toast({
          title: 'Success',
          description: `Generated ${newQuestions.length} question(s) successfully`,
        });
        
        setAiDialogOpen(false);
        setAiFormData({
          topic: '',
          questionType: 'mcq_single',
          numQuestions: 1,
          difficulty: 'medium',
        });
      } else {
        throw new Error('No questions generated');
      }
    } catch (error: any) {
      toast({
        title: 'Error generating questions',
        description: error.response?.data?.error || error.message || 'Failed to generate questions. Make sure course materials have been ingested.',
        variant: 'destructive',
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one question is required',
        variant: 'destructive',
      });
      return;
    }

    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText) {
        toast({
          title: 'Validation Error',
          description: `Question ${i + 1}: Question text is required`,
          variant: 'destructive',
        });
        return;
      }

      if (q.questionType === 'mcq_single' || q.questionType === 'mcq_multiple') {
        const validOptions = q.options?.filter(opt => opt && opt.trim() !== '') || [];
        if (validOptions.length < 2) {
          toast({
            title: 'Validation Error',
            description: `Question ${i + 1}: At least 2 non-empty options are required`,
            variant: 'destructive',
          });
          return;
        }
        if (q.questionType === 'mcq_single') {
          if (!q.correctAnswer || !validOptions.includes(q.correctAnswer)) {
            toast({
              title: 'Validation Error',
              description: `Question ${i + 1}: Please select a correct answer`,
              variant: 'destructive',
            });
            return;
          }
        } else {
          if (!q.correctAnswers || q.correctAnswers.length === 0) {
            toast({
              title: 'Validation Error',
              description: `Question ${i + 1}: At least one correct answer is required`,
              variant: 'destructive',
            });
            return;
          }
          // Validate all correct answers are in valid options
          const allValid = q.correctAnswers.every(ans => validOptions.includes(ans));
          if (!allValid) {
            toast({
              title: 'Validation Error',
              description: `Question ${i + 1}: All correct answers must be from the options`,
              variant: 'destructive',
            });
            return;
          }
        }
      } else if (q.questionType === 'numerical') {
        if (q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === '') {
          toast({
            title: 'Validation Error',
            description: `Question ${i + 1}: Correct answer is required for numerical question`,
            variant: 'destructive',
          });
          return;
        }
      }
    }

    try {
      setLoading(true);
      const quizData = {
        courseId,
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        questions: questions.map(q => {
          const question: any = {
            questionText: q.questionText,
            questionType: q.questionType,
            points: q.points || 1,
            explanation: q.explanation || '',
          };

          if (q.questionType === 'mcq_single' || q.questionType === 'mcq_multiple') {
            // Filter out empty options before sending
            question.options = q.options?.filter(opt => opt && opt.trim() !== '') || [];
            if (q.questionType === 'mcq_single') {
              question.correctAnswer = q.correctAnswer;
            } else {
              question.correctAnswers = q.correctAnswers;
            }
          } else {
            question.correctAnswer = parseFloat(q.correctAnswer as string);
          }

          return question;
        }),
        timeLimit: formData.timeLimit ? parseFloat(formData.timeLimit) : null,
        showResults: formData.showResults,
      };

      await quizService.createQuiz(quizData);

      toast({
        title: 'Success',
        description: 'Quiz created successfully',
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        instructions: '',
        timeLimit: '',
        showResults: true,
      });
      setQuestions([]);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create quiz',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quiz</DialogTitle>
          <DialogDescription>
            Create a quiz with multiple choice and numerical questions
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (minutes, optional)</Label>
              <Input
                id="timeLimit"
                type="number"
                min="1"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                placeholder="No limit"
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="showResults"
                checked={formData.showResults}
                onCheckedChange={(checked) => setFormData({ ...formData, showResults: checked as boolean })}
              />
              <Label htmlFor="showResults" className="cursor-pointer">
                Show results immediately after submission
              </Label>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg">Questions ({questions.length})</Label>
              <div className="flex gap-2">
                <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate with AI
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>AI Question Generator</DialogTitle>
                      <DialogDescription>
                        Generate quiz questions based on your course materials using AI
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="ai-topic">Topic *</Label>
                        <Input
                          id="ai-topic"
                          value={aiFormData.topic}
                          onChange={(e) => setAiFormData({ ...aiFormData, topic: e.target.value })}
                          placeholder="e.g., Database Normalization, OOP Concepts, etc."
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the topic you want questions about
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ai-question-type">Question Type *</Label>
                          <Select
                            value={aiFormData.questionType}
                            onValueChange={(value: 'mcq_single' | 'mcq_multiple' | 'numerical') =>
                              setAiFormData({ ...aiFormData, questionType: value })
                            }
                          >
                            <SelectTrigger id="ai-question-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mcq_single">Single Choice MCQ</SelectItem>
                              <SelectItem value="mcq_multiple">Multiple Choice MCQ</SelectItem>
                              <SelectItem value="numerical">Numerical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="ai-num-questions">Number of Questions *</Label>
                          <Input
                            id="ai-num-questions"
                            type="number"
                            min="1"
                            max="10"
                            value={aiFormData.numQuestions}
                            onChange={(e) =>
                              setAiFormData({ ...aiFormData, numQuestions: parseInt(e.target.value) || 1 })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="ai-difficulty">Difficulty Level</Label>
                        <Select
                          value={aiFormData.difficulty}
                          onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                            setAiFormData({ ...aiFormData, difficulty: value })
                          }
                        >
                          <SelectTrigger id="ai-difficulty">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAiDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleGenerateQuestions}
                          disabled={aiGenerating || !aiFormData.topic.trim()}
                        >
                          {aiGenerating ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Questions
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <QuestionEditor
                  key={qIndex}
                  question={question}
                  index={qIndex}
                  onUpdate={(field, value) => updateQuestion(qIndex, field, value)}
                  onAddOption={() => addOption(qIndex)}
                  onRemoveOption={(optIndex) => removeOption(qIndex, optIndex)}
                  onUpdateOption={(optIndex, value) => updateOption(qIndex, optIndex, value)}
                  onRemove={() => removeQuestion(qIndex)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || questions.length === 0}>
              {loading ? 'Creating...' : 'Create Quiz'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Question Editor Component
function QuestionEditor({
  question,
  index,
  onUpdate,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onRemove,
}: {
  question: Question;
  index: number;
  onUpdate: (field: string, value: any) => void;
  onAddOption: () => void;
  onRemoveOption: (optIndex: number) => void;
  onUpdateOption: (optIndex: number, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Question {index + 1}</h4>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Question Text *</Label>
        <Textarea
          value={question.questionText}
          onChange={(e) => onUpdate('questionText', e.target.value)}
          rows={2}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Question Type *</Label>
          <Select
            value={question.questionType}
            onValueChange={(value: 'mcq_single' | 'mcq_multiple' | 'numerical') => {
              onUpdate('questionType', value);
              if (value === 'numerical') {
                // Clear MCQ-specific fields
                onUpdate('options', undefined);
                onUpdate('correctAnswer', '');
                onUpdate('correctAnswers', undefined);
              } else {
                // Clear numerical answer (if it was a number)
                if (typeof question.correctAnswer === 'number' || (question.correctAnswer && !isNaN(parseFloat(question.correctAnswer)))) {
                  onUpdate('correctAnswer', undefined);
                }
                // Initialize options if switching from numerical or if empty
                if (!question.options || question.options.length === 0) {
                  onUpdate('options', ['Option 1', 'Option 2']);
                }
                if (value === 'mcq_single') {
                  onUpdate('correctAnswers', undefined);
                  onUpdate('correctAnswer', undefined);
                } else {
                  onUpdate('correctAnswer', undefined);
                  if (!question.correctAnswers) {
                    onUpdate('correctAnswers', []);
                  }
                }
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mcq_single">MCQ (Single Correct)</SelectItem>
              <SelectItem value="mcq_multiple">MCQ (Multiple Correct)</SelectItem>
              <SelectItem value="numerical">Numerical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Points</Label>
          <Input
            type="number"
            min="1"
            value={question.points || 1}
            onChange={(e) => onUpdate('points', parseFloat(e.target.value) || 1)}
          />
        </div>
      </div>

      {(question.questionType === 'mcq_single' || question.questionType === 'mcq_multiple') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Options *</Label>
            <Button type="button" variant="outline" size="sm" onClick={onAddOption}>
              <Plus className="h-3 w-3 mr-1" />
              Add Option
            </Button>
          </div>
          {question.options?.map((option, optIndex) => (
            <div key={optIndex} className="flex gap-2">
              <Input
                value={option}
                onChange={(e) => onUpdateOption(optIndex, e.target.value)}
                placeholder={`Option ${optIndex + 1}`}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveOption(optIndex)}
                disabled={question.options && question.options.length <= 2}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {question.questionType === 'mcq_single' && (
            <div className="space-y-2 mt-2">
              <Label>Correct Answer *</Label>
              {(() => {
                const validOptions = question.options?.filter(opt => opt && opt.trim() !== '') || [];
                return validOptions.length > 0 ? (
                  <Select
                    key={`select-${index}-${validOptions.length}-${validOptions.join('-')}`}
                    value={question.correctAnswer && question.correctAnswer !== '' ? (question.correctAnswer as string) : undefined}
                    onValueChange={(value) => onUpdate('correctAnswer', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {validOptions.map((opt, idx) => (
                        <SelectItem key={`${index}-${idx}-${opt}`} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">Add and fill in at least 2 options first</p>
                );
              })()}
            </div>
          )}

          {question.questionType === 'mcq_multiple' && (
            <div className="space-y-2 mt-2">
              <Label>Correct Answers * (Select all that apply)</Label>
              <div className="space-y-2">
                {question.options?.filter(opt => opt && opt.trim() !== '').map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Checkbox
                      checked={question.correctAnswers?.includes(opt) || false}
                      onCheckedChange={(checked) => {
                        const current = question.correctAnswers || [];
                        if (checked) {
                          onUpdate('correctAnswers', [...current, opt]);
                        } else {
                          onUpdate('correctAnswers', current.filter(a => a !== opt));
                        }
                      }}
                    />
                    <Label className="cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {question.questionType === 'numerical' && (
        <div className="space-y-2">
          <Label>Correct Answer (Number) *</Label>
          <Input
            type="number"
            step="any"
            value={typeof question.correctAnswer === 'number' ? question.correctAnswer : (question.correctAnswer || '')}
            onChange={(e) => {
              const val = e.target.value;
              onUpdate('correctAnswer', val === '' ? '' : parseFloat(val));
            }}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Explanation (shown after submission, optional)</Label>
        <Textarea
          value={question.explanation || ''}
          onChange={(e) => onUpdate('explanation', e.target.value)}
          rows={2}
          placeholder="Explain the correct answer..."
        />
      </div>
    </div>
  );
}

// Quiz Attempt Dialog Component
function QuizAttemptDialog({
  quiz,
  open,
  onOpenChange,
  onSuccess,
}: {
  quiz: Quiz;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && quiz && !quiz.attempt) {
      // Initialize answers
      const initialAnswers = quiz.questions.map((_, index) => ({
        questionIndex: index,
        answer: null,
      }));
      setAnswers(initialAnswers);
      setSubmitted(false);
      setResults(null);
      setTimeSpent(0);
    } else if (open && quiz && quiz.attempt) {
      // Load existing attempt results
      setSubmitted(true);
      loadResults();
    }
  }, [open, quiz]);

  useEffect(() => {
    if (open && !submitted) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [open, submitted, startTime]);

  const loadResults = async () => {
    try {
      const data = await quizService.getQuiz(quiz._id);
      setResults(data);
    } catch (error: any) {
      toast({
        title: 'Error loading results',
        description: error.response?.data?.message || 'Failed to load results',
        variant: 'destructive',
      });
    }
  };

  const updateAnswer = (questionIndex: number, answer: any) => {
    const updated = [...answers];
    updated[questionIndex] = { questionIndex, answer };
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    // Validate all questions are answered
    const unanswered = answers.filter(a => a.answer === null || a.answer === '' || 
      (Array.isArray(a.answer) && a.answer.length === 0));
    
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Do you want to submit anyway?`
      );
      if (!confirm) return;
    }

    try {
      setLoading(true);
      const finalTimeSpent = Math.floor((Date.now() - startTime) / 1000);
      const response = await quizService.submitQuiz(quiz._id, answers, finalTimeSpent);
      
      setResults(response);
      setSubmitted(true);
      setTimeSpent(finalTimeSpent);
      
      toast({
        title: 'Quiz Submitted!',
        description: `Your score: ${response.totalScore}/${response.totalPoints} (${response.percentage.toFixed(1)}%). Click "View Standings" to see your ranking!`,
      });

      onSuccess();
      // Close the dialog after submission - user can view standings from the quiz card
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit quiz',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!quiz) return null;

  const questionsToShow = results?.questions || quiz.questions;
  const showResults = submitted && results;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quiz.title}</DialogTitle>
          <DialogDescription>
            {quiz.description}
            {!submitted && (
              <span className="block mt-2">
                Questions: {quiz.questions.length} | Total Points: {quiz.totalPoints}
                {quiz.timeLimit && ` | Time Limit: ${quiz.timeLimit} minutes`}
              </span>
            )}
            {submitted && results && (
              <span className="block mt-2 text-lg font-semibold">
                Score: {results.totalScore}/{results.totalPoints} ({results.percentage.toFixed(1)}%)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {quiz.instructions && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Instructions:</p>
            <p className="text-sm text-muted-foreground">{quiz.instructions}</p>
          </div>
        )}

        {!submitted && (
          <div className="space-y-6">
            {quiz.questions.map((question, index) => (
              <QuestionAttempt
                key={index}
                question={question}
                index={index}
                answer={answers[index]?.answer}
                onAnswerChange={(answer) => updateAnswer(index, answer)}
              />
            ))}

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Time spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
              </div>
              <Button onClick={handleSubmit} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
          </div>
        )}

        {showResults && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
              <p className="text-lg font-semibold mb-2">
                Quiz Submitted Successfully!
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Your score: {results.totalScore}/{results.totalPoints} ({results.percentage.toFixed(1)}%)
              </p>
              <p className="text-sm text-muted-foreground">
                Close this dialog and click "View Standings" on the quiz card to see your ranking!
              </p>
            </div>
            {quiz.showResults && (
              <div className="space-y-6">
                <div className="border-t pt-4">
                  <p className="font-semibold mb-4">Question Review:</p>
                </div>
                {questionsToShow.map((question: any, index: number) => (
                  <QuestionResult
                    key={index}
                    question={question}
                    index={index}
                    studentAnswer={question.studentAnswer}
                    isCorrect={question.isCorrect}
                    pointsEarned={question.pointsEarned}
                    showResults={quiz.showResults}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Question Attempt Component
function QuestionAttempt({
  question,
  index,
  answer,
  onAnswerChange,
}: {
  question: Question;
  index: number;
  answer: any;
  onAnswerChange: (answer: any) => void;
}) {
  if (question.questionType === 'mcq_single') {
    return (
      <div className="p-4 border rounded-lg">
        <div className="flex items-start gap-2 mb-3">
          <span className="font-medium">Q{index + 1}.</span>
          <p className="flex-1">{question.questionText}</p>
          <Badge variant="outline">{question.points} pt{question.points !== 1 ? 's' : ''}</Badge>
        </div>
        <div className="space-y-2">
          {question.options?.filter(opt => opt && opt.trim() !== '').map((option, optIndex) => (
            <div key={optIndex} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`q${index}-opt${optIndex}`}
                name={`question-${index}`}
                value={option}
                checked={answer === option}
                onChange={(e) => onAnswerChange(e.target.value)}
                className="h-4 w-4"
              />
              <Label htmlFor={`q${index}-opt${optIndex}`} className="cursor-pointer flex-1">
                {option}
              </Label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (question.questionType === 'mcq_multiple') {
    const selectedAnswers = Array.isArray(answer) ? answer : [];
    
    return (
      <div className="p-4 border rounded-lg">
        <div className="flex items-start gap-2 mb-3">
          <span className="font-medium">Q{index + 1}.</span>
          <p className="flex-1">{question.questionText}</p>
          <Badge variant="outline">{question.points} pt{question.points !== 1 ? 's' : ''}</Badge>
        </div>
        <div className="space-y-2">
          {question.options?.filter(opt => opt && opt.trim() !== '').map((option, optIndex) => (
            <div key={optIndex} className="flex items-center space-x-2">
              <Checkbox
                id={`q${index}-opt${optIndex}`}
                checked={selectedAnswers.includes(option)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onAnswerChange([...selectedAnswers, option]);
                  } else {
                    onAnswerChange(selectedAnswers.filter(a => a !== option));
                  }
                }}
              />
              <Label htmlFor={`q${index}-opt${optIndex}`} className="cursor-pointer flex-1">
                {option}
              </Label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Numerical
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start gap-2 mb-3">
        <span className="font-medium">Q{index + 1}.</span>
        <p className="flex-1">{question.questionText}</p>
        <Badge variant="outline">{question.points} pt{question.points !== 1 ? 's' : ''}</Badge>
      </div>
      <Input
        type="number"
        step="any"
        value={answer || ''}
        onChange={(e) => onAnswerChange(e.target.value ? parseFloat(e.target.value) : '')}
        placeholder="Enter your answer"
      />
    </div>
  );
}

// Question Result Component
function QuestionResult({
  question,
  index,
  studentAnswer,
  isCorrect,
  pointsEarned,
  showResults,
}: {
  question: any;
  index: number;
  studentAnswer: any;
  isCorrect: boolean;
  pointsEarned: number;
  showResults: boolean;
}) {
  return (
    <div className={`p-4 border rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
      <div className="flex items-start gap-2 mb-3">
        <span className="font-medium">Q{index + 1}.</span>
        <p className="flex-1">{question.questionText}</p>
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <Badge variant={isCorrect ? 'default' : 'destructive'}>
            {pointsEarned}/{question.points} pts
          </Badge>
        </div>
      </div>

      {question.questionType === 'mcq_single' || question.questionType === 'mcq_multiple' ? (
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium mb-1">Your Answer:</p>
            <p className="text-sm">
              {Array.isArray(studentAnswer) ? studentAnswer.join(', ') : studentAnswer || 'Not answered'}
            </p>
          </div>
          {showResults && (
            <div>
              <p className="text-sm font-medium mb-1">Correct Answer:</p>
              <p className="text-sm">
                {question.questionType === 'mcq_single'
                  ? question.correctAnswer
                  : question.correctAnswers?.join(', ')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium mb-1">Your Answer:</p>
            <p className="text-sm">{studentAnswer !== null && studentAnswer !== undefined ? studentAnswer : 'Not answered'}</p>
          </div>
          {showResults && (
            <div>
              <p className="text-sm font-medium mb-1">Correct Answer:</p>
              <p className="text-sm">{question.correctAnswer}</p>
            </div>
          )}
        </div>
      )}

      {question.explanation && showResults && (
        <div className="mt-3 p-2 bg-muted rounded">
          <p className="text-sm font-medium mb-1">Explanation:</p>
          <p className="text-sm text-muted-foreground">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

// Quiz Leaderboard Dialog Component
function QuizLeaderboardDialog({
  quiz,
  open,
  onOpenChange,
}: {
  quiz: Quiz;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && quiz) {
      loadLeaderboard();
    }
  }, [open, quiz]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await quizService.getQuizLeaderboard(quiz._id);
      setLeaderboard(data);
    } catch (error: any) {
      toast({
        title: 'Error loading leaderboard',
        description: error.response?.data?.message || 'Failed to load leaderboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground w-5">{rank}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quiz Leaderboard
          </DialogTitle>
          <DialogDescription>
            {leaderboard?.quizTitle || quiz.title} - Competitive Rankings
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
          </div>
        ) : leaderboard && leaderboard.leaderboard.length > 0 ? (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Points</p>
                  <p className="text-2xl font-bold">{leaderboard.totalPoints}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Participants</p>
                  <p className="text-2xl font-bold">{leaderboard.leaderboard.length}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {leaderboard.leaderboard.map((entry: any) => (
                <div
                  key={entry.studentId}
                  className={`p-4 border rounded-lg transition-all ${
                    entry.isCurrentUser
                      ? 'bg-primary/10 border-primary/30 shadow-md'
                      : 'bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold ${entry.isCurrentUser ? 'text-primary' : ''}`}>
                          {entry.studentName}
                        </p>
                        {entry.isCurrentUser && (
                          <Badge variant="default" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Score: {entry.totalScore}/{entry.totalPoints}
                        </span>
                        <span>Percentage: {entry.percentage.toFixed(1)}%</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(entry.timeSpent)}
                        </span>
                        <span>
                          {new Date(entry.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${entry.isCurrentUser ? 'text-primary' : 'text-muted-foreground'}`}>
                        {entry.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No submissions yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Be the first to attempt this quiz!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

