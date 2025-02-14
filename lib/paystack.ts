// lib/paystack.ts

import Paystack from "paystack";

export function initializePaystack() {
  const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!);

  return {
    transaction: paystack.transaction,
    plan: paystack.plan,
    subscription: paystack.subscription,
  };
}
