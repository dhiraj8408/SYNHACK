import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { assignmentService } from '@/services/assignmentService';
import { useToast } from '@/hooks/use-toast';
import { FileText, Clock, Plus } from 'lucide-react';

interface AssignmentsTabProps {
  courseId: string;
}

export default function AssignmentsTab({ courseId }: AssignmentsTabProps) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await assignmentService.getAssignments(courseId);
        setAssignments(data);
      } catch (error: any) {
        toast({
          title: 'Error loading assignments',
          description: error.response?.data?.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [courseId, toast]);

  const isProfessor = user?.role === 'professor' || user?.role === 'admin';

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assignments & Quizzes</CardTitle>
          {isProfessor && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
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
            {assignments.map((assignment: any) => (
              <div
                key={assignment._id}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{assignment.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={assignment.type === 'quiz' ? 'secondary' : 'default'}>
                        {assignment.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button size="sm">View</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
