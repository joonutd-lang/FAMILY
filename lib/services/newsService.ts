import type { NewsItem, NewsCategory } from "@/types/familyHub";
import { mockDelay } from "./mockDelay";

function generate(category: NewsCategory): NewsItem[] {
  const now = Date.now();
  const mk = (idx: number) => {
    const id = `news_${category}_${idx}`;
    return {
      id,
      title: `${category} headline #${idx + 1}: something families will actually care about`,
      url: `https://example.com/news/${category}/${idx + 1}`,
      source: "Family Hub News",
      publishedAt: new Date(now - (idx + 1) * 1000 * 60 * 37).toISOString(),
      category,
    } as NewsItem;
  };
  const size = category === "Top" ? 6 : 5;
  return Array.from({ length: size }, (_, i) => mk(i));
}

export const newsService = {
  async getTopNews(category: NewsCategory): Promise<NewsItem[]> {
    await mockDelay(500);
    // "Top" means mix; we still mock a single category result list for UI simplicity.
    return generate(category);
  },
};

