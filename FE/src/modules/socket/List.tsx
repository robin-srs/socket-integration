import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../../providers/Socket.provider";
import { useEffect } from "react";

type SystemMetrics = {
  timestamp: number;
  cpuUsage: string;
  activeUsers: number;
};

interface ChannelMessage {
  channel: string;
  message: string;
}

const MS1_URL = import.meta.env.VITE_MS1_URL;

const useMetrics = () => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch(`${MS1_URL}/metrics`);
      const data = await res.json();
      return data.data as SystemMetrics;
    },
  });

  const { subscribe, unSubscribe, onMessage } = useSocket();

  useEffect(() => {
    subscribe("metrics:dashboard");

    onMessage<ChannelMessage>((msg) => {
      const data = JSON.parse(msg.message) as SystemMetrics;
      qc.setQueryData<SystemMetrics>(["metrics"], data);
    });

    return () => {
      unSubscribe("metrics:dashboard");
    };
  }, [onMessage, qc, subscribe, unSubscribe]);

  return query;
};

export const SocketList = () => {
  //   const { messages } = useSocket<SystemMetrics>({});

  const { data: messages } = useMetrics();
  console.log(messages);

  return (
    <div>
      <div>
        <h1>Metrics</h1>
        {messages && (
          <div className="flex gap-5 px-8 pt-4 font-medium">
            <p>Timestamp: {messages.timestamp}</p>
            <p>CPU Usage: {messages.cpuUsage}</p>
            <p>Active Users: {messages.activeUsers}</p>
          </div>
        )}
      </div>
      <div className=" border-2 m-4 border-black p-5">
        <h1 className="text-lg font-bold">Applications</h1>
        <div className="grid  grid-cols-4 font-semibold">
          <div>App Id</div>
          <div>Name</div>
          <div>Dealer name</div>
          <div>Type</div>
        </div>
        {mockValue.map((item) => {
          return (
            <div className="grid grid-cols-4" key={item.appId}>
              <Link
                to="/socket/$id"
                params={{ id: item.appId }}
                className="text-blue-500 underline font-semibold "
              >
                {item.appId}
              </Link>
              <div>{item.name}</div>
              <div>{item.dealerName}</div>
              <div>{item.type}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const mockValue = [
  {
    appId: "1",
    name: "AutoLease Pro",
    dealerName: "Midtown Motors",
    type: "Vehicle Financing",
  },
  {
    appId: "2",
    name: "HomeQuest",
    dealerName: "Riverside Realty",
    type: "Real Estate",
  },
  {
    appId: "3",
    name: "TechGear Plus",
    dealerName: "Digital Solutions Co",
    type: "Electronics",
  },
  {
    appId: "4",
    name: "FreshMarket",
    dealerName: "Green Valley Grocers",
    type: "Retail",
  },
  {
    appId: "5",
    name: "StyleHub",
    dealerName: "Fashion Forward Inc",
    type: "Apparel",
  },
  {
    appId: "6",
    name: "BookWise",
    dealerName: "Literary Corner",
    type: "Education",
  },
  {
    appId: "7",
    name: "FitTracker",
    dealerName: "Wellness Partners",
    type: "Healthcare",
  },
  {
    appId: "8",
    name: "CraftMaster",
    dealerName: "Artisan Collective",
    type: "Manufacturing",
  },
  {
    appId: "9",
    name: "CloudSync",
    dealerName: "DataFlow Systems",
    type: "Technology",
  },
  {
    appId: "10",
    name: "TravelEase",
    dealerName: "Adventure Travels",
    type: "Tourism",
  },
];
