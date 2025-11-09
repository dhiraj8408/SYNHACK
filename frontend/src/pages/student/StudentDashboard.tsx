import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { courseService } from '@/services/courseService';
import { forumService } from '@/services/forumService';
import { announcementService } from '@/services/announcementService';
import { CourseCard } from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, MessageSquare, Brain, ArrowRight, Megaphone, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [recentThreads, setRecentThreads] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesData = await courseService.getCoursesByStudent(user.id);
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

        // Fetch global announcements
        const announcementsData = await announcementService.getAnnouncements();
        setAnnouncements(announcementsData);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-secondary" />
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
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Forum</h3>
                  <p className="text-sm text-muted-foreground">Active discussions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <Card className="border-border mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Announcements
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.slice(0, 5).map((announcement: any) => (
                  <div
                    key={announcement._id}
                    className="p-4 border rounded-lg bg-primary/5 border-primary/20"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {announcement.createdBy?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{announcement.title}</h4>
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            Global
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                          {announcement.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(announcement.createdAt).toLocaleString()}</span>
                          <span>•</span>
                          <span>{announcement.createdBy?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                          <h4 className="font-medium text-sm truncate">{thread.title}</h4>
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
