import Paystack from "paystack";

export function initializePaystack() {
  return new Paystack(process.env.PAYSTACK_SECRET_KEY!);
}
