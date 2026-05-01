"use client";

import type { ReactNode } from "react";
import { Hexagon } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  stepTitle?: string;
  children: ReactNode;
  alternateHref?: string;
  alternateLabel?: string;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "var(--background)" }}>
      {/* Left Panel - green gradient */}
      <section
        style={{
          display: "none",
          position: "relative",
          overflow: "hidden",
          width: "55%",
          flexShrink: 0,
          borderRadius: "1.5rem",
          margin: "1rem"
        }}
        className="auth-left-panel"
      >
        {/* Green radial gradient background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 65% 55%, rgba(72, 180, 130, 0.55) 0%, transparent 45%), radial-gradient(ellipse at 25% 85%, rgba(56, 150, 108, 0.40) 0%, transparent 45%), linear-gradient(160deg, #0e3d2d 0%, #0a2418 60%, #061510 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            height: "100%",
            width: "100%",
            flexDirection: "column",
            padding: "3.5rem",
          }}
        >
          {/* Logo Placeholder */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "white", fontWeight: 600, fontSize: "1.25rem" }}>
            <Hexagon style={{ width: "2rem", height: "2rem", fill: "rgba(255,255,255,0.1)" }} />
            <span>InvFlow</span>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {/* Title & subtitle */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", textAlign: "center" }}>
              <h1
                style={{
                  maxWidth: "32rem",
                  fontSize: "2.5rem",
                  fontWeight: 600,
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  color: "white",
                }}
              >
                {title}
              </h1>
              <p
                style={{
                  maxWidth: "28rem",
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {subtitle}
              </p>
            </div>

            {/* Step cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.75rem",
              }}
            >
            {[
              "Crea tu cuenta",
              "Configura tu espacio",
              "Organiza tu inventario",
            ].map((step, index) => {
              const active = index === 0;
              return (
                <div
                  key={step}
                  style={{
                    borderRadius: "1.25rem",
                    border: `1px solid ${active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)"}`,
                    padding: "1.25rem",
                    backdropFilter: "blur(8px)",
                    background: active ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.10)",
                    color: active ? "#111" : "white",
                    boxShadow: active ? "0 8px 32px rgba(0,0,0,0.18)" : "none",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "1.25rem",
                      display: "flex",
                      height: "1.75rem",
                      width: "1.75rem",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: active ? "#111" : "rgba(255,255,255,0.18)",
                      color: active ? "white" : "rgba(255,255,255,0.75)",
                    }}
                  >
                    {index + 1}
                  </div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, lineHeight: 1.4 }}>
                    {step}
                  </p>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel */}
      <section
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1.5rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "30rem", transform: "scale(1.05)", transformOrigin: "center" }}>{children}</div>
      </section>

      <style>{`
        @media (min-width: 1024px) {
          .auth-left-panel {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
