import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { forumService } from '@/services/forumService';
import { initSocket, getSocket, disconnectSocket } from '@/socket/socket';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Plus } from 'lucide-react';

interface ForumTabProps {
  courseId: string;
}

export default function ForumTab({ courseId }: ForumTabProps) {
  const { user, token } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadMessage, setNewThreadMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      const socket = initSocket(token);

      socket.emit('join-room', { courseId });

      socket.on('new-thread', (thread) => {
        setThreads((prev) => [thread, ...prev]);
      });

      socket.on('new-reply', (reply) => {
        setThreads((prev) =>
          prev.map((t) =>
            t._id === reply.threadId
              ? { ...t, replies: [...(t.replies || []), reply] }
              : t
          )
        );
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [courseId, token]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forumService.createThread(courseId, newThreadTitle, newThreadMessage);
      setNewThreadTitle('');
      setNewThreadMessage('');
      setShowNewThread(false);
      toast({ title: 'Thread created successfully!' });
    } catch (error: any) {
      toast({
        title: 'Error creating thread',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Course Forum
          </CardTitle>
          <Button onClick={() => setShowNewThread(!showNewThread)}>
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showNewThread && (
          <Card className="border-border bg-muted/30">
            <CardContent className="pt-6">
              <form onSubmit={handleCreateThread} className="space-y-4">
                <Input
                  placeholder="Thread title"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  required
                />
                <Textarea
                  placeholder="Your question or discussion topic..."
                  value={newThreadMessage}
                  onChange={(e) => setNewThreadMessage(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewThread(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {threads.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No discussions yet. Start a new thread!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Card key={thread._id} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{thread.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{thread.message}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {thread.replies?.length || 0} replies
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(thread.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
