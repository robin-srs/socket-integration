import { createFileRoute } from "@tanstack/react-router";
import { SocketDetails } from "../../modules/socket/Details";

export const Route = createFileRoute("/socket/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SocketDetails />;
}
