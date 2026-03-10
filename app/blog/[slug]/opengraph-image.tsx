import { ImageResponse } from "next/og";
import { getArticleBySlug } from "@/lib/editorial";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

interface BlogOgProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogOpengraphImage({ params }: BlogOgProps) {
  const { slug } = await params;
  const article = await getArticleBySlug("blog", slug);
  const title = article?.title || "Guide coupon e SEO";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #7c3aed 55%, #c084fc 100%)",
          color: "white",
          padding: "60px",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", fontSize: 28, opacity: 0.88 }}>Blog | codicisconto.eu</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.08, maxWidth: 1020 }}>{title}</div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>Guide editoriali, coupon strategy e contenuti ottimizzati per i motori di ricerca.</div>
        </div>
      </div>
    ),
    size
  );
}
