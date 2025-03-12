// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
//   BarChart3,
//   Users,
//   Headset,
//   Settings,
//   Package,
//   Wallet,
//   CirclePlusIcon,
//   Menu,
//   IdCardIcon,
//   X,
// } from "lucide-react";
// import { useState, useEffect } from "react";
// import { UserButton } from "@/components/auth/user-button";
// import { cn } from "@/lib/utils";
// import { ModeToggle } from "../mode-toggle";

// const routes = [
//   {
//     label: "Overview",
//     icon: BarChart3,
//     href: "/dashboard",
//     color: "text-teal-500",
//   },
//   {
//     label: "Enrollments",
//     icon: Users,
//     href: "/dashboard/enrollments",
//     color: "text-teal-500",
//   },
//   {
//     label: "Plans and Policies",
//     icon: IdCardIcon,
//     href: "/dashboard/policies",
//     color: "text-teal-500",
//   },
//   {
//     label: "Products",
//     icon: Package,
//     href: "/dashboard/products",
//     color: "text-teal-500",
//   },
//   {
//     label: "Earnings",
//     icon: Wallet,
//     href: "/dashboard/commissions",
//     color: "text-teal-500",
//   },
//   {
//     label: "Enroll in a Plan",
//     icon: CirclePlusIcon,
//     href: "/dashboard/enroll",
//     color: "text-teal-500",
//   },
//   {
//     label: "Contact Us",
//     icon: Headset,
//     href: "/dashboard/contact-us",
//     color: "text-teal-500",
//   },
//   {
//     label: "Settings",
//     icon: Settings,
//     href: "/dashboard/settings",
//     color: "text-teal-500",
//   },
// ];

// export function Sidebar() {
//   const pathname = usePathname();
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on a mobile device
//   useEffect(() => {
//     const checkIsMobile = () => {
//       const mobile = window.innerWidth < 768;
//       setIsMobile(mobile);
//       // Close menu when switching to desktop
//       if (!mobile) setIsMobileMenuOpen(false);
//     };

//     checkIsMobile();
//     window.addEventListener("resize", checkIsMobile);

//     return () => {
//       window.removeEventListener("resize", checkIsMobile);
//     };
//   }, []);

//   return (
//     <>
//       {/* Mobile header */}
//       <div
//         className={cn(
//           "md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background border-b",
//           isMobileMenuOpen ? "shadow-lg" : ""
//         )}
//       >
//         <Link href="/dashboard" className="flex items-center">
//           <h1 className="text-xl font-bold">Proton Medicare</h1>
//         </Link>
//         <div className="flex items-center gap-4">
//           <ModeToggle />
//           <button
//             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             className="p-2 rounded-lg hover:bg-primary/10"
//           >
//             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </div>
//       </div>

//       {/* Sidebar */}
//       <div
//         className={cn(
//           "flex flex-col bg-muted transition-all duration-300",
//           isMobile
//             ? "fixed top-0 left-0 h-full w-64 z-40 pt-16"
//             : "h-full w-64",
//           isMobile && !isMobileMenuOpen ? "-translate-x-full" : "translate-x-0"
//         )}
//       >
//         {!isMobile && (
//           <div className="px-3 py-4">
//             <Link href="/dashboard" className="flex items-center pl-3 mb-8">
//               <h1 className="text-2xl font-bold">Proton Medicare</h1>
//             </Link>
//           </div>
//         )}

//         <div className="px-3 py-2 flex-1">
//           <div className="space-y-1">
//             {routes.map((route) => (
//               <Link
//                 key={route.href}
//                 href={route.href}
//                 onClick={() => isMobile && setIsMobileMenuOpen(false)}
//                 className={cn(
//                   "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
//                   pathname === route.href
//                     ? "bg-primary/10 text-primary"
//                     : "text-muted-foreground"
//                 )}
//               >
//                 <div className="flex items-center flex-1">
//                   <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
//                   {route.label}
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>

//         <div className="px-3 py-4 border-t">
//           <div className="flex items-center justify-between">
//             <UserButton />
//             <ModeToggle />
//           </div>
//         </div>
//       </div>

//       {/* Overlay for mobile when menu is open */}
//       {isMobile && isMobileMenuOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-30 md:hidden"
//           onClick={() => setIsMobileMenuOpen(false)}
//         />
//       )}
//     </>
//   );
// }
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
// import { signOut } from "next-auth/react";
import { getSession } from "next-auth/react";
import Image from "next/image";
import {
  BarChart3,
  Users,
  Headset,
  Settings,
  Package,
  Wallet,
  CirclePlusIcon,
  Menu,
  IdCardIcon,
  X,
  // LogOut,
} from "lucide-react";
import { ModeToggle } from "../mode-toggle";
import { cn } from "@/lib/utils";
import { UserButton } from "../auth/user-button";
import { useLayoutConfig } from "@/contexts/LayoutConfigContext";

const routes = [
  { label: "Overview", icon: BarChart3, href: "/dashboard" },
  { label: "Enrollments", icon: Users, href: "/dashboard/enrollments" },
  {
    label: "Plans and Policies",
    icon: IdCardIcon,
    href: "/dashboard/policies",
  },
  { label: "Products", icon: Package, href: "/dashboard/products" },
  { label: "Earnings", icon: Wallet, href: "/dashboard/commissions" },
  {
    label: "Enroll in a Plan",
    icon: CirclePlusIcon,
    href: "/dashboard/enroll",
  },
  { label: "Contact Us", icon: Headset, href: "/dashboard/contact-us" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { setConfig } = useLayoutConfig();

  useEffect(() => {
    setConfig({ hideHeader: true, hideFooter: true });
    return () => setConfig({ hideHeader: false, hideFooter: false });
  }, [setConfig]);

  // Fetch session
  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      if (!sessionData) {
        window.location.href = "/signin"; // Redirect if no session
      } else {
        setSession(sessionData);
      }
      setLoading(false);
    };
    fetchSession();
  }, []);

  // Detect window width for responsive behavior
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false); // Auto-close on desktop
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Close sidebar on outside click (mobile only)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isMobileMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close sidebar with 'Esc' key (mobile only)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b bg-background p-4 shadow-sm md:hidden">
        <Link href="/dashboard" className="text-xl font-bold">
          Proton Medicare
        </Link>
        <div className="flex items-center gap-4">
          {/* <ModeToggle /> */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            className="rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "z-50 flex h-full w-64 flex-col bg-muted transition-transform duration-300",
          isMobile ? "fixed left-0 top-0 pt-16 shadow-lg" : "sticky top-0",
          isMobile && !isMobileMenuOpen ? "-translate-x-full" : "translate-x-0",
        )}
      >
        {/* Logo (Desktop) */}
        {/* {!isMobile && ( */}
        <div className="p-4">
          <Link href="/dashboard" className="text-2xl font-bold">
            Proton Medicare
          </Link>
        </div>
        {/* )} */}

        {/* User Profile */}
        {session && (
          <div className="flex items-center gap-3 border-b p-4">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium">
                {session.user.firstName} {session.user.lastName}
              </p>
              {/* <p className="text-xs text-gray-500">{session.user.email}</p> */}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {routes.map(({ label, icon: Icon, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg p-3 text-sm font-medium transition-colors",
                    pathname === href
                      ? "bg-teal-500 text-white"
                      : "text-muted-foreground hover:bg-teal-500/10 hover:text-teal-500",
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout & Theme Toggle */}
        <div className="flex items-center justify-between border-t p-4">
          <UserButton />
          <ModeToggle />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
