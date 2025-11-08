import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { forumService } from '@/services/forumService';
import { initSocket, getSocket, disconnectSocket } from '@/socket/socket';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Plus, Trash2, CheckCircle2, Reply } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ForumTabProps {
  courseId: string;
  threadId?: string;
}

interface Reply {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  message: string;
  createdAt: string;
}

interface Thread {
  _id: string;
  title: string;
  message: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  replies?: Reply[];
  isResolved: boolean;
  createdAt: string;
}

export default function ForumTab({ courseId, threadId }: ForumTabProps) {
  const { user, token } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadMessage, setNewThreadMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);
  const [highlightedThreadId, setHighlightedThreadId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load threads on mount
  useEffect(() => {
    const loadThreads = async () => {
      try {
        setLoading(true);
        const data = await forumService.getThreads(courseId);
        setThreads(data);
      } catch (error: any) {
        toast({
          title: 'Error loading threads',
          description: error.response?.data?.message || 'Failed to load forum threads',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, [courseId, toast]);

  // Scroll to and highlight specific thread when threadId is provided
  useEffect(() => {
    if (threadId && threads.length > 0) {
      const timer = setTimeout(() => {
        const threadElement = document.getElementById(`thread-${threadId}`);
        if (threadElement) {
          threadElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedThreadId(threadId);
          // Remove highlight after 3 seconds
          setTimeout(() => setHighlightedThreadId(null), 3000);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [threadId, threads]);

  // Socket setup
  useEffect(() => {
    if (token && courseId) {
      const socket = initSocket(token);

      socket.on('connect', () => {
        socket.emit('join-room', courseId);
      });

      socket.on('new-thread', (thread: Thread) => {
        setThreads((prev) => [thread, ...prev]);
        toast({
          title: 'New thread created',
          description: `${thread.createdBy.name} started a new discussion`,
        });
      });

      socket.on('new-reply', (reply: Reply & { threadId: string }) => {
        setThreads((prev) =>
          prev.map((t) =>
            t._id === reply.threadId
              ? { ...t, replies: [...(t.replies || []), reply] }
              : t
          )
        );
      });

      socket.on('thread-resolved', (thread: Thread) => {
        setThreads((prev) =>
          prev.map((t) => (t._id === thread._id ? { ...t, isResolved: true } : t))
        );
      });

      socket.on('thread-deleted', ({ threadId }: { threadId: string }) => {
        setThreads((prev) => prev.filter((t) => t._id !== threadId));
      });

      return () => {
        socket.off('new-thread');
        socket.off('new-reply');
        socket.off('thread-resolved');
        socket.off('thread-deleted');
      };
    }
  }, [token, courseId, toast]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newThread = await forumService.createThread(
        courseId,
        newThreadTitle,
        newThreadMessage
      );
      setThreads((prev) => [newThread, ...prev]);
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

  const handleReply = async (threadId: string) => {
    if (!replyMessage.trim()) return;

    try {
      await forumService.replyToThread(threadId, replyMessage);
      setReplyMessage('');
      setReplyingTo(null);
      toast({ title: 'Reply posted successfully!' });
      
      // Refresh thread to get updated replies
      const updatedThread = await forumService.getThreadById(threadId);
      setThreads((prev) =>
        prev.map((t) => (t._id === threadId ? updatedThread : t))
      );
    } catch (error: any) {
      toast({
        title: 'Error posting reply',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    }
  };

  const handleResolveThread = async (threadId: string) => {
    try {
      await forumService.resolveThread(threadId);
      setThreads((prev) =>
        prev.map((t) => (t._id === threadId ? { ...t, isResolved: true } : t))
      );
      toast({ title: 'Thread marked as resolved!' });
    } catch (error: any) {
      toast({
        title: 'Error resolving thread',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteThread = async () => {
    if (!deleteThreadId) return;

    try {
      await forumService.deleteThread(deleteThreadId);
      setThreads((prev) => prev.filter((t) => t._id !== deleteThreadId));
      setDeleteThreadId(null);
      toast({ title: 'Thread deleted successfully!' });
    } catch (error: any) {
      toast({
        title: 'Error deleting thread',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
      setDeleteThreadId(null);
    }
  };

  const isProfessor = user?.role === 'professor' || user?.role === 'admin';

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading forum...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Course Forum
            </CardTitle>
            {user?.role === 'student' && (
              <Button onClick={() => setShowNewThread(!showNewThread)}>
                <Plus className="h-4 w-4 mr-2" />
                New Thread
              </Button>
            )}
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
                    rows={4}
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit">
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewThread(false)}
                    >
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
                <Card
                  key={thread._id}
                  id={`thread-${thread._id}`}
                  className={`border-border transition-all ${
                    thread.isResolved ? 'opacity-75' : ''
                  } ${
                    highlightedThreadId === thread._id
                      ? 'ring-2 ring-primary shadow-lg'
                      : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Thread Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{thread.title}</h4>
                            {thread.isResolved && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{thread.message}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {thread.createdBy.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{thread.createdBy.name}</span>
                            </div>
                            <span>•</span>
                            <span>{new Date(thread.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>{thread.replies?.length || 0} replies</span>
                          </div>
                        </div>
                        {isProfessor && (
                          <div className="flex gap-2">
                            {!thread.isResolved && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveThread(thread._id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteThreadId(thread._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Replies Section */}
                      {thread.replies && thread.replies.length > 0 && (
                        <div className="border-t pt-4 space-y-3">
                          <h5 className="font-medium text-sm">Replies:</h5>
                          {thread.replies.map((reply) => (
                            <div
                              key={reply._id}
                              className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {reply.userId.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {reply.userId.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm">{reply.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Form */}
                      {replyingTo === thread._id ? (
                        <div className="border-t pt-4 space-y-2">
                          <Textarea
                            placeholder="Write your reply..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReply(thread._id)}
                              disabled={!replyMessage.trim()}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Post Reply
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyMessage('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-t pt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(thread._id)}
                          >
                            <Reply className="h-4 w-4 mr-2" />
                            Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteThreadId !== null} onOpenChange={() => setDeleteThreadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this thread? This action cannot be undone and will
              also delete all replies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteThread} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
