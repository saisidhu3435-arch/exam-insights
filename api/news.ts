// api/news.ts

import { cachedNews } from "./update-news"

export default function handler(req, res) {
  try {
    res.status(200).json({
      news: cachedNews
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to get news" })
  }
}