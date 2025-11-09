import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { assignmentService } from '@/services/assignmentService';
import { useToast } from '@/hooks/use-toast';
import { FileText, Clock, Plus, Upload, Download, CheckCircle, XCircle, Users, FileDown } from 'lucide-react';
import apiClient from '@/services/apiClient';
import MaterialViewer from '@/components/MaterialViewer';

interface AssignmentsTabProps {
  courseId: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  type: 'assignment' | 'quiz';
  fileUrl?: string;
  fileName?: string;
  dueDate: string;
  maxScore: number;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Submission {
  _id: string;
  submissionUrl: string;
  fileName: string;
  score: number | null;
  feedback: string;
  studentId: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function AssignmentsTab({ courseId }: AssignmentsTabProps) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [mySubmissionsMap, setMySubmissionsMap] = useState<Record<string, Submission>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);
  const { toast } = useToast();

  const isProfessor = user?.role === 'professor' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getAssignments(courseId);
      setAssignments(data);
      
      // If student, fetch their submissions for all assignments to show grades
      if (isStudent) {
        const submissionsMap: Record<string, Submission> = {};
        await Promise.all(
          data.map(async (assignment: Assignment) => {
            try {
              const submission = await assignmentService.getMySubmission(assignment._id);
              if (submission) {
                submissionsMap[assignment._id] = submission;
              }
            } catch (error: any) {
              // 404 is expected if no submission exists
              if (error.response?.status !== 404) {
                console.error(`Error fetching submission for assignment ${assignment._id}:`, error);
              }
            }
          })
        );
        setMySubmissionsMap(submissionsMap);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading assignments',
        description: error.response?.data?.message || 'Failed to load assignments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const loadSubmissions = async (assignmentId: string) => {
    setLoadingSubmissions(true);
    try {
      console.log('[Frontend] Loading submissions for assignmentId:', assignmentId);
      const subs = await assignmentService.getSubmissions(assignmentId);
      console.log('[Frontend] Loaded submissions:', subs);
      console.log('[Frontend] Number of submissions:', subs?.length || 0);
      setSubmissions(subs || []);
    } catch (error: any) {
      console.error('[Frontend] Error loading submissions:', error);
      console.error('[Frontend] Error response:', error.response?.data);
      toast({
        title: 'Error loading submissions',
        description: error.response?.data?.message || 'Failed to load submissions',
        variant: 'destructive',
      });
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleViewAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowViewDialog(true);
    
    if (isProfessor) {
      // Load submissions for professors
      await loadSubmissions(assignment._id);
    } else if (isStudent) {
      // Load student's own submission
      try {
        const submission = await assignmentService.getMySubmission(assignment._id);
        setMySubmission(submission);
      } catch (error: any) {
        if (error.response?.status !== 404) {
          toast({
            title: 'Error loading submission',
            description: error.response?.data?.message,
            variant: 'destructive',
          });
        }
        setMySubmission(null);
      }
    }
  };

  const handleOpenSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsDialog(true);
    await loadSubmissions(assignment._id);
  };

  const [assignmentType, setAssignmentType] = useState<'assignment' | 'quiz'>('assignment');

  const handleCreateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    
    const form = e.currentTarget;
    const driveLinkInput = form.querySelector('#driveLink') as HTMLInputElement;
    
    // Only handle drive link
    if (driveLinkInput?.value) {
      formData.append('fileUrl', driveLinkInput.value);
    }
    
    formData.append('courseId', courseId);
    formData.append('title', (form.querySelector('#title') as HTMLInputElement).value);
    formData.append('description', (form.querySelector('#description') as HTMLTextAreaElement).value);
    formData.append('instructions', (form.querySelector('#instructions') as HTMLTextAreaElement).value);
    formData.append('type', assignmentType);
    formData.append('dueDate', (form.querySelector('#dueDate') as HTMLInputElement).value);
    formData.append('maxScore', (form.querySelector('#maxScore') as HTMLInputElement).value);

    try {
      await assignmentService.createAssignment(formData);
      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });
      setShowCreateDialog(false);
      fetchAssignments();
      form.reset();
      setAssignmentType('assignment');
    } catch (error: any) {
      toast({
        title: 'Error creating assignment',
        description: error.response?.data?.message || 'Failed to create assignment',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const driveLinkInput = form.querySelector('#submissionDriveLink') as HTMLInputElement;
    
    if (!driveLinkInput?.value) {
      toast({
        title: 'Error',
        description: 'Please provide a Google Drive link',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('fileUrl', driveLinkInput.value);
    formData.append('assignmentId', selectedAssignment!._id);

    try {
      await assignmentService.submitAssignment(formData);
      toast({
        title: 'Success',
        description: 'Assignment submitted successfully',
      });
      setShowViewDialog(false);
      // Refresh assignments to update submission status and grades
      await fetchAssignments();
      if (selectedAssignment) {
        handleViewAssignment(selectedAssignment);
      }
    } catch (error: any) {
      toast({
        title: 'Error submitting assignment',
        description: error.response?.data?.message || 'Failed to submit assignment',
        variant: 'destructive',
      });
    }
  };

  const handleGradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    try {
      await assignmentService.gradeSubmission(submissionId, score, feedback);
      toast({
        title: 'Success',
        description: 'Submission graded successfully',
      });
      // Reload submissions after grading
      if (selectedAssignment) {
        await loadSubmissions(selectedAssignment._id);
      }
      // Refresh assignments to update grades for students (if they're viewing)
      if (isStudent) {
        await fetchAssignments();
      }
    } catch (error: any) {
      toast({
        title: 'Error grading submission',
        description: error.response?.data?.message || 'Failed to grade submission',
        variant: 'destructive',
      });
    }
  };

  const downloadFile = (url: string, fileName: string) => {
    if (!url) return;
    
    // If it's a relative path (starts with /api/), prepend the API base URL
    // Otherwise, it's likely a Google Drive link or external URL - open directly
    if (url.startsWith('/api/')) {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';
      window.open(`${API_BASE_URL}${url}`, '_blank');
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      // It's already a full URL (Google Drive link, etc.)
      window.open(url, '_blank');
    } else {
      // Fallback: try with base URL
      const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';
      window.open(`${API_BASE_URL}/${url}`, '_blank');
    }
  };

  const isPastDue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assignments & Quizzes</CardTitle>
              <CardDescription>View and manage course assignments</CardDescription>
            </div>
            {isProfessor && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button type="button">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>Add a new assignment or quiz for students</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAssignment} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select value={assignmentType} onValueChange={(value: 'assignment' | 'quiz') => setAssignmentType(value)}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assignment">Assignment</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" rows={3} />
                    </div>
                    <div>
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea id="instructions" name="instructions" rows={4} />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Due Date *</Label>
                      <Input id="dueDate" name="dueDate" type="datetime-local" required />
                    </div>
                    <div>
                      <Label htmlFor="maxScore">Max Score</Label>
                      <Input id="maxScore" name="maxScore" type="number" defaultValue={100} min={0} />
                    </div>
                    <div>
                      <Label htmlFor="driveLink">Google Drive Link</Label>
                      <Input
                        id="driveLink"
                        name="driveLink"
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Make sure the file is set to "Anyone with the link can view"
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Assignment</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No assignments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{assignment.title}</h4>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant={assignment.type === 'quiz' ? 'secondary' : 'default'}>
                          {assignment.type}
                        </Badge>
                        <span className={`text-sm flex items-center gap-1 ${isPastDue(assignment.dueDate) ? 'text-destructive' : 'text-muted-foreground'}`}>
                          <Clock className="h-3 w-3" />
                          Due: {new Date(assignment.dueDate).toLocaleString()}
                        </span>
                        {isPastDue(assignment.dueDate) && (
                          <Badge variant="destructive">Past Due</Badge>
                        )}
                        {isStudent && mySubmissionsMap[assignment._id] && (
                          <>
                            {mySubmissionsMap[assignment._id].score !== null && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                Score: {mySubmissionsMap[assignment._id].score} / {assignment.maxScore}
                              </Badge>
                            )}
                            {mySubmissionsMap[assignment._id].feedback && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                Feedback Available
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isProfessor && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSubmissions(assignment)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Submissions
                        </Button>
                      )}
                      {isStudent && !isPastDue(assignment.dueDate) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleViewAssignment(assignment)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleViewAssignment(assignment)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Assignment Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedAssignment && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAssignment.title}</DialogTitle>
                <DialogDescription>
                  {selectedAssignment.type} • Due: {new Date(selectedAssignment.dueDate).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedAssignment.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm mt-1">{selectedAssignment.description}</p>
                  </div>
                )}
                {selectedAssignment.instructions && (
                  <div>
                    <Label>Instructions</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedAssignment.instructions}</p>
                  </div>
                )}
                {selectedAssignment.fileUrl && (
                  <div>
                    <Label>Assignment Material</Label>
                    <div className="mt-2">
                      <MaterialViewer
                        fileUrl={selectedAssignment.fileUrl}
                        fileName={selectedAssignment.fileName}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
                {isStudent && (
                  <div className="border-t pt-4 mt-4">
                    <Label className="text-base font-semibold">Your Submission</Label>
                    {mySubmission ? (
                      <div className="mt-3 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">{mySubmission.fileName}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Submitted: {new Date(mySubmission.createdAt).toLocaleString()}
                            </p>
                            {mySubmission.score !== null && (
                              <div className="mb-2">
                                <p className="text-sm font-medium">
                                  Score: <span className="text-primary">{mySubmission.score}</span> / {selectedAssignment.maxScore}
                                </p>
                              </div>
                            )}
                            {mySubmission.feedback && (
                              <div className="mt-2 p-2 bg-background rounded border">
                                <p className="text-sm font-medium mb-1">Feedback:</p>
                                <p className="text-sm text-muted-foreground">{mySubmission.feedback}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(mySubmission.submissionUrl, mySubmission.fileName)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            {!isPastDue(selectedAssignment.dueDate) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const driveLink = prompt('Enter your Google Drive link:');
                                  if (driveLink) {
                                    const formData = new FormData();
                                    formData.append('fileUrl', driveLink);
                                    formData.append('assignmentId', selectedAssignment._id);
                                    assignmentService.submitAssignment(formData)
                                      .then(() => {
                                        toast({
                                          title: 'Success',
                                          description: 'Assignment resubmitted successfully',
                                        });
                                        handleViewAssignment(selectedAssignment);
                                      })
                                      .catch((error: any) => {
                                        toast({
                                          title: 'Error',
                                          description: error.response?.data?.message,
                                          variant: 'destructive',
                                        });
                                      });
                                  }
                                }}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Resubmit
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        {!isPastDue(selectedAssignment.dueDate) ? (
                          <form onSubmit={handleSubmitAssignment} className="space-y-4 p-4 border rounded-lg bg-muted/30">
                            <div>
                              <Label htmlFor="submissionFile" className="text-base font-semibold mb-2 block">
                                Upload Your Solution *
                              </Label>
                              <Input 
                                id="submissionFile" 
                                name="file" 
                                type="file" 
                                required 
                                className="cursor-pointer"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Accepted formats: PDF, DOC, DOCX, ZIP, etc. (Max 50MB)
                              </p>
                            </div>
                            <Button type="submit" className="w-full">
                              <Upload className="h-4 w-4 mr-2" />
                              Submit Assignment
                            </Button>
                          </form>
                        ) : (
                          <div className="mt-3 p-4 border rounded-lg bg-destructive/10">
                            <p className="text-sm text-destructive font-medium">
                              Assignment due date has passed. Submission is no longer available.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog for Professors */}
      <Dialog open={showSubmissionsDialog} onOpenChange={setShowSubmissionsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submissions - {selectedAssignment?.title}</DialogTitle>
            <DialogDescription>
              View and grade student submissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loadingSubmissions ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No submissions yet</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Students can submit their solutions by clicking "Submit" on the assignment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium">
                    Total submissions: <span className="text-primary">{submissions.length}</span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedAssignment && loadSubmissions(selectedAssignment._id)}
                  >
                    Refresh
                  </Button>
                </div>
                {submissions.map((submission: any) => (
                <Card key={submission._id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">
                          {submission.studentId?.name || 'Unknown Student'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ({submission.studentId?.email || 'No email'})
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Submitted: {new Date(submission.createdAt).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(submission.submissionUrl, submission.fileName || 'submission')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {submission.fileName || 'Download Submission'}
                        </Button>
                      </div>
                      {submission.score !== null ? (
                        <div className="mt-2">
                          <p className="text-sm">
                            Score: <strong>{submission.score}</strong> / {selectedAssignment?.maxScore}
                          </p>
                          {submission.feedback && (
                            <p className="text-sm mt-1">Feedback: {submission.feedback}</p>
                          )}
                        </div>
                      ) : (
                        <GradingForm
                          submission={submission}
                          maxScore={selectedAssignment?.maxScore || 100}
                          onGrade={handleGradeSubmission}
                        />
                      )}
                    </div>
                  </div>
                </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GradingForm({ submission, maxScore, onGrade }: { submission: Submission; maxScore: number; onGrade: (id: string, score: number, feedback: string) => void }) {
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScore) {
      return;
    }
    onGrade(submission._id, scoreNum, feedback);
    setScore('');
    setFeedback('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Score"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          min={0}
          max={maxScore}
          step="0.1"
          required
          className="w-24"
        />
        <span className="text-sm self-center">/ {maxScore}</span>
      </div>
      <Textarea
        placeholder="Feedback (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
      />
      <Button type="submit" size="sm">
        Grade Submission
      </Button>
    </form>
  );
}
