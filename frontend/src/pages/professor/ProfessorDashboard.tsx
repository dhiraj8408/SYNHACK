import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { courseService } from '@/services/courseService';
import { forumService } from '@/services/forumService';
import { CourseCard } from '@/components/CourseCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [recentThreads, setRecentThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesData = await courseService.getCoursesByProfessor(user.id);
        setCourses(coursesData);

        // Fetch recent threads from all courses
        const threadsPromises = coursesData.map((course: any) =>
          forumService.getThreads(course._id).catch(() => [])
        );
        const threadsResults = await Promise.all(threadsPromises);
        const allThreads = threadsResults.flat();
        
        // Sort by date and take most recent 5
        const sorted = allThreads
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        
        setRecentThreads(sorted);
      } catch (error: any) {
        toast({
          title: 'Error loading data',
          description: error.response?.data?.message || 'Failed to fetch data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, user.id]);

  const totalStudents = courses.reduce((sum: number, course: any) => 
    sum + (course.studentIds?.length || 0), 0
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Professor Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and students</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{courses.length}</h3>
                  <p className="text-sm text-muted-foreground">Active Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{totalStudents}</h3>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">-</h3>
                  <p className="text-sm text-muted-foreground">Materials Uploaded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Forum Activity */}
        {recentThreads.length > 0 && (
          <Card className="border-border mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Forum Activity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentThreads.map((thread: any) => {
                  const course = courses.find((c: any) => c._id === thread.courseId);
                  return (
                    <Link
                      key={thread._id}
                      to={`/course/${thread.courseId}?tab=forum&threadId=${thread._id}`}
                      className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{thread.title}</h4>
                            {thread.isResolved && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {thread.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {course?.courseName || 'Course'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {thread.createdBy?.name || 'Unknown'} • {new Date(thread.createdAt).toLocaleDateString()}
                            </span>
                            {thread.replies && thread.replies.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                • {thread.replies.length} replies
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

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
                <p className="text-muted-foreground">No courses assigned yet</p>
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
