"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MessageCircle,
  Newspaper,
  Phone,
  Globe,
  Twitter,
  Instagram,
  Linkedin,
  Calendar,
  Sparkles,
  Bot,
  PhoneIcon as WhatsApp,
  Facebook,
} from "lucide-react";
import { AIChat } from "@/components/ai-chat";
import { CalendlyEmbed } from "@/components/calendly-embed";
import Link from "next/link";

interface FormData {
  name: string;
  email: string;
  message: string;
  preferredContact: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
    preferredContact: "email",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setFormData({
      name: "",
      email: "",
      message: "",
      preferredContact: "email",
    });
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  return (
    <div className="mt-11 min-h-screen bg-gradient-to-b from-gray-500/10 via-teal-600/10 to-teal-500/10 px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 flex flex-col items-center space-y-4 sm:mb-12">
          <Sparkles className="h-8 w-8 animate-pulse text-teal-600 sm:h-12 sm:w-12" />
          <h1 className="bg-gradient-to-r from-teal-500 to-teal-600/60 bg-clip-text text-center text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
            Let us Connect
          </h1>
          <p className="max-w-2xl px-4 text-center text-sm text-muted-foreground sm:text-base">
            Choose your preferred way to reach us. We are available across
            multiple platforms and ready to assist you 24/7 with our AI-powered
            response system.
          </p>
        </div>

        <Tabs defaultValue="message" className="w-full">
          <TabsList className="h-18 flex w-auto flex-wrap justify-center gap-2 bg-gray-700 sm:gap-4">
            <TabsTrigger
              value="message"
              className="flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm hover:bg-primary/10 sm:text-base"
            >
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">Message</span>
            </TabsTrigger>

            <TabsTrigger
              value="schedule"
              className="flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm hover:bg-primary/10 sm:text-base"
            >
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>

            <TabsTrigger
              value="social"
              className="flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm hover:bg-primary/10 sm:text-base"
            >
              <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>

            <TabsTrigger
              value="ai"
              className="flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm hover:bg-primary/10 sm:text-base"
            >
              <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">AI Support</span>
            </TabsTrigger>
          </TabsList>

          {/* Message Tab Content */}
          <TabsContent value="message">
            <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
              {/* Contact Form Card */}
              <Card className="border-1 border-primary">
                <CardHeader className="space-y-1 sm:space-y-2">
                  <CardTitle className="text-xl sm:text-2xl">
                    Send us an Email
                  </CardTitle>
                  <CardDescription className="text-sm">
                    We typically respond within 2 hours
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="name" className="text-sm sm:text-base">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="border-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="email" className="text-sm sm:text-base">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="border-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="message" className="text-sm sm:text-base">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        className="min-h-24 border-primary/20 sm:min-h-32"
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Contact Options */}
              <div className="space-y-4 sm:space-y-6">
                <Card className="group transition-all hover:border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <Phone className="mr-2 h-6 w-6 group-hover:text-primary" />
                      Phone Call
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base">
                      Call us directly - +234 (0) 706 973 7196
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      Available 24/7
                    </p>
                    <Button
                      variant="outline"
                      className="mt-3 text-sm sm:mt-4 sm:text-base"
                      onClick={() =>
                        (window.location.href = "tel:+2347069737196")
                      }
                    >
                      Call Now
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="space-y-1 sm:space-y-2">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <MessageCircle className="mr-2 h-6 w-6 group-hover:text-primary" />
                      WhatsApp Support
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Get in touch with us via WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-50 text-sm sm:text-base"
                      onClick={() =>
                        window.open("https://wa.me/2347069737196", "_blank")
                      }
                    >
                      <WhatsApp className="mr-2 h-4 w-4" />
                      Chat on WhatsApp
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group transition-all hover:border-primary/20">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <Mail className="mr-2 h-6 w-6 group-hover:text-primary" />
                      Direct Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base">
                      support@protonmedicare.com
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      24/7 Support
                    </p>
                    <Badge className="mt-2" variant="secondary">
                      Priority Response
                    </Badge>
                    <br />
                    <br />
                    <Button
                      className="w-50 text-sm sm:text-base"
                      onClick={() =>
                        window.open(
                          "mailto:support@protonmedicare.com",
                          "_blank",
                        )
                      }
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab Content */}
          <TabsContent value="schedule">
            <div className="h-[600px] sm:h-[700px]">
              <CalendlyEmbed />
            </div>
          </TabsContent>

          {/* Social Tab Content */}
          <TabsContent value="social">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Twitter,
                  name: "Twitter",
                  handle: "@protonmedicare",
                  link: "https://facebook.com/protonmedicare",
                },
                {
                  icon: Instagram,
                  name: "Instagram",
                  handle: "@protonmedicare",
                  link: "https://facebook.com/protonmedicare",
                },
                {
                  icon: Linkedin,
                  name: "LinkedIn",
                  handle: "Proton Medicare",
                  link: "https://facebook.com/protonmedicare",
                },
                {
                  icon: Facebook,
                  name: "Facebook",
                  handle: "protonmedicare",
                  link: "https://facebook.com/protonmedicare",
                },
                {
                  icon: Newspaper,
                  name: "Medium",
                  handle: "protonmedicare",
                  link: "https://facebook.com/protonmedicare",
                },
              ].map((social) => (
                <Card
                  key={social.name}
                  className="group transition-all hover:border-primary/20"
                >
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <social.icon className="mr-2 h-4 w-4 group-hover:text-primary" />
                      {social.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6">
                    <p className="text-sm sm:text-base">{social.handle}</p>
                    <Button
                      variant="outline"
                      className="mt-3 border-primary/20 text-sm sm:mt-4 sm:text-base"
                    >
                      <Link href={social.link} target="_blank">
                        Follow Us
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI Support Tab Content */}
          <TabsContent value="ai">
            <div className="h-[500px] sm:h-[600px]">
              <AIChat />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
