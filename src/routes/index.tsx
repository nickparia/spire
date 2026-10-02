import { createFileRoute } from "@tanstack/react-router";
import { SpireGame } from "@/components/spire-game";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SpireGame />;
}
