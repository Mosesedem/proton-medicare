"use client";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-2 rounded-lg shadow-sm animate-fade-in">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-primary font-bold">
          ₦{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function Overview() {
  const [data, setData] = useState<{ name: string; total: number }[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/health-plans");
        if (!response.ok) {
          throw new Error("Failed to fetch sales data");
        }
        const salesData = await response.json();

        // Get the last 6 months
        const currentDate = new Date();
        const lastSixMonths = MONTHS.slice(
          Math.max(0, currentDate.getMonth() - 5),
          currentDate.getMonth() + 1
        );

        // Create a map of existing sales data
        const salesMap = new Map<string, number>(
          salesData.map((item: any) => [item.name, item.total])
        );

        // Create full 6-month data with existing or zero values
        const fullData = lastSixMonths.map((month) => ({
          name: month,
          total: Number(salesMap.get(month)) || 0,
        }));

        setData(fullData);
        setIsVisible(true);
      } catch (error) {
        console.error("Failed to fetch sales data", error);
        setError("Unable to load sales data");
      }
    }

    loadData();
  }, []);

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="relative">
      <div className="absolute -top-8 left-0">
        <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-sm pt-5 pb-2">
          Monthly Sales
        </span>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
        >
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₦${value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar
            dataKey="total"
            radius={[4, 4, 0, 0]}
            className="fill-primary/80 hover:fill-primary transition-colors duration-200"
          >
            {data.map((entry, index) => (
              <rect
                key={`bar-${index}`}
                className={cn(
                  "animated-bar",
                  isVisible && "animate-bar-grow",
                  `bar-delay-${index + 1}`
                )}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Overview;
