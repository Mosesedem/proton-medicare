// providers/page.tsx

import { ProviderDirectory } from "@/components/provider-directory";
import Image from "next/image";

export default function ProvidersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-700 to-teal-200">
      <div className="mx-auto px-4 py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white md:text-6xl">
              Find care providers by plan
            </h1>
            <p className="text-xl text-blue-100">
              Select your Proton Medicare plan to view available healthcare
              providers in your network.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-2xl" />
              <Image
                src="https://cdn.iconscout.com/strapi/Usecase_2_d4184d6646.png"
                alt="Medical facility illustration"
                width={600}
                height={400}
                className="relative rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-screen bg-background">
        <ProviderDirectory />
      </div>
    </main>
  );
}
