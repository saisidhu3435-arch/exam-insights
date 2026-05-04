export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://newsapi.org/v2/top-headlines?country=in&apiKey=366aebe07bb74ff0943ebc3cc5638d4a"
    )

    const data = await response.json()

    res.status(200).json({
      articles: data.articles || []
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" })
  }
}