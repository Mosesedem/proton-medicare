"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Move interfaces and constants to a separate file (e.g., types.ts)
interface Benefit {
  id: string;
  title: string;
  description: string;
}

interface Position {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  applicationUrl?: string;
}

interface CareersData {
  benefits: Benefit[];
  openPositions: Position[];
}

const BENEFITS: Benefit[] = [
  {
    id: "1",
    title: "Health Insurance",
    description:
      "Comprehensive medical, dental, and vision coverage for you and your family",
  },
  {
    id: "2",
    title: "Remote Work",
    description: "Flexible work-from-home options with quarterly team meetups",
  },
  {
    id: "3",
    title: "Learning Budget",
    description:
      "$1,500 annual budget for professional development and courses",
  },
  {
    id: "4",
    title: "Paid Time Off",
    description:
      "Generous vacation policy, paid holidays, and flexible sick leave",
  },
];

// Move API functions to a separate service file (e.g., api.ts)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://v2.protonmedicare.com/api";

const CareersPageContent = () => {
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["careers"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/careers.php`);
      if (!response.ok) {
        throw new Error("Failed to fetch careers data");
      }
      return response.json() as Promise<CareersData>;
    },
    meta: {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load careers data. Please try again later.",
          // variant: "error",
        });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto flex items-center justify-center px-4 py-12">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const handleApply = (position: Position) => {
    if (position.applicationUrl) {
      window.open(position.applicationUrl, "_blank");
    } else {
      const subject = `Application for ${position.title} position`;
      const body = `I am interested in the ${position.title} position at Proton Medicare.`;
      window.open(
        `mailto:careers@protonmedicare.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        "_blank",
      );
    }
  };

  const openPositions = data?.openPositions ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto px-4 py-12"
    >
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <motion.h1
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="mb-4 text-4xl font-bold md:text-5xl"
        >
          Join Our Team
        </motion.h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          We are looking for passionate individuals to help us build the future
          of healthcare technology.
        </p>
      </div>

      {/* Benefits Section */}
      <section className="mb-16">
        <h2 className="mb-8 text-3xl font-bold">Why Join Us?</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="mb-16">
        <h2 className="mb-8 text-3xl font-bold">Open Positions</h2>
        {openPositions.length > 0 ? (
          <div className="grid gap-6">
            {openPositions.map((position: Position, index: number) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="transition-shadow hover:shadow-lg">
                  <CardContent className="flex flex-col items-start justify-between p-6 md:flex-row md:items-center">
                    <div>
                      <h3 className="mb-2 text-xl font-semibold">
                        {position.title}
                      </h3>
                      <div className="mb-4 flex flex-wrap gap-2 md:mb-0">
                        <Badge variant="secondary">{position.department}</Badge>
                        <Badge variant="outline">{position.location}</Badge>
                        <Badge>{position.type}</Badge>
                      </div>
                    </div>
                    <Button
                      className="mt-4 w-full md:mt-0 md:w-auto"
                      onClick={() => handleApply(position)}
                    >
                      Apply Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <CardContent>
              <p className="text-lg text-muted-foreground">
                There are currently no open positions today! Check back
                sometime.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Call to Action Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <Card className="bg-primary/5">
          <CardContent className="py-8">
            <h2 className="mb-4 text-2xl font-semibold">
              The position you seek is missing?
            </h2>
            <p className="mb-6 text-lg text-muted-foreground">
              Are you confident you can deliver value to us? Send us an email
              with your CV to{" "}
              <a
                href="mailto:careers@protonmedicare.com"
                className="text-primary hover:underline"
              >
                careers@protonmedicare.com
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.section>
    </motion.div>
  );
};

// Default export for the page
export default function Page() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <CareersPageContent />
    </QueryClientProvider>
  );
}
