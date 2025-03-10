"use client";
import { motion as motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/PlanCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle,
  Heart,
  Shield,
  Users,
  Building,
  Clock,
  Cog,
  Crown,
  Repeat,
  DoorOpen,
  CreditCard,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedText } from "@/components/ui/animated-text";
import { TestimonialCarousel } from "@/components/ui/testimonial-carousel";
import { plans as importedPlans } from "@/lib/constants";
import React, { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import FeaturesSection from "@/components/FeaturesSection";
import { ShieldCheck, HeartPulse, BadgeCheck, UserCheck } from "lucide-react";

interface Plan {
  name: string;
  description: string;
  price: string;
  features: string[];
  additionalBenefits?: string[];
}

const faqs = [
  {
    question: "What is Medicare?",
    answer:
      "Medicare is a federal health insurance program for people who are 65 or older, certain younger people with disabilities, and people with End-Stage Renal Disease.",
  },
  {
    question: "What are the different parts of Medicare?",
    answer:
      "Medicare has four parts: Part A (Hospital Insurance), Part B (Medical Insurance), Part C (Medicare Advantage Plans), and Part D (Prescription Drug Coverage).",
  },
  {
    question: "How do I enroll in Medicare?",
    answer:
      "You can enroll in Medicare through the Social Security Administration website, by visiting your local Social Security office, or by calling 1-800-MEDICARE.",
  },
];

const plans: Plan[] = importedPlans.map((plan) => ({
  name: plan.name,
  description: plan.description,
  // Convert basePrice to a formatted string because the price in your component is expected as a string like "$19/month"
  price: `$${plan.basePrice}/month`,
  features: plan.features,
  additionalBenefits: plan.additionalBenefits || [],
}));

const testimonials = [
  {
    quote:
      "Proton Medicare made it so easy to understand and choose the right plan for my needs. Their support team was incredibly helpful throughout the process.",
    author: "Sarah Johnson",
    title: "Medicare Advantage Member",
  },
  {
    quote:
      "I was overwhelmed by Medicare options until I found Proton Medicare. They simplified everything and helped me make the best choice for my situation.",
    author: "Robert Smith",
    title: "Medicare Supplement Member",
  },
  {
    quote:
      "The enrollment process was smooth and straightforward. I'm very satisfied with my coverage and the ongoing support I receive.",
    author: "Maria Garcia",
    title: "Medicare Part D Member",
  },
];

const partners = [
  {
    id: 1,
    name: "Aetna",
    logo: "https://www.brixvpn.com/logo.svg",
  },
  {
    id: 2,
    name: "Humana",
    logo: "https://cdna.iconscout.com/img/google.c0129cb.svg",
  },
  {
    id: 3,
    name: "UnitedHealthcare",
    logo: "https://www.etegram.com/logo-white-color.svg",
  },
  {
    id: 4,
    name: "Cigna",
    logo: "https://cdna.iconscout.com/img/instacart.d64c895.svg",
  },
  {
    id: 5,
    name: "Blue",
    logo: "https://cdna.iconscout.com/img/disney.042cf1c.svg",
  },
];

export default function Home() {
  const [shuffledPlans, setShuffledPlans] = useState([...plans]);

  // Add this effect to shuffle plans periodically
  useEffect(() => {
    const shufflePlans = () => {
      const newPlans = [...plans].sort(() => Math.random() - 0.5);
      setShuffledPlans(newPlans);
    };

    shufflePlans(); // Initial shuffle
    const interval = setInterval(shufflePlans, 30000); // Shuffle every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-background py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
          }}
        />
        <div className="relative px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="bg-gradient-to-r from-purple-600 via-teal-300 to-teal-600 bg-clip-text text-4xl font-bold tracking-tighter text-transparent sm:text-5xl md:text-6xl lg:text-7xl/none">
                <AnimatedText text="Your Health Journey," />
                <br />
                <AnimatedText
                  text="Simplified"
                  className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
                />
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Compare plans, enroll online, and get the coverage you deserve.
                Expert guidance at every step.
              </p>
            </motion.div>
            <motion.div
              className="space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="grid grid-cols-2 space-x-4">
                <Button
                  asChild
                  size="lg"
                  className="animate-bounce bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 hover:from-teal-600 hover:to-teal-500"
                >
                  <Link href="/plans">View Plans</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-blue-400 to-blue-400 hover:from-blue-500 hover:to-blue-500"
                >
                  <Link href="/compare">Compare Coverage</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative w-full overflow-hidden py-12 sm:py-16 lg:py-24">
        {/* Background Gradient */}
        <div
          className="from-text-secondary absolute inset-0 bg-accent/10"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 85%, 0% 100%)",
          }}
        />
        <div className="relative px-6 md:px-12">
          <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
            {/* Left Content */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="space-y-4">
                <h2 className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
                  Medicare Simplified, Coverage Personalized
                </h2>
                <p className="text-lg font-medium leading-relaxed text-primary/80">
                  At{" "}
                  <span className="font-semibold text-teal-400">
                    Proton Medicare
                  </span>
                  , we simplify complex healthcare processes, giving you clear,
                  personalized coverage options to empower your health journey.
                </p>
              </div>
              {/* Features Section */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, text: "Comprehensive Protection" },
                  { icon: HeartPulse, text: "Tailored Healthcare" },
                  { icon: BadgeCheck, text: "Expert Guidance" },
                  { icon: UserCheck, text: "Personalized Support" },
                ].map(({ icon: Icon, text }, index) => (
                  <div
                    key={index}
                    className="group flex items-center space-x-3 transition-transform duration-300 hover:scale-105"
                  >
                    <div className="rounded-xl bg-teal-500/10 p-2.5 transition-colors group-hover:bg-teal-500/20">
                      <Icon className="h-6 w-6 text-teal-400 transition-colors group-hover:text-teal-300" />
                    </div>
                    <span className="cursor-pointer text-sm font-semibold text-primary/90 transition-colors group-hover:text-primary/40 sm:text-base">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
            {/* Right Image */}
            <motion.div
              className="relative mt-8 md:mt-0"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="group relative overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="https://v2.protonmedicare.com/api/html/rrrrr.png"
                  alt="Proton Medicare Healthcare Navigation"
                  layout="responsive"
                  width={5}
                  height={4}
                  objectFit="cover"
                  className="h-[250px] w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-[300px] lg:h-[400px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/90 p-4 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-medium text-gray-800">
                    Your health, your choice, our mission.
                  </p>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -right-6 -top-6 -z-10 h-48 w-48 rounded-full bg-teal-400/30 blur-3xl sm:h-72 sm:w-72" />
              <div className="absolute -bottom-6 -left-6 -z-10 h-48 w-48 rounded-full bg-teal-600/30 blur-3xl sm:h-72 sm:w-72" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="w-full bg-muted/50 py-12 md:py-24 lg:hidden">
        <div className="mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tighter text-primary">
            See What sets us Apart
          </h2>
          <p className="mb-6 text-center text-gray-500">
            Trusted by industry-leading companies around the world
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-2">
            {[
              { icon: CreditCard, text: "Affordability" },
              { icon: DoorOpen, text: "Accessibility" },
              { icon: Repeat, text: "Flexibilty" },
              { icon: CheckCircle, text: "Reliability" },
              { icon: Crown, text: "Exclusivity" },
              { icon: Cog, text: "Efficiency" },
            ].map(({ icon: Icon, text }, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-gray-600 transition-transform hover:scale-105"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 via-teal-500 to-teal-600 shadow-md transition-transform duration-300 hover:rotate-6 hover:scale-110">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-medium transition-colors duration-300 hover:text-teal-600">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <FeaturesSection />

      {/* Features Section */}
      <section className="w-full bg-muted/50 py-10">
        <div className="mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tighter text-primary">
            See What sets us Apart
          </h2>
          <p className="mb-6 text-center text-gray-500">
            Trusted by industry-leading companies around the world
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <Card className="group border-none shadow-lg transition-all duration-300 hover:shadow-2xl">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-indigo-500 shadow-md transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-semibold transition-colors duration-300 group-hover:text-teal-400">
                  Health Coverage
                </h3>
                <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-800">
                  Comprehensive coverage for your medical needs
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="group border-none shadow-lg transition-all duration-300 hover:shadow-2xl">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-cyan-300 shadow-md transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-semibold transition-colors duration-300 group-hover:text-teal-400">
                  Secure Plans
                </h3>
                <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-800">
                  Protected coverage with trusted providers
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="group border-none shadow-lg transition-all duration-300 hover:shadow-2xl">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-green-400 shadow-md transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-semibold transition-colors duration-300 group-hover:text-teal-400">
                  Expert Support
                </h3>
                <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-800">
                  Dedicated team to guide you through enrollment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="w-full bg-muted/50 py-12 md:py-24">
        <div className="mx-auto space-y-12 px-4 py-8">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tighter">
            Our Plans
          </h2>
          <p className="mb-6 text-center text-gray-500">
            Trusted by industry-leading companies around the world
          </p>

          <Carousel
            opts={{
              align: "center",
              loop: true,
              containScroll: "trimSnaps",
            }}
            className="mx-auto w-full max-w-5xl"
          >
            <CarouselContent>
              {shuffledPlans.map((plan, index) => (
                <CarouselItem
                  key={index}
                  className="sm:basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <div className="p-2">
                    <PlanCard
                      name={plan.name}
                      description={plan.description}
                      price={plan.price}
                      features={plan.features}
                      additionalBenefits={plan.additionalBenefits}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="hidden md:block">
              <CarouselPrevious className="absolute -left-12 top-1/2" />
              <CarouselNext className="absolute -right-12 top-1/2" />
            </div>
          </Carousel>

          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/plans">View All Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tighter">
            What Our Members Say
          </h2>
          <div className="mx-auto max-w-3xl">
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </div>
      </section> */}

      <section className="w-full overflow-hidden bg-accent/100 py-12 md:py-24">
        <div className="px-4 md:px-6">
          <div className="mb-12 space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Our Partners
            </h2>
            <p className="mx-auto max-w-[600px] text-gray-500 md:text-lg">
              Trusted by industry-leading companies around the world
            </p>
          </div>

          <div className="relative">
            {/* Gradient Masks */}
            <div className="absolute bottom-0 left-0 top-0 z-10 w-16 bg-gradient-to-r from-transparent to-transparent md:w-32" />
            <div className="absolute bottom-0 right-0 top-0 z-10 w-16 bg-gradient-to-l from-transparent to-transparent md:w-32" />

            <div className="relative mx-[-20px] overflow-hidden px-[20px]">
              {/* First Row - Original */}
              <div className="animate-scroll flex space-x-8 md:space-x-16">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="group relative flex h-[60px] w-[120px] flex-shrink-0 items-center justify-center"
                  >
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      width={120}
                      height={60}
                      className="transform object-contain grayscale transition-all duration-300 hover:grayscale-0 group-hover:scale-110"
                    />
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {partners.map((partner) => (
                  <div
                    key={`${partner.id}-duplicate`}
                    className="group relative flex h-[60px] w-[120px] flex-shrink-0 items-center justify-center"
                  >
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      width={120}
                      height={60}
                      className="transform object-contain grayscale transition-all duration-300 hover:grayscale-0 group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          .animate-scroll {
            animation: scroll 30s linear infinite;
          }

          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* Steps Section */}
      <section className="w-full bg-muted/50 py-12 md:py-24">
        <div className="mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mb-12 max-w-[600px] text-center text-gray-500 md:text-lg">
            {" "}
            Trusted by industry-leading companies around the world
          </p>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "Compare Plans",
                description:
                  "Browse and compare Medicare plans available in your area",
              },
              {
                step: "2",
                title: "Get Expert Help",
                description:
                  "Speak with our licensed agents to find the right coverage",
              },
              {
                step: "3",
                title: "Enroll Online",
                description:
                  "Complete your enrollment quickly and securely online",
              },
              {
                step: "4",
                title: "Enroll Online",
                description:
                  "Complete your enrollment quickly and securely online",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500">
                  <span className="font-bold text-white">{item.step}</span>
                </div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="w-full py-12 md:py-24">
        <div className="px-4 md:px-6">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tighter">
            Frequently Asked Questions
          </h2>
          {/* <Accordion
            type="single"
            collapsible
            className="mx-auto w-full max-w-3xl"
          >
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion> */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <Accordion
              type="single"
              collapsible
              className="mx-auto w-full max-w-3xl space-y-4"
            >
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-accent/80 backdrop-blur-sm"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50/50 hover:no-underline">
                    <div className="flex items-center text-left">
                      <span className="text-primary">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 text-primary/80">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/faqs">View All FAQs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 py-12 text-white md:py-24">
        <motion.div
          className="px-4 md:px-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Get Started?
              </h2>
              <p className="max-w-[600px] text-white/80 md:text-xl">
                Compare plans, enroll online, and get the coverage you need
                today
              </p>
            </div>
            <div className="space-x-4">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="btn-primary animate-bounce text-primary hover:from-gray-400 hover:to-gray-500"
              >
                <Link href="/plans">View Plans</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="btn-secondary border-white bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600"
              >
                <Link href="/contact" className="text-primary">
                  Talk to Us
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
