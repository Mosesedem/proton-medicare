import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Award, Users, DollarSign } from "lucide-react";
import { SignUpForm } from "@/components/ambassador-form";
import { Testimonials } from "@/components/ambassador-testimonial";
import { GettingStartedSection } from "@/components/ambassador-getting-started";
import { ProgramExplained } from "@/components/ambassador-program-explained";

const benefits = [
  {
    title: "Make a Difference",
    description:
      "Help seniors in your community navigate Medicare with confidence and ease.",
    icon: Users,
  },
  {
    title: "Earn Rewards",
    description:
      "Receive competitive compensation for every successful referral you make.",
    icon: DollarSign,
  },
  {
    title: "Grow Professionally",
    description:
      "Access exclusive training and development opportunities to enhance your skills.",
    icon: Award,
  },
];

export default function CommunityAmbassador() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-accent-600 relative">
        <div className="mx-auto max-w-7xl px-4 py-24 md:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Become a Community Ambassador
              </h1>
              <p className="text-xl text-muted-foreground">
                Join our network of passionate individuals who help seniors
                navigate Medicare with confidence. Make a difference while
                earning rewards.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  Apply Now
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              <Image
                src="http://v2.protonmedicare.com/api/html/rrrrr.png"
                alt="Community ambassadors helping seniors"
                fill
                className="rounded-lg object-cover shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <GettingStartedSection />
      <ProgramExplained />

      {/* Benefits Section */}
      <section className="py-24">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tighter text-primary">
          See What sets us Apart
        </h2>
        <p className="mb-6 text-center text-gray-500">
          Trusted by industry-leading companies around the world
        </p>
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="transition-transform hover:scale-105"
              >
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                    <benefit.icon className="h-6 w-6 text-teal-600" />
                  </div>
                  <CardTitle>{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sign Up Form Section */}
      <section className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Join Our Ambassador Program
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Fill out the form below to start your journey as a Community
              Ambassador.
            </p>
          </div>
          <SignUpForm />
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />
    </main>
  );
}
