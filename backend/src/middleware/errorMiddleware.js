export const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
};
