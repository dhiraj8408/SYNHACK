export const askBot = async (req, res) => {
  res.json({
    answer: `This is a placeholder response to: "${req.body.message}"`,
    links: [
      { title: "Material Link", url: "https://example.com/material.pdf" },
    ],
  });
};
