import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import ContentTab from './ContentTab';
import AssignmentsTab from './AssignmentsTab';
import ForumTab from './ForumTab';

export default function CoursePage() {
  const { courseId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">Course Materials</CardTitle>
          </CardHeader>
        </Card>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="forum">Forum</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <ContentTab courseId={courseId!} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTab courseId={courseId!} />
          </TabsContent>

          <TabsContent value="forum">
            <ForumTab courseId={courseId!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
