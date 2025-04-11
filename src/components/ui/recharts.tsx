
import React, { useState, useEffect } from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  startEndOnly?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  yAxisWidth?: number;
  showAnimation?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGridLines?: boolean;
  className?: string;
  stack?: boolean;
}

const defaultValueFormatter = (value: number) => value.toString();

export const AreaChart = ({
  data,
  index,
  categories,
  colors = ["blue", "green", "red", "yellow", "purple"],
  valueFormatter = defaultValueFormatter,
  startEndOnly = false,
  showXAxis = true,
  showYAxis = true,
  yAxisWidth = 56,
  showAnimation = true,
  showLegend = true,
  showTooltip = true,
  showGridLines = true,
  className,
}: ChartProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className={cn("flex h-80 w-full items-center justify-center", className)}
      >
        Loading chart...
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    green: "#22c55e", 
    red: "#ef4444",
    yellow: "#eab308",
    purple: "#a855f7",
    indigo: "#6366f1",
  };

  return (
    <div className={cn("h-80 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          {showGridLines && <CartesianGrid strokeDasharray="3 3" />}
          {showXAxis && (
            <XAxis
              dataKey={index}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (startEndOnly) {
                  const isFirst = data.findIndex((d) => d[index] === value) === 0;
                  const isLast = data.findIndex((d) => d[index] === value) === data.length - 1;
                  return isFirst || isLast ? value : "";
                }
                return value;
              }}
            />
          )}
          {showYAxis && (
            <YAxis
              width={yAxisWidth}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => valueFormatter(value)}
            />
          )}
          {showTooltip && <Tooltip formatter={(value) => valueFormatter(Number(value))} />}
          {showLegend && <Legend />}
          {categories.map((category, i) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stackId={category}
              stroke={colorMap[colors[i] || "blue"]}
              fill={colorMap[colors[i] || "blue"]}
              isAnimationActive={showAnimation}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const BarChart = ({
  data,
  index,
  categories,
  colors = ["blue", "green", "red", "yellow", "purple"],
  valueFormatter = defaultValueFormatter,
  startEndOnly = false,
  showXAxis = true,
  showYAxis = true,
  yAxisWidth = 56,
  showAnimation = true,
  showLegend = true,
  showTooltip = true,
  showGridLines = true,
  className,
  stack = false,
}: ChartProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className={cn("flex h-80 w-full items-center justify-center", className)}
      >
        Loading chart...
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    green: "#22c55e", 
    red: "#ef4444",
    yellow: "#eab308",
    purple: "#a855f7",
    indigo: "#6366f1",
  };

  return (
    <div className={cn("h-80 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          {showGridLines && <CartesianGrid strokeDasharray="3 3" />}
          {showXAxis && (
            <XAxis
              dataKey={index}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (startEndOnly) {
                  const isFirst = data.findIndex((d) => d[index] === value) === 0;
                  const isLast = data.findIndex((d) => d[index] === value) === data.length - 1;
                  return isFirst || isLast ? value : "";
                }
                return value;
              }}
            />
          )}
          {showYAxis && (
            <YAxis
              width={yAxisWidth}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => valueFormatter(value)}
            />
          )}
          {showTooltip && <Tooltip formatter={(value) => valueFormatter(Number(value))} />}
          {showLegend && <Legend />}
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              stackId={stack ? "a" : undefined}
              fill={colorMap[colors[i] || "blue"]}
              isAnimationActive={showAnimation}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const LineChart = ({
  data,
  index,
  categories,
  colors = ["blue", "green", "red", "yellow", "purple"],
  valueFormatter = defaultValueFormatter,
  startEndOnly = false,
  showXAxis = true,
  showYAxis = true,
  yAxisWidth = 56,
  showAnimation = true,
  showLegend = true,
  showTooltip = true,
  showGridLines = true,
  className,
}: ChartProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className={cn("flex h-80 w-full items-center justify-center", className)}
      >
        Loading chart...
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    green: "#22c55e", 
    red: "#ef4444",
    yellow: "#eab308",
    purple: "#a855f7",
    indigo: "#6366f1",
  };

  return (
    <div className={cn("h-80 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          {showGridLines && <CartesianGrid strokeDasharray="3 3" />}
          {showXAxis && (
            <XAxis
              dataKey={index}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (startEndOnly) {
                  const isFirst = data.findIndex((d) => d[index] === value) === 0;
                  const isLast = data.findIndex((d) => d[index] === value) === data.length - 1;
                  return isFirst || isLast ? value : "";
                }
                return value;
              }}
            />
          )}
          {showYAxis && (
            <YAxis
              width={yAxisWidth}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => valueFormatter(value)}
            />
          )}
          {showTooltip && <Tooltip formatter={(value) => valueFormatter(Number(value))} />}
          {showLegend && <Legend />}
          {categories.map((category, i) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colorMap[colors[i] || "blue"]}
              isAnimationActive={showAnimation}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
