import { cachedNews } from "./update-news"

export default async function handler(req, res) {
  try {
    res.status(200).json({
      articles: cachedNews
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to get news" })
  }
}