import { useQuery } from "@tanstack/react-query"

export function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const res = await fetch("/api/news")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
    refetchInterval: 2 * 60 * 60 * 1000, //  auto refresh every 2 hours
  })

  if (isLoading) return <div>Loading news...</div>
  if (error) return <div>Something broke </div>

  return (
    <div style={{ padding: "20px" }}>
      <h1> Minute Ahead</h1>

      {data?.articles?.map((article: any, i: number) => (
        <div key={i} style={{ marginBottom: "20px" }}>
          <h3>{article.title}</h3>
          <p>{article.description}</p>
        </div>
      ))}
    </div>
  )
}