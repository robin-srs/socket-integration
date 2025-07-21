import { useMutation } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useSocket } from "../../providers/Socket.provider";
import { useEffect, useState } from "react";

const MS1_URL = import.meta.env.VITE_MS1_URL;

const useEventsCall = () => {
  return useMutation({
    mutationFn: (appId: string) => {
      return fetch(`${MS1_URL}/events/${appId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Decision",
          event: "do decision",
        }),
      });
    },
  });
};

export const SocketDetails = () => {
  const { id } = useParams({ from: "/socket/$id" });
  const { mutate } = useEventsCall();

  const [message, setMessage] = useState("");
  const { subscribe, unSubscribe, onMessage } = useSocket();

  useEffect(() => {
    subscribe(`events:${id}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMessage((msg: any) => {
      console.log(msg);
      setMessage(msg.message);
    });

    return () => {
      unSubscribe(`events:${id}`);
    };
  }, [subscribe, id, onMessage, unSubscribe]);

  return (
    <div className="flex flex-col gap-4 item-start justify-start">
      <div>Message: {message}</div>
      <button
        className="border w-52 hover:bg-gray-100"
        type="button"
        onClick={() => {
          mutate(id);
        }}
      >
        Call Events
      </button>
    </div>
  );
};
