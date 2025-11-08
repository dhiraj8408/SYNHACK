import Material from "../models/Material.js";

export const addMaterial = async (req, res) => {
  const created = await Material.create({
    ...req.body,
    uploadedBy: req.user.id,
  });

  res.json(created);
};

export const listMaterials = async (req, res) => {
  const { courseId } = req.query;
  const list = await Material.find({ courseId });
  res.json(list);
};

export const removeMaterial = async (req, res) => {
  await Material.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};
