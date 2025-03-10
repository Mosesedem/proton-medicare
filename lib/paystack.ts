// lib/paystack.ts

import Paystack from "paystack";

export function initializePaystack() {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not defined in environment variables.",
    );
  }

  const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);

  return {
    transaction: paystack.transaction,
    plan: paystack.plan,
    subscription: paystack.subscription,
  };
}
