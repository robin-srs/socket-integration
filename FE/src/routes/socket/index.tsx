import { createFileRoute } from "@tanstack/react-router";
import { SocketList } from "../../modules/socket/List";

export const Route = createFileRoute("/socket/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SocketList />;
}
