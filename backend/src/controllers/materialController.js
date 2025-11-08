import Material from "../models/Material.js";

export const addMaterial = async (req, res) => {
  try {
    let fileUrl = null;

    // Priority: link from body > file upload
    if (req.body.link) {
      fileUrl = req.body.link;
    } else if (req.file) {
      // File is saved to disk by multer, create URL to access it
      // In production, you'd upload to cloud storage (S3, etc.) and use that URL
      fileUrl = `/api/materials/files/${req.file.filename}`;
    }

    if (!fileUrl) {
      return res.status(400).json({ message: "Either file or link is required" });
    }

    if (!req.body.moduleTitle || !req.body.type) {
      return res.status(400).json({ message: "moduleTitle and type are required" });
    }

    const created = await Material.create({
      moduleTitle: req.body.moduleTitle,
      type: req.body.type,
      fileUrl: fileUrl,
      courseId: req.body.courseId || null, // Optional
      uploadedBy: req.user.id,
    });

    res.json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listMaterials = async (req, res) => {
  try {
    const { uploadedBy } = req.query;
    
    if (!uploadedBy) {
      return res.status(400).json({ message: "uploadedBy parameter is required" });
    }

    const list = await Material.find({ uploadedBy })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Check if user is the uploader or admin
    if (material.uploadedBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this material" });
    }

    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
