"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { Menu, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Route = {
  href: string;
  label: string;
};

const productRoutes: Route[] = [
  { href: "/plans", label: "Medicare Plans" },
  { href: "/compare", label: "Compare Plans" },
  { href: "/providers", label: "Find Providers" },
];

const supportRoutes: Route[] = [
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
  { href: "/support", label: "Support" },
];

const companyRoutes: Route[] = [
  { href: "/about", label: "About Us" },
  { href: "/careers", label: "Careers" },
  { href: "/ambassador", label: "Refer and Earn" },
];

const dropdownVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: {
      duration: 0.2,
    },
  },
};

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const renderRouteGroup = (routes: Route[], title: string) => (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={dropdownVariants}
      className="rounded-lg border border-border/50 bg-background/95 p-4 shadow-lg backdrop-blur-xl"
    >
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-all duration-200",
              "hover:bg-primary/5 hover:text-primary",
              pathname === route.href
                ? "bg-primary/5 font-medium text-primary"
                : "text-muted-foreground",
            )}
          >
            {route.label}
          </Link>
        ))}
      </div>
    </motion.div>
  );

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
        scrolled ? "border-border/40 shadow-sm" : "border-transparent",
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 sm:h-16">
        <div className="flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 hover:bg-transparent hover:text-primary"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full p-0 sm:max-w-md">
              <div className="h-full overflow-y-auto px-4 py-6">
                <Link
                  href="/"
                  className="mb-8 block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-xl font-bold text-transparent"
                  onClick={() => setIsOpen(false)}
                >
                  Proton Medicare
                </Link>

                <div className="space-y-6">
                  {[
                    { title: "Products", routes: productRoutes },
                    { title: "Support", routes: supportRoutes },
                    { title: "Company", routes: companyRoutes },
                  ].map(({ title, routes }) => (
                    <div key={title}>
                      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        {title}
                      </h3>
                      <div className="space-y-2">
                        {routes.map((route) => (
                          <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "block py-2 text-base transition-colors",
                              "hover:text-primary",
                              pathname === route.href
                                ? "font-medium text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {route.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/signin">Sign In</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/enroll">Enroll Now</Link>
                  </Button>
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <ModeToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center space-x-2">
            <motion.span
              className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-lg font-bold text-transparent sm:text-xl"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              Proton Medicare
            </motion.span>
          </Link>
        </div>

        <nav className="hidden items-center space-x-6 md:flex">
          {[
            {
              id: "products",
              label: "Products",
              routes: productRoutes,
              title: "Our Services",
            },
            {
              id: "support",
              label: "Support",
              routes: supportRoutes,
              title: "Get Help",
            },
            {
              id: "company",
              label: "Company",
              routes: companyRoutes,
              title: "About Proton",
            },
          ].map(({ id, label, routes, title }) => (
            <DropdownMenu
              key={id}
              open={activeDropdown === id}
              onOpenChange={(open) => setActiveDropdown(open ? id : null)}
            >
              <DropdownMenuTrigger asChild>
                <motion.button
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors",
                    "hover:text-primary focus:text-primary focus:outline-none",
                    activeDropdown === id
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {label}
                  <motion.span
                    animate={{ rotate: activeDropdown === id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </motion.span>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-0" align="start">
                {renderRouteGroup(routes, title)}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden items-center space-x-4 md:flex">
            <Button
              // variant="ghost"
              size="sm"
              asChild
              className="bg-teal-500 hover:bg-teal-600"
            >
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-blue-400 shadow-sm hover:bg-blue-500"
            >
              <Link href="/enroll">Enroll Now</Link>
            </Button>
          </div>
          <div className="hidden md:block">
            <ModeToggle />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
