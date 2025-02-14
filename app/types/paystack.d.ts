// app/types/paystack.d.ts

declare module "paystack" {
  interface PaystackConfig {
    secretKey: string;
  }

  interface PaystackConstructor {
    new (secretKey: string): Paystack;
  }

  interface TransactionInitializeParams {
    amount: number;
    first_name: string;
    last_name: string;
    email: string;
    currency?: string;
    reference?: string;
    callback_url?: string;
    plan?: string;
    invoice_limit?: number;
    metadata?: Record<string, any>;
    channels?: string[];
    split_code?: string;
    subaccount?: string;
    transaction_charge?: number;
    bearer?: string;
  }

  interface TransactionVerifyResponse {
    status: boolean;
    message: string;
    data: {
      id: number;
      domain: string;
      status: string;
      reference: string;
      amount: number;
      message: string;
      gateway_response: string;
      paid_at: string;
      created_at: string;
      channel: string;
      currency: string;
      ip_address: string;
      metadata: Record<string, any>;
      log: any;
      fees: number;
      fees_split: any;
      authorization: any;
      customer: any;
      plan: any;
      requested_amount: number;
    };
  }

  interface PlanCreateParams {
    name: string;
    amount: number;
    interval: "monthly" | "quarterly" | "biannually" | "annually";
    description?: string;
    send_invoices?: boolean;
    send_sms?: boolean;
    currency?: string;
    invoice_limit?: number;
  }

  interface SubscriptionCreateParams {
    customer: string;
    plan: string;
    authorization?: string;
    start_date?: string;
  }

  interface Paystack {
    transaction: {
      initialize(params: TransactionInitializeParams): Promise<any>;
      verify(reference: string): Promise<TransactionVerifyResponse>;
      list(): Promise<any>;
      fetch(id: number): Promise<any>;
      chargeAuthorization(params: any): Promise<any>;
    };
    customer: {
      create(params: any): Promise<any>;
      list(): Promise<any>;
      fetch(email_or_code: string): Promise<any>;
      update(code: string, params: any): Promise<any>;
    };
    plan: {
      create(params: PlanCreateParams): Promise<any>;
      list(): Promise<any>;
      fetch(id_or_code: string): Promise<any>;
      update(id_or_code: string, params: any): Promise<any>;
    };
    subscription: {
      create(params: SubscriptionCreateParams): Promise<any>;
      list(): Promise<any>;
      fetch(id_or_code: string): Promise<any>;
      enable(code: string, token: string): Promise<any>;
      disable(code: string, token: string): Promise<any>;
    };
    // Add other Paystack methods as needed
  }

  const Paystack: PaystackConstructor;
  export default Paystack;
}
