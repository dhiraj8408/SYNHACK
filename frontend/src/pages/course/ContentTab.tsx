import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { materialService } from '@/services/materialService';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Upload } from 'lucide-react';

interface ContentTabProps {
  courseId: string;
}

export default function ContentTab({ courseId }: ContentTabProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await materialService.getCourseMaterials(courseId);
        setMaterials(data);
      } catch (error: any) {
        toast({
          title: 'Error loading materials',
          description: error.response?.data?.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [courseId, toast]);

  const isProfessor = user?.role === 'professor' || user?.role === 'admin';

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Study Materials</CardTitle>
          {isProfessor && (
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading materials...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No materials uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((material: any) => (
              <div
                key={material._id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{material.moduleTitle}</h4>
                    <p className="text-sm text-muted-foreground">{material.type}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
