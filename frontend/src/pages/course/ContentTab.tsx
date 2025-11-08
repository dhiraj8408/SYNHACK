import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/context/AuthContext';
import { materialService } from '@/services/materialService';
import { progressService } from '@/services/progressService';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Upload, Link as LinkIcon, X, CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ContentTabProps {
  courseId: string;
}

export default function ContentTab({ courseId }: ContentTabProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [uploadData, setUploadData] = useState({
    module: '',
    moduleTitle: '',
    type: 'pdf',
    file: null as File | null,
    link: '',
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const isProfessor = user?.role === 'professor' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      
      try {
        const [materialsData, progressData] = await Promise.all([
          materialService.getMaterialsByCourse(courseId),
          isStudent ? progressService.getProgress(courseId).catch(() => null) : Promise.resolve(null),
        ]);
        
        setMaterials(materialsData);
        setProgress(progressData);
      } catch (error: any) {
        toast({
          title: 'Error loading materials',
          description: error.response?.data?.message || 'Failed to load materials',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, toast, isStudent]);

  // Group materials by module
  const groupedMaterials = materials.reduce((acc: any, material: any) => {
    const module = material.module || 'Uncategorized';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(material);
    return acc;
  }, {});

  const handleUpload = async () => {
    if (!uploadData.module || !uploadData.moduleTitle || !uploadData.type) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (uploadType === 'file' && !uploadData.file) {
      toast({
        title: 'Validation Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (uploadType === 'link' && !uploadData.link) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a link',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('module', uploadData.module);
      formData.append('moduleTitle', uploadData.moduleTitle);
      formData.append('type', uploadData.type);
      formData.append('courseId', courseId);
      
      if (uploadType === 'file' && uploadData.file) {
        formData.append('file', uploadData.file);
      } else if (uploadType === 'link') {
        formData.append('link', uploadData.link);
      }

      await materialService.uploadMaterial(formData);
      
      toast({
        title: 'Success',
        description: 'Material uploaded successfully',
      });

      // Reset form
      setUploadData({
        module: '',
        moduleTitle: '',
        type: 'pdf',
        file: null,
        link: '',
      });
      setUploadDialogOpen(false);

      // Refresh materials list
      const data = await materialService.getMaterialsByCourse(courseId);
      setMaterials(data);
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.message || 'Failed to upload material',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (material: any) => {
    if (material.fileUrl) {
      // If it's a relative path, prepend the API base URL
      let url = material.fileUrl;
      if (url.startsWith('/api/')) {
        const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';
        url = `${API_BASE_URL}${url}`;
      }
      window.open(url, '_blank');
    }
  };

  const handleModuleToggle = async (module: string, isComplete: boolean) => {
    if (!isStudent) return;

    try {
      if (isComplete) {
        await progressService.markModuleComplete(courseId, module);
      } else {
        await progressService.markModuleIncomplete(courseId, module);
      }

      // Refresh progress
      const progressData = await progressService.getProgress(courseId);
      setProgress(progressData);

      toast({
        title: isComplete ? 'Module Completed' : 'Module Marked Incomplete',
        description: `${module} ${isComplete ? 'marked as complete' : 'marked as incomplete'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update progress',
        variant: 'destructive',
      });
    }
  };

  const isModuleComplete = (module: string) => {
    return progress?.completedModules?.includes(module) || false;
  };

  return (
    <div className="space-y-6">
      {/* Progress Tracker for Students */}
      {isStudent && progress && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {progress.completedCount} of {progress.totalModules} modules completed
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg font-semibold">
                  {progress.percentage}%
                </Badge>
              </div>
              <Progress value={progress.percentage} className="h-3" />
              <p className="text-xs text-muted-foreground">
                Keep going! You're making great progress.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials Section */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Study Materials</CardTitle>
            {isProfessor && (
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Upload Material</DialogTitle>
                    <DialogDescription>
                      Upload a file or provide a link to share study materials
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="module">Module</Label>
                      <Input
                        id="module"
                        placeholder="e.g., Module 1, Module 2, Week 1"
                        value={uploadData.module}
                        onChange={(e) =>
                          setUploadData({ ...uploadData, module: e.target.value })
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Categorize this material into a module (e.g., "Module 1", "Week 1")
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="moduleTitle">Material Title</Label>
                      <Input
                        id="moduleTitle"
                        placeholder="e.g., Introduction to Algorithms"
                        value={uploadData.moduleTitle}
                        onChange={(e) =>
                          setUploadData({ ...uploadData, moduleTitle: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Material Type</Label>
                      <Select
                        value={uploadData.type}
                        onValueChange={(value) =>
                          setUploadData({ ...uploadData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="ppt">PowerPoint</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Upload Method</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={uploadType === 'file' ? 'default' : 'outline'}
                          onClick={() => setUploadType('file')}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload File
                        </Button>
                        <Button
                          type="button"
                          variant={uploadType === 'link' ? 'default' : 'outline'}
                          onClick={() => setUploadType('link')}
                          className="flex-1"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Add Link
                        </Button>
                      </div>
                    </div>

                    {uploadType === 'file' ? (
                      <div className="space-y-2">
                        <Label htmlFor="file">File</Label>
                        <Input
                          id="file"
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadData({ ...uploadData, file });
                            }
                          }}
                        />
                        {uploadData.file && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{uploadData.file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setUploadData({ ...uploadData, file: null })}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="link">Link URL</Label>
                        <Input
                          id="link"
                          type="url"
                          placeholder="https://example.com/material"
                          value={uploadData.link}
                          onChange={(e) =>
                            setUploadData({ ...uploadData, link: e.target.value })
                          }
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setUploadDialogOpen(false)}
                        disabled={uploading}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpload} disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload'}
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
              <p className="mt-4 text-muted-foreground">Loading materials...</p>
            </div>
          ) : Object.keys(groupedMaterials).length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No materials uploaded yet</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedMaterials)
                .sort(([a], [b]) => {
                  // Sort modules naturally (Module 1, Module 2, etc.)
                  const numA = parseInt(a.match(/\d+/)?.[0] || '999');
                  const numB = parseInt(b.match(/\d+/)?.[0] || '999');
                  return numA - numB;
                })
                .map(([module, moduleMaterials]: [string, any]) => {
                  const isComplete = isModuleComplete(module);
                  return (
                    <AccordionItem key={module} value={module} className="border-border">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 w-full pr-4">
                          {isStudent && (
                            <Checkbox
                              checked={isComplete}
                              onCheckedChange={(checked) =>
                                handleModuleToggle(module, checked as boolean)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="mr-2"
                            />
                          )}
                          {isStudent && (
                            <div className="flex-shrink-0">
                              {isComplete ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-lg">{module}</h3>
                            <p className="text-sm text-muted-foreground">
                              {moduleMaterials.length} material{moduleMaterials.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {isStudent && isComplete && (
                            <Badge variant="secondary" className="ml-auto">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {moduleMaterials.map((material: any) => (
                            <div
                              key={material._id}
                              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary" />
                                <div>
                                  <h4 className="font-medium">{material.moduleTitle}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {material.type.toUpperCase()}
                                    {material.type === 'link' && (
                                      <span className="ml-2">
                                        <LinkIcon className="h-3 w-3 inline" />
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(material)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
