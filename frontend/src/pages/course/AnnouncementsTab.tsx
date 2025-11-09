import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useAuth } from '@/context/AuthContext';
import { announcementService } from '@/services/announcementService';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Plus, Trash2, Calendar } from 'lucide-react';

interface AnnouncementsTabProps {
  courseId: string;
}

interface Announcement {
  _id: string;
  title: string;
  message: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function AnnouncementsTab({ courseId }: AnnouncementsTabProps) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const isProfessor = user?.role === 'professor' || user?.role === 'admin';

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        const data = await announcementService.getAnnouncements(courseId); // Pass courseId for course-specific announcements
        setAnnouncements(data);
      } catch (error: any) {
        toast({
          title: 'Error loading announcements',
          description: error.response?.data?.message || 'Failed to load announcements',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [courseId, toast]);

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in both title and message',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const newAnnouncement = await announcementService.createAnnouncement(
        formData.title,
        formData.message,
        courseId
      );

      setAnnouncements([newAnnouncement, ...announcements]);
      setFormData({ title: '', message: '' });
      setCreateDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Announcement published successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create announcement',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (announcementId: string) => {
    setAnnouncementToDelete(announcementId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return;

    try {
      await announcementService.deleteAnnouncement(announcementToDelete);
      setAnnouncements(announcements.filter((a) => a._id !== announcementToDelete));
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);

      toast({
        title: 'Success',
        description: 'Announcement deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete announcement',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </CardTitle>
            {isProfessor && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                    <DialogDescription>
                      Publish a message that will be visible to all students in this course
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Important: Assignment Due Date Changed"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Enter your announcement message here..."
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        rows={6}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCreateDialogOpen(false);
                          setFormData({ title: '', message: '' });
                        }}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAnnouncement} disabled={submitting}>
                        {submitting ? 'Publishing...' : 'Publish Announcement'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isProfessor
                  ? 'No announcements yet. Create one to get started!'
                  : 'No announcements have been posted yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement._id} className="border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(announcement.createdBy.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{announcement.title}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              Professor
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {announcement.createdBy.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(announcement.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {isProfessor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(announcement._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{announcement.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAnnouncementToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

