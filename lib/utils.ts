import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Transaction } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function calculateCommission(transactions: Transaction[]) {
  const total = transactions.reduce((acc, curr) => {
    // Apply commission rate based on amount
    let commission = curr.amount * 0.1; // 10% commission

    // Cap commission at 10,000
    if (commission > 10000) {
      commission = 10000;
    }

    return acc + commission;
  }, 0);

  return total;
}
