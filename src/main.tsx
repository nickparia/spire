import "@fontsource-variable/fraunces";
import "@fontsource-variable/outfit";
import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SpireGame } from "@/components/spire-game";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SpireGame />
  </StrictMode>,
);
