import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #60a5fa 100%)",
          color: "white",
          padding: "64px",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.88 }}>codicisconto.eu</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
            Coupon, offerte e news ottimizzate per Search e Discover
          </div>
          <div style={{ fontSize: 30, opacity: 0.88, maxWidth: 940 }}>
            Amazon, merchant selezionati, guida editoriale e monitoraggio promozioni aggiornato.
          </div>
        </div>
      </div>
    ),
    size
  );
}
