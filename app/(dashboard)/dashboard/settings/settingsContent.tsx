"use client";
import { useEffect } from "react";
import { useLayoutConfig } from "@/contexts/LayoutConfigContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, Lock, Bell, CreditCard, Shield } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const settingsOptions = [
  {
    icon: User,
    label: "Profile Settings",
    description: "Manage personal information",
    path: "/dashboard/settings/profile",
  },
  {
    icon: Lock,
    label: "Security",
    description: "Password & security settings",
    path: "/dashboard/settings/security",
  },
  {
    icon: Bell,
    label: "Notifications",
    description: "Manage notification settings",
    path: "/dashboard/settings/notifications",
  },
  {
    icon: CreditCard,
    label: "Billing",
    description: "View and manage billing",
    path: "/dashboard/settings/billing",
  },
  {
    icon: Shield,
    label: "Privacy",
    description: "Manage privacy settings",
    path: "/dashboard/settings/privacy",
  },
];

export default function SettingsPageContent() {
  const { setConfig } = useLayoutConfig();

  useEffect(() => {
    setConfig({ hideHeader: true, hideFooter: true });
    return () => setConfig({ hideHeader: false, hideFooter: false });
  }, [setConfig]);

  return (
    // <SidebarProvider>
    // <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
    <div className="container mx-auto py-8 mr-2 ml-3 mt-14">
      <Card className="mx-auto max-w-[1200px]">
        <div className="sticky top-0 z-10 border-b bg-card">
          <Breadcrumb className="px-4 py-4 sm:px-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/dashboard"
                  className="transition-colors hover:text-primary"
                >
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <CardHeader className="px-4 py-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              {/* <Button className="px-2 bg-slate-500 hover:bg-slate-400"
      onClick={() => window.location.href = '/dashboard'}>← Go back</Button> */}
              <Settings className="h-6 w-6" />
              Account Settings
            </CardTitle>
          </CardHeader>
        </div>

        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {settingsOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="group h-auto w-full justify-start p-4 transition-all hover:border-primary hover:shadow-md sm:p-6"
                  asChild
                >
                  <Link href={option.path}>
                    <div className="flex w-full items-start gap-4 sm:items-center">
                      <div className="flex-shrink-0">
                        <Icon className="h-5 w-5 transition-colors group-hover:text-primary sm:h-6 sm:w-6" />
                      </div>
                      <div className="min-w-0 flex-grow text-left">
                        <div className="text-base font-medium transition-colors group-hover:text-primary sm:text-lg">
                          {option.label}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm text-muted-foreground sm:line-clamp-1">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
