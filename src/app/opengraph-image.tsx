import { ImageResponse } from "next/og";

export const alt = "ibbrazil.ai — Brazil and global M&A news";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0c0a",
          color: "#d6d4c8",
          padding: "56px 64px",
          border: "8px solid #c4a35a",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#c4a35a",
            fontFamily: "ui-monospace, Menlo, monospace",
          }}
        >
          ibbrazil.ai
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.1,
              fontWeight: 650,
              color: "#f3f0e4",
              maxWidth: 980,
            }}
          >
            Brazil + Global M&A news
          </div>
          <div style={{ fontSize: 28, color: "#8b8a7e", maxWidth: 900 }}>
            Mergers, acquisitions, private equity and VC. Fusões e aquisições no
            Brasil e no mundo.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
