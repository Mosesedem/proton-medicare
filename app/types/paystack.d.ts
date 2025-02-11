// types/paystack.d.ts
declare module "paystack" {
  interface PaystackConfig {
    secretKey: string;
  }

  interface PaystackConstructor {
    new (secretKey: string): Paystack;
  }

  interface Paystack {
    // Add method signatures based on Paystack's API
    transaction: {
      initialize(params: any): Promise<any>;
      verify(reference: string): Promise<any>;
    };
    customer: {
      create(params: any): Promise<any>;
      list(): Promise<any>;
    };
    // Add other Paystack methods as needed
  }

  const Paystack: PaystackConstructor;
  export default Paystack;
}
