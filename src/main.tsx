import "@fontsource-variable/nunito";
import "@fontsource/im-fell-english-sc";
import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SpireGame } from "@/components/spire-game";

// The painted UI pieces, as CSS variables resolved against the page, so they
// load wherever the game is served from (the stylesheet can't know).
const UI_ART: [string, string][] = [
  ["--ui-panel", "art/ui/panel.webp"],
  ["--ui-button", "art/ui/button.webp"],
  ["--ui-star", "art/ui/star.webp"],
];
for (const [name, file] of UI_ART) {
  document.documentElement.style.setProperty(
    name,
    `url("${new URL(file, document.baseURI).href}")`,
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SpireGame />
  </StrictMode>,
);
