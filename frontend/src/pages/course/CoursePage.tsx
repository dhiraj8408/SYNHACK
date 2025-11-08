import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import ContentTab from './ContentTab';
import AssignmentsTab from './AssignmentsTab';
import ForumTab from './ForumTab';
import AnnouncementsTab from './AnnouncementsTab';

export default function CoursePage() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'content';
  const threadId = searchParams.get('threadId');

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    // Remove threadId when switching away from forum tab
    if (value !== 'forum') {
      newParams.delete('threadId');
    }
    navigate(`/course/${courseId}?${newParams.toString()}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">Course Materials</CardTitle>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="forum">Forum</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <ContentTab courseId={courseId!} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTab courseId={courseId!} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsTab courseId={courseId!} />
          </TabsContent>

          <TabsContent value="forum">
            <ForumTab courseId={courseId!} threadId={threadId || undefined} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
