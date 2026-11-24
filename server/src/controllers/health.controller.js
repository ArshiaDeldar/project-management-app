export const getHealth = (req, res) => {
  res.status(200).json({
    message: "Project Management API is running!",
  });
};
