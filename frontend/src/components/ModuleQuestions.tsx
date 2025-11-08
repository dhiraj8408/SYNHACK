import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { moduleQuestionService } from '@/services/moduleQuestionService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Plus, Trash2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface ModuleQuestionsProps {
  courseId: string;
  module: string;
}

export default function ModuleQuestions({ courseId, module }: ModuleQuestionsProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [answerDialogOpen, setAnswerDialogOpen] = useState<string | null>(null);
  const { toast } = useToast();

  const isProfessor = user?.role === 'professor' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    questionType: 'short_answer' as 'short_answer' | 'long_answer' | 'multiple_choice' | 'true_false',
    options: ['', ''],
    correctAnswer: '',
    correctAnswers: [] as string[],
    points: '1',
    explanation: '',
  });

  const [studentAnswers, setStudentAnswers] = useState<Record<string, string | string[]>>({});

  useEffect(() => {
    fetchQuestions();
  }, [courseId, module]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await moduleQuestionService.getModuleQuestions(courseId, module);
      setQuestions(data);
      
      // Initialize student answers
      if (isStudent) {
        const answers: Record<string, string | string[]> = {};
        data.forEach((q: any) => {
          if (q.studentAnswer) {
            answers[q._id] = q.studentAnswer.answer;
          } else {
            if (q.questionType === 'multiple_choice') {
              answers[q._id] = [];
            } else {
              answers[q._id] = '';
            }
          }
        });
        setStudentAnswers(answers);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading questions',
        description: error.response?.data?.message || 'Failed to load questions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.questionText.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Question text is required',
        variant: 'destructive',
      });
      return;
    }

    if (newQuestion.questionType === 'multiple_choice') {
      const validOptions = newQuestion.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        toast({
          title: 'Validation Error',
          description: 'Multiple choice questions require at least 2 options',
          variant: 'destructive',
        });
        return;
      }
      if (!newQuestion.correctAnswer && newQuestion.correctAnswers.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please select a correct answer',
          variant: 'destructive',
        });
        return;
      }
    } else if (!newQuestion.correctAnswer.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Correct answer is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await moduleQuestionService.addQuestion({
        courseId,
        module,
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType,
        options: newQuestion.questionType === 'multiple_choice' ? newQuestion.options.filter(opt => opt.trim() !== '') : undefined,
        correctAnswer: newQuestion.correctAnswer,
        correctAnswers: newQuestion.questionType === 'multiple_choice' && newQuestion.correctAnswers.length > 0 ? newQuestion.correctAnswers : undefined,
        points: parseInt(newQuestion.points) || 1,
        explanation: newQuestion.explanation,
      });

      toast({
        title: 'Success',
        description: 'Question added successfully',
      });

      setAddDialogOpen(false);
      setNewQuestion({
        questionText: '',
        questionType: 'short_answer',
        options: ['', ''],
        correctAnswer: '',
        correctAnswers: [],
        points: '1',
        explanation: '',
      });
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add question',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const answer = studentAnswers[questionId];
    if (!answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === 'string' && !answer.trim())) {
      toast({
        title: 'Validation Error',
        description: 'Please provide an answer',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await moduleQuestionService.submitAnswer(questionId, answer);
      toast({
        title: result.isCorrect ? 'Correct!' : 'Incorrect',
        description: result.isCorrect 
          ? `You earned ${result.pointsEarned} point(s)!` 
          : 'Try again or review the material.',
        variant: result.isCorrect ? 'default' : 'destructive',
      });
      setAnswerDialogOpen(null);
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit answer',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await moduleQuestionService.deleteQuestion(questionId);
      toast({
        title: 'Success',
        description: 'Question deleted successfully',
      });
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete question',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className="border-border mt-4">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">Loading questions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Module Questions ({questions.length})
          </CardTitle>
          {isProfessor && (
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Question</DialogTitle>
                  <DialogDescription>
                    Add a question to test student understanding of this module
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Question Text *</Label>
                    <Textarea
                      value={newQuestion.questionText}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Question Type *</Label>
                      <Select
                        value={newQuestion.questionType}
                        onValueChange={(value: any) => setNewQuestion({ ...newQuestion, questionType: value, correctAnswer: '', correctAnswers: [] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="long_answer">Long Answer</SelectItem>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Points</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newQuestion.points}
                        onChange={(e) => setNewQuestion({ ...newQuestion, points: e.target.value })}
                      />
                    </div>
                  </div>

                  {newQuestion.questionType === 'multiple_choice' && (
                    <>
                      <div className="space-y-2">
                        <Label>Options *</Label>
                        {newQuestion.options.map((opt, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const updated = [...newQuestion.options];
                                updated[idx] = e.target.value;
                                setNewQuestion({ ...newQuestion, options: updated });
                              }}
                              placeholder={`Option ${idx + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = newQuestion.options.filter((_, i) => i !== idx);
                                setNewQuestion({ ...newQuestion, options: updated });
                              }}
                              disabled={newQuestion.options.length <= 2}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setNewQuestion({ ...newQuestion, options: [...newQuestion.options, ''] })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Correct Answer(s) *</Label>
                        {newQuestion.options.filter(opt => opt.trim() !== '').map((opt, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <Checkbox
                              checked={newQuestion.correctAnswers.includes(opt)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewQuestion({ ...newQuestion, correctAnswers: [...newQuestion.correctAnswers, opt] });
                                } else {
                                  setNewQuestion({ ...newQuestion, correctAnswers: newQuestion.correctAnswers.filter(a => a !== opt) });
                                }
                              }}
                            />
                            <Label className="cursor-pointer">{opt}</Label>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {(newQuestion.questionType === 'short_answer' || newQuestion.questionType === 'true_false') && (
                    <div className="space-y-2">
                      <Label>Correct Answer *</Label>
                      {newQuestion.questionType === 'true_false' ? (
                        <Select value={newQuestion.correctAnswer} onValueChange={(value) => setNewQuestion({ ...newQuestion, correctAnswer: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select answer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={newQuestion.correctAnswer}
                          onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                          required
                        />
                      )}
                    </div>
                  )}

                  {newQuestion.questionType === 'long_answer' && (
                    <div className="space-y-2">
                      <Label>Expected Answer (for reference)</Label>
                      <Textarea
                        value={newQuestion.correctAnswer}
                        onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                        rows={3}
                        placeholder="Expected answer or key points"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Explanation (shown after answering)</Label>
                    <Textarea
                      value={newQuestion.explanation}
                      onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                      rows={2}
                      placeholder="Optional explanation"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddQuestion}>Add Question</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No questions yet. {isProfessor && 'Add questions to test student understanding.'}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => {
              const hasAnswered = isStudent && question.studentAnswer;
              const isCorrect = hasAnswered && question.studentAnswer.isCorrect;

              return (
                <Card key={question._id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">{question.questionText}</p>
                          <Badge variant="outline">{question.points} pt{question.points !== 1 ? 's' : ''}</Badge>
                          {hasAnswered && (
                            isCorrect ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Correct
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Incorrect
                              </Badge>
                            )
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {question.questionType.replace('_', ' ')}
                        </Badge>
                      </div>
                      {isProfessor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {isStudent && !hasAnswered && (
                      <div className="mt-4 space-y-3">
                        {question.questionType === 'multiple_choice' && (
                          <div className="space-y-2">
                            {question.options?.map((opt: string, idx: number) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={(studentAnswers[question._id] as string[])?.includes(opt) || false}
                                  onCheckedChange={(checked) => {
                                    const current = (studentAnswers[question._id] as string[]) || [];
                                    if (checked) {
                                      setStudentAnswers({ ...studentAnswers, [question._id]: [...current, opt] });
                                    } else {
                                      setStudentAnswers({ ...studentAnswers, [question._id]: current.filter(a => a !== opt) });
                                    }
                                  }}
                                />
                                <Label className="cursor-pointer">{opt}</Label>
                              </div>
                            ))}
                          </div>
                        )}

                        {(question.questionType === 'short_answer' || question.questionType === 'long_answer') && (
                          <Textarea
                            value={studentAnswers[question._id] as string || ''}
                            onChange={(e) => setStudentAnswers({ ...studentAnswers, [question._id]: e.target.value })}
                            placeholder="Enter your answer"
                            rows={question.questionType === 'long_answer' ? 4 : 2}
                          />
                        )}

                        {question.questionType === 'true_false' && (
                          <div className="flex gap-2">
                            <Button
                              variant={studentAnswers[question._id] === 'true' ? 'default' : 'outline'}
                              onClick={() => setStudentAnswers({ ...studentAnswers, [question._id]: 'true' })}
                              className="flex-1"
                            >
                              True
                            </Button>
                            <Button
                              variant={studentAnswers[question._id] === 'false' ? 'default' : 'outline'}
                              onClick={() => setStudentAnswers({ ...studentAnswers, [question._id]: 'false' })}
                              className="flex-1"
                            >
                              False
                            </Button>
                          </div>
                        )}

                        <Button
                          onClick={() => handleSubmitAnswer(question._id)}
                          className="w-full"
                        >
                          Submit Answer
                        </Button>
                      </div>
                    )}

                    {hasAnswered && (
                      <div className="mt-4 space-y-2 p-3 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Your Answer:</p>
                          <p className="text-sm">{question.studentAnswer.answer}</p>
                        </div>
                        {question.explanation && (
                          <div>
                            <p className="text-sm font-medium">Explanation:</p>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
                          </div>
                        )}
                        {isProfessor && question.stats && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              Accuracy: {question.stats.accuracy}% ({question.stats.correctAnswers}/{question.stats.totalAnswers} correct)
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

