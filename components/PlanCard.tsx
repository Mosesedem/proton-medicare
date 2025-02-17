"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PlanProps {
  name: string;
  description: string;
  price: string;
  features: string[];
  additionalBenefits?: string[];
}

export function PlanCard({
  name,
  description,
  price,
  features,
  additionalBenefits,
}: PlanProps) {
  return (
    <Card className="snap-align-center group relative flex min-w-[260px] max-w-[320px] flex-grow transform flex-col overflow-hidden from-purple-500/10 via-blue-500/10 to-teal-500/10 transition-all duration-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-500/10 before:via-teal-300/10 before:to-teal-600/10 before:opacity-0 before:transition-opacity before:duration-500 after:absolute after:inset-0 after:rounded-lg after:border-2 after:border-transparent after:transition-all after:duration-500 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(45,212,191,0.1)] hover:before:opacity-100 hover:after:border-teal-500/50">
      <CardHeader>
        <CardTitle className="relative text-lg font-semibold transition-colors group-hover:text-teal-600">
          {name}
        </CardTitle>
        <CardDescription className="transition-colors group-hover:text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="mb-4 bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-2xl font-bold text-transparent transition-colors">
          {price}
        </p>
        <ul className="space-y-2">
          {features.slice(0, 4).map((feature, featureIndex) => (
            <li key={featureIndex} className="group/item flex items-center">
              <span className="mr-2 rounded-full bg-teal-50 p-1 transition-colors group-hover/item:bg-teal-100">
                <Check className="h-3 w-3 text-teal-600" />
              </span>
              <span className="transition-colors group-hover/item:text-gray-700">
                {feature}
              </span>
            </li>
          ))}
        </ul>
        {additionalBenefits && additionalBenefits.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="link"
                className="group/btn relative z-10 mt-4 h-auto p-0 text-teal-600 transition-colors hover:text-teal-700"
              >
                View more benefits
                <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-teal-600">
                  {name} - Additional Benefits
                </DialogTitle>
              </DialogHeader>
              <ul className="mt-4 space-y-2">
                {additionalBenefits.map((benefit, index) => (
                  <li key={index} className="group/item flex items-center">
                    <span className="mr-2 rounded-full bg-teal-50 p-1 transition-colors group-hover/item:bg-teal-100">
                      <Check className="h-3 w-3 text-teal-600" />
                    </span>
                    <span className="transition-colors group-hover/item:text-gray-700">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
      <CardFooter>
        <Button
          asChild
          className="via-teal-550 relative z-10 h-10 w-full bg-gradient-to-r from-teal-500 to-teal-500 shadow-lg transition-all duration-300 hover:from-teal-600 hover:to-teal-700 hover:shadow-xl hover:shadow-teal-500/25"
        >
          <Link
            href={`/enroll?plan=${encodeURIComponent(name)}`}
            className="flex h-full w-full items-center justify-center"
          >
            Enroll Now
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
