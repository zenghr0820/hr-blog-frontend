"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "./CardCountdown.module.css";

interface CardCountdownProps {
  targetDate?: string;
  targetName?: string;
}

interface HolidayData {
  name: string;
  date: string;
  type?: string;
}

interface ProgressItem {
  text: string;
  unit: string;
  remaining: number;
  percentage: number;
}

async function fetchNextHoliday(): Promise<HolidayData | null> {
  try {
    const resp = await fetch("/api/public/holiday/next");
    const json = await resp.json();
    if (json.code === 200 && json.data) {
      return { name: json.data.name, date: json.data.date, type: json.data.type };
    }
    return null;
  } catch {
    return null;
  }
}

function useNextHoliday() {
  return useQuery<HolidayData | null>({
    queryKey: ["next-holiday"],
    queryFn: fetchNextHoliday,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

function calcDayProgress(): { remaining: number; percentage: number } {
  const hours = new Date().getHours();
  return { remaining: 24 - hours, percentage: (hours / 24) * 100 };
}

function calcWeekProgress(): { remaining: number; percentage: number } {
  const day = new Date().getDay();
  const passed = day === 0 ? 6 : day - 1;
  return { remaining: 6 - passed, percentage: ((passed + 1) / 7) * 100 };
}

function calcMonthProgress(): { remaining: number; percentage: number } {
  const now = new Date();
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const passed = now.getDate() - 1;
  return { remaining: total - passed, percentage: (passed / total) * 100 };
}

function calcYearProgress(): { remaining: number; percentage: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const total = 365 + (now.getFullYear() % 4 === 0 ? 1 : 0);
  const passed = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return { remaining: total - passed, percentage: (passed / total) * 100 };
}

function getProgressItems(): ProgressItem[] {
  const day = calcDayProgress();
  const week = calcWeekProgress();
  const month = calcMonthProgress();
  const year = calcYearProgress();

  return [
    { text: "今日", unit: "小时", ...day },
    { text: "本周", unit: "天", ...week },
    { text: "本月", unit: "天", ...month },
    { text: "本年", unit: "天", ...year },
  ];
}

function calcDaysUntil(targetDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

export const CardCountdown = memo(function CardCountdown({ targetDate, targetName }: CardCountdownProps) {
  const [items, setItems] = useState<ProgressItem[]>([]);
  const { data: holiday } = useNextHoliday();

  const update = useCallback(() => {
    setItems(getProgressItems());
  }, []);

  useEffect(() => {
    update();
    const timer = setInterval(update, 600000);
    return () => clearInterval(timer);
  }, [update]);

  if (items.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const customDateValid = targetDate && new Date(targetDate) >= today;
  const holidayDateValid = holiday && new Date(holiday.date) >= today;

  let displayDate = "";
  let displayName = "";

  if (customDateValid && holidayDateValid) {
    if (new Date(targetDate!) <= new Date(holiday.date)) {
      displayDate = targetDate!;
      displayName = targetName || "";
    } else {
      displayDate = holiday.date;
      displayName = holiday.name;
    }
  } else if (customDateValid) {
    displayDate = targetDate!;
    displayName = targetName || "";
  } else if (holidayDateValid) {
    displayDate = holiday.date;
    displayName = holiday.name;
  }

  const daysUntil = displayDate ? calcDaysUntil(displayDate) : 0;

  return (
    <div className={styles.cardCountdown}>
      <div className={styles.itemContent}>
        {displayDate && (
          <div className={styles.countLeft}>
            <span className={styles.text}>距离</span>
            <span className={styles.name}>{displayName}</span>
            <span className={styles.time}>{daysUntil}</span>
            <span className={styles.date}>{displayDate}</span>
          </div>
        )}
        <div className={styles.countRight}>
          {items.map(item => (
            <div key={item.text} className={styles.countItem}>
              <div className={styles.itemName}>{item.text}</div>
              <div className={styles.itemProgress}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${item.percentage}%`, opacity: item.percentage / 100 }}
                />
                <span className={`${styles.percentage} ${item.percentage >= 46 ? styles.many : ""}`}>
                  <span className={styles.tip}>还剩</span>
                  {item.remaining}
                  <span className={styles.tip}>{item.unit}</span>
                </span>
                <span className={`${styles.remaining} ${item.percentage >= 60 ? styles.many : ""}`}>
                  {item.percentage.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

CardCountdown.displayName = "CardCountdown";

export default CardCountdown;
