"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

const categories = ["All", "Basics", "Coverage", "Enrollment", "Costs"];

const faqs = [
  {
    question: "What is Medicare?",
    answer:
      "Medicare is a federal health insurance program for people who are 65 or older, certain younger people with disabilities, and people with End-Stage Renal Disease.",
    category: "Basics",
  },
  {
    question: "What are the different parts of Medicare?",
    answer:
      "Medicare has four parts: Part A (Hospital Insurance), Part B (Medical Insurance), Part C (Medicare Advantage Plans), and Part D (Prescription Drug Coverage).",
    category: "Coverage",
  },
  {
    question: "How do I enroll in Medicare?",
    answer:
      "You can enroll in Medicare through the Social Security Administration website, by visiting your local Social Security office, or by calling 1-800-MEDICARE.",
    category: "Enrollment",
  },
  {
    question:
      "What is the difference between Original Medicare and Medicare Advantage?",
    answer:
      "Original Medicare is provided by the federal government and includes Part A and Part B. Medicare Advantage is offered by private insurance companies and often includes additional benefits like dental and vision coverage.",
    category: "Coverage",
  },
  {
    question: "When can I enroll in or change my Medicare coverage?",
    answer:
      "You can enroll during your Initial Enrollment Period, which begins 3 months before your 65th birthday. You can also make changes during the Annual Enrollment Period from October 15 to December 7 each year.",
    category: "Enrollment",
  },
];

export default function FAQsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-accent/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative h-[40vh] overflow-hidden"
      >
        <div className="absolute inset-0">
          <Image
            src="https://cdn.iconscout.com/strapi/Usecase_2_d4184d6646.png"
            alt="People collaborating"
            className="h-full w-full object-cover"
            layout="responsive"
            width={10}
            height={9}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-white">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-4 text-center text-4xl font-bold md:text-5xl"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="max-w-2xl text-center text-lg md:text-xl"
          >
            Find answers to common questions about Medicare coverage and
            benefits
          </motion.p>
        </div>
      </motion.div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-accent/80 pl-10 shadow-sm backdrop-blur-sm"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-8 flex flex-wrap gap-2"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? "bg-gray-700 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {filteredFaqs.map((faq, index) => (
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
      </div>
    </div>
  );
}
