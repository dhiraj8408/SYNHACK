import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { courseService } from '@/services/courseService';
import { CourseCard } from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, MessageSquare, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getCoursesByStudent(user.id);
        setCourses(data);
      } catch (error: any) {
        toast({
          title: 'Error loading courses',
          description: error.response?.data?.message || 'Failed to fetch courses',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link to="/student/chatbot">
            <Card className="border-border hover:shadow-elegant transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Chatbot</h3>
                    <p className="text-sm text-muted-foreground">Ask questions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{courses.length} Courses</h3>
                  <p className="text-sm text-muted-foreground">Enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">Forum</h3>
                  <p className="text-sm text-muted-foreground">Active discussions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No courses enrolled yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course: any) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
