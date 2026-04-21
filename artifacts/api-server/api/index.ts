import express from "express";

const app = express();

app.get("/api/news", (req, res) => {
  res.json([{ title: "Test News", content: "It works bro 🎉" }]);
});

app.get("/api/news/today", (req, res) => {
  res.json({ message: "Today's news working 🔥" });
});

app.get("/api/preferences", (req, res) => {
  res.json({ theme: "dark", user: "test" });
});

export default app;