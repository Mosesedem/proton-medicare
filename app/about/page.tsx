"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <section className="relative flex h-[70vh] items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              "url(https://cdn.iconscout.com/strapi/Usecase_2_d4184d6646.png)",
            backgroundPosition: "center",
            backgroundSize: "cover",
            filter: "brightness(0.7)",
          }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent to-background" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 px-4 text-center"
        >
          <span className="mb-6 inline-block rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-md">
            Established 2010
          </span>
          <h1 className="mb-6 text-5xl font-bold text-white md:text-7xl">
            Proton Medicare
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-white/90 md:text-2xl">
            Revolutionizing healthcare accessibility for seniors across America
          </p>
        </motion.div>
      </section>

      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            variants={fadeInUpVariants}
            className="mb-16 text-center"
          >
            <span className="mb-6 inline-block rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent-foreground">
              Our Mission
            </span>
            <h2 className="mb-6 text-4xl font-bold">Simplifying Healthcare</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              We believe in making healthcare accessible and understandable for
              everyone. Our commitment drives us to innovate and improve
              continuously.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Transparency",
                description:
                  "Clear communication and honest relationships with our members",
                icon: "✨",
              },
              {
                title: "Innovation",
                description: "Continuously improving our healthcare solutions",
                icon: "🔬",
              },
              {
                title: "Support",
                description: "24/7 dedicated assistance for all our members",
                icon: "🤝",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                variants={fadeInUpVariants}
              >
                <Card className="group relative overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 text-4xl">{item.icon}</div>
                    <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-accent/5 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="mb-6 inline-block rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent-foreground">
                Our Story
              </span>
              <h2 className="mb-6 text-4xl font-bold">
                A Decade of Excellence
              </h2>
              <p className="mb-6 text-lg text-muted-foreground">
                Founded in 2010, Proton Medicare began with a simple idea: make
                Medicare accessible and understandable for everyone. Over the
                years, we have grown from a small startup to a trusted
                healthcare partner for thousands of seniors across the country.
              </p>
              <p className="text-lg text-muted-foreground">
                Our team of dedicated professionals works tirelessly to ensure
                that our members receive the best possible care and support,
                making the most trusted names in Medicare services.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative aspect-square"
            >
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  backgroundImage:
                    "url(https://cdn.iconscout.com/strapi/Usecase_2_d4184d6646.png)",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
