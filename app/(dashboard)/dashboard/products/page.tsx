/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { PlanCard } from "@/components/dashboard/PlanCard";
import { useRef, useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import { plans } from "@/lib/constants";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
// import { useRouter } from "next/router";
// import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

// Define Plan type for TypeScript
type Plan = {
  id: string;
  name: string;
  provider?: string;
  basePrice: number;
  type: string;
  description: string;
  features: string[];
  additionalBenefits: string[];
};

function HorizontalScrollSection({
  title,
  filteredPlans,
}: {
  title: string;
  filteredPlans: Plan[];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const updateScrollButtonsVisibility = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft + clientWidth < scrollWidth);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth / 2; // Scroll half the width for smoother navigation
      scrollContainerRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Update visibility on scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", updateScrollButtonsVisibility);
    updateScrollButtonsVisibility(); // Initial check

    // Also update on window resize for better responsiveness
    window.addEventListener("resize", updateScrollButtonsVisibility);

    return () => {
      container?.removeEventListener("scroll", updateScrollButtonsVisibility);
      window.removeEventListener("resize", updateScrollButtonsVisibility);
    };
  }, []);

  // Don't render section if no plans match
  if (filteredPlans.length === 0) {
    return null;
  }

  return (
    <section className="relative">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center md:text-left">
        {title}
      </h2>

      {/* Left Scroll Button */}
      {showLeftButton && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-gray-100 rounded-full p-2 shadow-lg transition"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-600" />
        </button>
      )}

      {/* Right Scroll Button */}
      {showRightButton && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-gray-100 rounded-full p-2 shadow-lg transition"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-600" />
        </button>
      )}

      <div className="relative overflow-hidden px-2">
        <div
          ref={scrollContainerRef}
          className="py-4 flex space-x-4 overflow-x-scroll scrollbar-hide scroll-smooth snap-x"
        >
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex-shrink-0 w-full max-w-xs md:max-w-sm mx-auto snap-center"
            >
              <PlanCard
                name={plan.name}
                description={plan.description}
                price={`₦ ${plan.basePrice.toLocaleString("en-NG")} / Month`}
                features={plan.features}
                additionalBenefits={plan.additionalBenefits}
                provider={plan.provider}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PlansPage() {
  const { data: session, status } = useSession();
  // const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Plan[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  // Search function
  const searchPlans = (term: string) => {
    if (!term.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const normalizedTerm = term.toLowerCase().trim();

    const results = plans.filter((plan) =>
      [
        plan.name,
        plan.description,
        plan.type,
        plan.provider || "",
        ...plan.features,
        ...plan.additionalBenefits,
        plan.basePrice.toString(),
      ].some((field) => field.toLowerCase().includes(normalizedTerm))
    );

    setSearchResults(results);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user data from a server API endpoint instead of using Prisma directly
        const response = await fetch("/api/user/profile");

        if (!response.ok) {
          // Handle unauthenticated users
          if (response.status === 401) {
            router.push("/signin");
            return;
          }
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Group plans by type
  const getPlansByType = (planType: string) => {
    return plans.filter((plan) => plan.type === planType);
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchPlans(value);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-8 w-[250px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-800 to-teal-100">
      {/* Hero section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white leading-tight mt-10">
              Find care providers by plan
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-md mx-auto md:mx-0">
              Select your Proton Medicare plan to view available healthcare
              providers in your network.
            </p>
          </div>
          <div className="hidden md:flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-2xl" />
              <Image
                src="https://www.etegram.com/pages/homepage/Unlock-Unimaginable-Payment.svg"
                alt="Medical facility illustration"
                className="relative rounded-xl"
                width={340}
                height={340}
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="container mx-auto px-4 -mt-6 mb-8">
        <div className="bg-teal-500 rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search plans by name, provider, features or price..."
              className="pl-10 py-6 w-full bg-secondary text-primary"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {/* Plans sections */}
      <div className="container bg-background mx-auto px-4 py-8 space-y-12 rounded-t-3xl">
        {isSearching ? (
          searchResults.length > 0 ? (
            <HorizontalScrollSection
              title="Search Results"
              filteredPlans={searchResults}
            />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-2xl font-medium text-gray-600">
                No plans match your search
              </h3>
              <p className="mt-2 text-gray-500">
                Try different keywords or browse our available plans below
              </p>
            </div>
          )
        ) : (
          <>
            <HorizontalScrollSection
              title="Medicare Plans"
              filteredPlans={getPlansByType("medicarePlans")}
            />

            <HorizontalScrollSection
              title="Advanced and Seniors Plans"
              filteredPlans={getPlansByType("standardPlans")}
            />

            <HorizontalScrollSection
              title="Lite Plans"
              filteredPlans={getPlansByType("litePlans")}
            />

            <HorizontalScrollSection
              title="Maternity Plans"
              filteredPlans={getPlansByType("maternityPlans")}
            />
          </>
        )}
      </div>
    </main>
  );
}
