import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users } from 'lucide-react';

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
        {course.studentIds && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{course.studentIds.length} students enrolled</span>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
};
