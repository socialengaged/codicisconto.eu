import { ImageResponse } from "next/og";
import { getArticleBySlug } from "@/lib/editorial";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

interface NewsOgProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsOpengraphImage({ params }: NewsOgProps) {
  const { slug } = await params;
  const article = await getArticleBySlug("news", slug);
  const title = article?.title || "News coupon e offerte";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #172554 0%, #1d4ed8 55%, #60a5fa 100%)",
          color: "white",
          padding: "60px",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", fontSize: 28, opacity: 0.88 }}>News | codicisconto.eu</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.08, maxWidth: 1020 }}>{title}</div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>Promozioni, contesto editoriale e aggiornamenti utili per Search e Discover.</div>
        </div>
      </div>
    ),
    size
  );
}
