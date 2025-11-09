import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/context/AuthContext";
import { materialService } from "@/services/materialService";
import { progressService } from "@/services/progressService";
import ModuleQuestions from "@/components/ModuleQuestions";
import { useToast } from "@/hooks/use-toast";
import {
    FileText,
    Download,
    Upload,
    Link as LinkIcon,
    X,
    CheckCircle2,
    Circle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ingestDocuments } from "@/services/chatbotService";
import MaterialViewer from "@/components/MaterialViewer";

interface ContentTabProps {
    courseId: string;
}

export default function ContentTab({ courseId }: ContentTabProps) {
    const { user } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [progress, setProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadType, setUploadType] = useState<"file" | "link">("file");
    const [uploadData, setUploadData] = useState({
        module: "",
        moduleTitle: "",
        type: "pdf",
        file: null as File | null,
        link: "",
        driveLinks: [] as string[],
    });
    const [uploading, setUploading] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
    const [showMaterialDialog, setShowMaterialDialog] = useState(false);
    const { toast } = useToast();

    const isProfessor = user?.role === "professor" || user?.role === "admin";
    const isStudent = user?.role === "student";

    useEffect(() => {
        const fetchData = async () => {
            if (!courseId) return;

            try {
                const [materialsData, progressData] = await Promise.all([
                    materialService.getMaterialsByCourse(courseId),
                    isStudent
                        ? progressService
                              .getProgress(courseId)
                              .catch(() => null)
                        : Promise.resolve(null),
                ]);

                setMaterials(materialsData);
                setProgress(progressData);
            } catch (error: any) {
                toast({
                    title: "Error loading materials",
                    description:
                        error.response?.data?.message ||
                        "Failed to load materials",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId, toast, isStudent]);

    // Group materials by module
    const groupedMaterials = materials.reduce((acc: any, material: any) => {
        const module = material.module || "Optional Materials";
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(material);
        return acc;
    }, {});

    const handleUpload = async () => {
        if (!uploadData.module || !uploadData.moduleTitle || !uploadData.type) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        if (uploadType === "file" && !uploadData.file) {
            toast({
                title: "Validation Error",
                description: "Please select a file to upload",
                variant: "destructive",
            });
            return;
        }

        if (uploadType === "link") {
            // Check if we have drive links or regular link
            const hasDriveLinks = uploadData.driveLinks.length > 0;
            const hasRegularLink = uploadData.link.trim() !== "";
            
            if (!hasDriveLinks && !hasRegularLink) {
                toast({
                    title: "Validation Error",
                    description: "Please add at least one link",
                    variant: "destructive",
                });
                return;
            }
        }

        setUploading(true);
        try {
            // Process multiple drive links if present
            if (uploadType === "link" && uploadData.driveLinks.length > 0) {
                const linksToProcess = uploadData.driveLinks.filter(link => link.trim() !== "");
                
                if (linksToProcess.length === 0) {
                    toast({
                        title: "Validation Error",
                        description: "Please add at least one valid drive link",
                        variant: "destructive",
                    });
                    setUploading(false);
                    return;
                }

                // Upload each drive link as a separate material
                for (const driveLink of linksToProcess) {
                    const formData = new FormData();
                    formData.append("module", uploadData.module);
                    formData.append("moduleTitle", uploadData.moduleTitle);
                    formData.append("type", uploadData.type);
                    formData.append("courseId", courseId);
                    formData.append("link", driveLink.trim());

                    await materialService.uploadMaterial(formData);
                    
                    // Ingest each drive link into RAG system
                    if (driveLink.includes("drive.google.com")) {
                        try {
                            await ingestDocuments({ drive_link: driveLink.trim() });
                        } catch (ingestError) {
                            console.error(`Failed to ingest ${driveLink}:`, ingestError);
                            // Continue with other links even if one fails
                        }
                    }
                }

                toast({
                    title: "Success",
                    description: `${linksToProcess.length} material(s) uploaded and being ingested`,
                });
            } else if (uploadType === "link" && uploadData.link.trim() !== "") {
                // Handle single regular link (backward compatibility)
                const formData = new FormData();
                formData.append("module", uploadData.module);
                formData.append("moduleTitle", uploadData.moduleTitle);
                formData.append("type", uploadData.type);
                formData.append("courseId", courseId);
                formData.append("link", uploadData.link);

                await materialService.uploadMaterial(formData);
                if (uploadData.link.includes("drive.google.com")) {
                    await ingestDocuments({ drive_link: uploadData.link });
                }

                toast({
                    title: "Success",
                    description: "Material uploaded successfully",
                });
            } else if (uploadType === "file" && uploadData.file) {
                // Handle file upload
                const formData = new FormData();
                formData.append("module", uploadData.module);
                formData.append("moduleTitle", uploadData.moduleTitle);
                formData.append("type", uploadData.type);
                formData.append("courseId", courseId);
                formData.append("file", uploadData.file);

                await materialService.uploadMaterial(formData);

                toast({
                    title: "Success",
                    description: "Material uploaded successfully",
                });
            }

            // Reset form
            setUploadData({
                module: "",
                moduleTitle: "",
                type: "pdf",
                file: null,
                link: "",
                driveLinks: [],
            });
            setUploadDialogOpen(false);

            // Refresh materials list
            const data = await materialService.getMaterialsByCourse(courseId);
            setMaterials(data);
        } catch (error: any) {
            toast({
                title: "Upload Failed",
                description:
                    error.response?.data?.message ||
                    "Failed to upload material",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (material: any) => {
        if (material.fileUrl) {
            // If it's a relative path, prepend the API base URL
            let url = material.fileUrl;
            if (url.startsWith("/api/")) {
                const API_BASE_URL =
                    import.meta.env.VITE_BACKEND_API_URL ||
                    "http://localhost:5000";
                url = `${API_BASE_URL}${url}`;
            }
            window.open(url, "_blank");
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
                title: isComplete
                    ? "Module Completed"
                    : "Module Marked Incomplete",
                description: `${module} ${
                    isComplete ? "marked as complete" : "marked as incomplete"
                }`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description:
                    error.response?.data?.message ||
                    "Failed to update progress",
                variant: "destructive",
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
                                        {progress.completedCount} of{" "}
                                        {progress.totalModules} modules
                                        completed
                                    </p>
                                    {progress.totalQuestions !== undefined && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {progress.answeredQuestions || 0} of{" "}
                                            {progress.totalQuestions} questions
                                            answered
                                        </p>
                                    )}
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="text-lg font-semibold"
                                >
                                    {progress.percentage}%
                                </Badge>
                            </div>
                            <Progress
                                value={progress.percentage}
                                className="h-3 bg-purple-100"
                                indicatorClassName="bg-purple-700"
                            />
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
                            <Dialog
                                open={uploadDialogOpen}
                                onOpenChange={setUploadDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Material
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Upload Material
                                        </DialogTitle>
                                        <DialogDescription>
                                            Upload a file or provide a link to
                                            share study materials
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="module">
                                                Module
                                            </Label>
                                            <Input
                                                id="module"
                                                placeholder="e.g., Module 1, Module 2, Week 1"
                                                value={uploadData.module}
                                                onChange={(e) =>
                                                    setUploadData({
                                                        ...uploadData,
                                                        module: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Categorize this material into a
                                                module (e.g., "Module 1", "Week
                                                1")
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="moduleTitle">
                                                Material Title
                                            </Label>
                                            <Input
                                                id="moduleTitle"
                                                placeholder="e.g., Introduction to Algorithms"
                                                value={uploadData.moduleTitle}
                                                onChange={(e) =>
                                                    setUploadData({
                                                        ...uploadData,
                                                        moduleTitle:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="type">
                                                Material Type
                                            </Label>
                                            <Select
                                                value={uploadData.type}
                                                onValueChange={(value) =>
                                                    setUploadData({
                                                        ...uploadData,
                                                        type: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pdf">
                                                        PDF
                                                    </SelectItem>
                                                    <SelectItem value="ppt">
                                                        PowerPoint
                                                    </SelectItem>
                                                    <SelectItem value="link">
                                                        Link
                                                    </SelectItem>
                                                    <SelectItem value="image">
                                                        Image
                                                    </SelectItem>
                                                    <SelectItem value="video">
                                                        Video
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Upload Method</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={
                                                        uploadType === "file"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    onClick={() =>
                                                        setUploadType("file")
                                                    }
                                                    className="flex-1"
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Upload File
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        uploadType === "link"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    onClick={() => {
                                                        setUploadType("link");
                                                        // Initialize with one empty drive link if none exist
                                                        if (uploadData.driveLinks.length === 0) {
                                                            setUploadData({
                                                                ...uploadData,
                                                                driveLinks: [""],
                                                            });
                                                        }
                                                    }}
                                                    className="flex-1"
                                                >
                                                    <LinkIcon className="h-4 w-4 mr-2" />
                                                    Add Link
                                                </Button>
                                            </div>
                                        </div>

                                        {uploadType === "file" ? (
                                            <div className="space-y-2">
                                                <Label htmlFor="file">
                                                    File
                                                </Label>
                                                <Input
                                                    id="file"
                                                    type="file"
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files?.[0];
                                                        if (file) {
                                                            setUploadData({
                                                                ...uploadData,
                                                                file,
                                                            });
                                                        }
                                                    }}
                                                />
                                                {uploadData.file && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <FileText className="h-4 w-4" />
                                                        <span>
                                                            {
                                                                uploadData.file
                                                                    .name
                                                            }
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                setUploadData({
                                                                    ...uploadData,
                                                                    file: null,
                                                                })
                                                            }
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>
                                                        Google Drive Links
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Add multiple Google Drive links for this module. Each link will be uploaded and ingested into the chatbot.
                                                    </p>
                                                    <div className="space-y-2">
                                                        {uploadData.driveLinks.map((link, index) => (
                                                            <div key={index} className="flex gap-2">
                                                                <Input
                                                                    type="url"
                                                                    placeholder="https://drive.google.com/file/d/..."
                                                                    value={link}
                                                                    onChange={(e) => {
                                                                        const newLinks = [...uploadData.driveLinks];
                                                                        newLinks[index] = e.target.value;
                                                                        setUploadData({
                                                                            ...uploadData,
                                                                            driveLinks: newLinks,
                                                                        });
                                                                    }}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        const newLinks = uploadData.driveLinks.filter((_, i) => i !== index);
                                                                        setUploadData({
                                                                            ...uploadData,
                                                                            driveLinks: newLinks,
                                                                        });
                                                                    }}
                                                                    className="flex-shrink-0"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setUploadData({
                                                                    ...uploadData,
                                                                    driveLinks: [...uploadData.driveLinks, ""],
                                                                });
                                                            }}
                                                            className="w-full"
                                                        >
                                                            <LinkIcon className="h-4 w-4 mr-2" />
                                                            Add Another Drive Link
                                                        </Button>
                                                    </div>
                                                </div>
                                                
                                                {/* Keep single link option for backward compatibility */}
                                                <div className="space-y-2 border-t pt-4">
                                                    <Label htmlFor="link">
                                                        Or Single Link URL (Optional)
                                                    </Label>
                                                    <Input
                                                        id="link"
                                                        type="url"
                                                        placeholder="https://example.com/material"
                                                        value={uploadData.link}
                                                        onChange={(e) =>
                                                            setUploadData({
                                                                ...uploadData,
                                                                link: e.target.value,
                                                            })
                                                        }
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Use this for non-Google Drive links
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setUploadDialogOpen(false)
                                                }
                                                disabled={uploading}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleUpload}
                                                disabled={uploading}
                                            >
                                                {uploading
                                                    ? "Uploading..."
                                                    : "Upload"}
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
                            <p className="mt-4 text-muted-foreground">
                                Loading materials...
                            </p>
                        </div>
                    ) : Object.keys(groupedMaterials).length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                No materials uploaded yet
                            </p>
                        </div>
                    ) : (
                        <Accordion type="multiple" className="w-full">
                            {Object.entries(groupedMaterials)
                                .sort(([a], [b]) => {
                                    // Sort modules naturally (Module 1, Module 2, etc.)
                                    const numA = parseInt(
                                        a.match(/\d+/)?.[0] || "999"
                                    );
                                    const numB = parseInt(
                                        b.match(/\d+/)?.[0] || "999"
                                    );
                                    return numA - numB;
                                })
                                .map(
                                    ([module, moduleMaterials]: [
                                        string,
                                        any
                                    ]) => {
                                        const isComplete =
                                            isModuleComplete(module);
                                        return (
                                            <AccordionItem
                                                key={module}
                                                value={module}
                                                className="border-border"
                                            >
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="flex items-center gap-3 w-full pr-4">
                                                        {isStudent && (
                                                            <Checkbox
                                                                checked={
                                                                    isComplete
                                                                }
                                                                onCheckedChange={(
                                                                    checked
                                                                ) =>
                                                                    handleModuleToggle(
                                                                        module,
                                                                        checked as boolean
                                                                    )
                                                                }
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
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
                                                            <h3 className="font-semibold text-lg">
                                                                {module}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                {
                                                                    moduleMaterials.length
                                                                }{" "}
                                                                material
                                                                {moduleMaterials.length !==
                                                                1
                                                                    ? "s"
                                                                    : ""}
                                                                {progress
                                                                    ?.moduleCompletion?.[
                                                                    module
                                                                ] && (
                                                                    <span className="ml-2">
                                                                        •{" "}
                                                                        {
                                                                            progress
                                                                                .moduleCompletion[
                                                                                module
                                                                            ]
                                                                                .answeredQuestions
                                                                        }
                                                                        /
                                                                        {
                                                                            progress
                                                                                .moduleCompletion[
                                                                                module
                                                                            ]
                                                                                .totalQuestions
                                                                        }{" "}
                                                                        questions
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        {isStudent &&
                                                            isComplete && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="ml-auto"
                                                                >
                                                                    Completed
                                                                </Badge>
                                                            )}
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-4 pt-2">
                                                        <div className="space-y-3">
                                                            {moduleMaterials.map(
                                                                (
                                                                    material: any
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            material._id
                                                                        }
                                                                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                                                                    >
                                                                        <div 
                                                                            className="flex items-center gap-3 flex-1 cursor-pointer"
                                                                            onClick={() => {
                                                                                setSelectedMaterial(material);
                                                                                setShowMaterialDialog(true);
                                                                            }}
                                                                        >
                                                                            <FileText className="h-5 w-5 text-primary" />
                                                                            <div>
                                                                                <h4 className="font-medium">
                                                                                    {
                                                                                        material.moduleTitle
                                                                                    }
                                                                                </h4>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    {material.type.toUpperCase()}
                                                                                    {material.type ===
                                                                                        "link" && (
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
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDownload(material);
                                                                            }}
                                                                        >
                                                                            <Download className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>

                                                        {/* Module Questions */}
                                                        <ModuleQuestions
                                                            courseId={courseId}
                                                            module={module}
                                                        />
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    }
                                )}
                        </Accordion>
                    )}
                </CardContent>
            </Card>

            {/* Material Viewer Dialog */}
            <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedMaterial && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selectedMaterial.moduleTitle}</DialogTitle>
                                <DialogDescription>
                                    {selectedMaterial.module} • {selectedMaterial.type.toUpperCase()}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                                <MaterialViewer
                                    fileUrl={selectedMaterial.fileUrl}
                                    fileName={selectedMaterial.moduleTitle}
                                    fileType={selectedMaterial.type}
                                    materialId={selectedMaterial._id}
                                    courseId={courseId}
                                    isCompleted={progress?.completedMaterials?.includes(selectedMaterial._id)}
                                />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
