"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { useTheme } from "next-themes";

export interface DashboardChartProps {
  data: {
    date: string; // "YYYY-MM-DD"
    entries: number;
    exits: number;
  }[];
}

export function DashboardChart({ data }: DashboardChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === "dark";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "#A3A3A3" : "#52525B",
      },
      grid: {
        vertLines: { color: isDark ? "#27272A" : "#F4F4F5" },
        horzLines: { color: isDark ? "#27272A" : "#F4F4F5" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
    });

    // Histogram series for Exits
    const exitsSeries = chart.addHistogramSeries({
      color: "#EF4444", // red-500
      priceFormat: { type: "volume" },
      priceScaleId: "", 
    });

    // Histogram series for Entries
    const entriesSeries = chart.addHistogramSeries({
      color: "#22C55E", // green-500
      priceFormat: { type: "volume" },
      priceScaleId: "", 
    });

    // Prepare data
    const entriesData = data.map((d) => ({
      time: d.date as any,
      value: d.entries,
      color: "#22C55E",
    }));

    const exitsData = data.map((d) => ({
      time: d.date as any,
      value: d.exits,
      color: "#EF4444",
    }));

    // For overlapping histograms to look correctly, one might need to be stacked, but lightweight-charts doesn't natively support stacked histograms.
    // Instead we can use Two LineSeries if requested, or keep it as histogram that overlays.
    // To make it look like "Activity", maybe we just show net change with an Area series?
    chart.removeSeries(exitsSeries);
    chart.removeSeries(entriesSeries);

    const netSeries = chart.addAreaSeries({
      lineColor: isDark ? "#3B82F6" : "#2563EB",
      topColor: isDark ? "rgba(59, 130, 246, 0.4)" : "rgba(37, 99, 235, 0.4)",
      bottomColor: isDark ? "rgba(59, 130, 246, 0.0)" : "rgba(37, 99, 235, 0.0)",
    });

    const netData = data.map((d) => ({
      time: d.date as any,
      value: d.entries + d.exits, // overall activity volume
    }));

    netSeries.setData(netData);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, theme]);

  return (
    <div className="w-full h-[300px]" ref={chartContainerRef} />
  );
}
