import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { progressService } from '@/services/progressService';

interface CourseCardProps {
  course: {
    _id: string;
    courseCode: string;
    courseName: string;
    semester: string;
    department: string;
    studentIds?: string[];
  };
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (isStudent) {
      progressService.getProgress(course._id)
        .then(setProgress)
        .catch(() => setProgress(null));
    }
  }, [course._id, isStudent]);

  return (
    <Link to={`/course/${course._id}`}>
      <Card className="group transition-all duration-300 hover:shadow-elegant hover:scale-105 border-border bg-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <Badge variant="secondary">{course.courseCode}</Badge>
            </div>
          </div>
          <CardTitle className="mt-2 group-hover:text-primary transition-colors">
            {course.courseName}
          </CardTitle>
          <CardDescription>
            {course.department} • Semester {course.semester}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isStudent && progress && (
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <Badge variant="secondary">{progress.percentage}%</Badge>
              </div>
              <Progress 
                value={progress.percentage} 
                className="h-2 bg-purple-100" 
                indicatorClassName="bg-purple-700"
              />
              <p className="text-xs text-muted-foreground">
                {progress.completedCount} of {progress.totalModules} modules completed
              </p>
            </div>
          )}
          {course.studentIds && !isStudent && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{course.studentIds.length} students enrolled</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
