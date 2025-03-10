// "use client";
// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Calendar,
//   CreditCard,
//   Heart,
//   Shield,
//   User,
//   FileText,
//   HelpCircle,
//   Package,
//   Key,
// } from "lucide-react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
// } from "recharts";

// export default function NigerianInsuranceDashboard() {
//   const [activeTab, setActiveTab] = useState("overview");
//   const [progress, setProgress] = useState(0);
//   const [chartVisible, setChartVisible] = useState(false);

//   // Simulated data for a Nigerian health insurance broker
//   const brokerData = {
//     name: "Amaka Okonkwo",
//     memberId: "NGN-2025-5678",
//     plan: "Premium Healthcare",
//     planType: "Family",
//     effectiveDate: "March 1, 2025",
//     expiryDate: "February 28, 2026",
//     provider: "Lagos Care Insurance",
//     members: 4,
//     monthlyCost: 65000, // in Naira
//     annualLimit: { total: 15000000, used: 3500000 }, // in Naira
//     renewalData: [
//       { month: "Sep", policies: 25 },
//       { month: "Oct", policies: 32 },
//       { month: "Nov", policies: 28 },
//       { month: "Dec", policies: 40 },
//       { month: "Jan", policies: 35 },
//       { month: "Feb", policies: 45 },
//     ],
//     planDistribution: [
//       { name: "Bronze", value: 35 },
//       { name: "Silver", value: 25 },
//       { name: "Gold", value: 20 },
//       { name: "Platinum", value: 20 },
//     ],
//     activePlans: [
//       {
//         id: "PLN-2025-001",
//         provider: "Lagos Care Insurance",
//         type: "Family Premium",
//         monthlyCost: 65000,
//         status: "Active",
//         renewal: "Feb 28, 2026",
//       },
//       {
//         id: "PLN-2024-056",
//         provider: "Abuja Health Partners",
//         type: "Group Basic",
//         monthlyCost: 120000,
//         status: "Active",
//         renewal: "Aug 15, 2025",
//       },
//     ],
//     upcomingRenewals: [
//       {
//         id: "PLN-2023-089",
//         date: "Mar 30, 2025",
//         client: "Sunshine Foods Ltd.",
//         plan: "Group Premium",
//         value: 840000,
//       },
//       {
//         id: "PLN-2023-104",
//         date: "Apr 15, 2025",
//         client: "Mohammed Family",
//         plan: "Family Plus",
//         value: 75000,
//       },
//     ],
//   };

//   useEffect(() => {
//     // Animate progress on component mount
//     const timer = setTimeout(() => {
//       setProgress(
//         (brokerData.annualLimit.used / brokerData.annualLimit.total) * 100,
//       );
//     }, 300);

//     // Animate chart visibility
//     const chartTimer = setTimeout(() => {
//       setChartVisible(true);
//     }, 500);

//     return () => {
//       clearTimeout(timer);
//       clearTimeout(chartTimer);
//     };
//   }, [brokerData.annualLimit.used, brokerData.annualLimit.total]);

//   const COLORS = ["#3182CE", "#38B2AC", "#805AD5", "#D69E2E"];

//   const formatCurrency = (amount) =>
//     new Intl.NumberFormat("en-NG", {
//       style: "currency",
//       currency: "NGN",
//       maximumFractionDigits: 0,
//     }).format(amount);

//   return (
//     <div className="animate-fade-in min-h-screen bg-background p-6 md:p-8">
//       {/* Header */}
//       <header className="animate-scale-in mb-8 flex flex-col items-center justify-between rounded-xl border border-border/30 bg-accent p-6 shadow-sm md:flex-row">
//         <div className="mb-4 text-center md:mb-0 md:text-left">
//           <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 md:text-3xl">
//             <span className="rounded bg-blue-50 p-1 text-primary">👋</span>{" "}
//             Welcome, {brokerData.name}
//           </h1>
//           <p className="mt-1 text-gray-600">
//             Nigerian Health Insurance Broker Portal
//           </p>
//         </div>
//         <div className="flex items-center space-x-4">
//           <div className="text-right">
//             <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-primary">
//               <Key className="mr-1 h-3.5 w-3.5" />
//               Broker ID: {brokerData.memberId}
//             </div>
//           </div>
//           <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 font-medium text-white">
//             {brokerData.name.charAt(0)}
//           </div>
//         </div>
//       </header>

//       {/* Quick Stats */}
//       <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
//         {[
//           {
//             icon: Shield,
//             title: "Provider",
//             value: brokerData.provider,
//             sub: `${brokerData.members} members`,
//             color: "bg-blue-50 text-blue-600",
//           },
//           {
//             icon: CreditCard,
//             title: "Monthly Premium",
//             value: formatCurrency(brokerData.monthlyCost),
//             sub: "Per Month",
//             color: "bg-green-50 text-green-600",
//           },
//           {
//             icon: Calendar,
//             title: "Renewal Date",
//             value: brokerData.expiryDate,
//             sub: `From ${brokerData.effectiveDate}`,
//             color: "bg-purple-50 text-purple-600",
//           },
//           {
//             icon: Heart,
//             title: "Annual Limit",
//             value: formatCurrency(brokerData.annualLimit.total),
//             sub: `${formatCurrency(brokerData.annualLimit.used)} used`,
//             progress: progress,
//             color: "bg-amber-50 text-amber-600",
//           },
//         ].map((stat, index) => (
//           <Card
//             key={index}
//             className="statistic-card animate-fade-in"
//             style={{ animationDelay: `${index * 0.1}s` }}
//           >
//             <div className="flex items-center space-x-2">
//               <div className={`stat-icon rounded-full p-2 ${stat.color}`}>
//                 <stat.icon className="h-4 w-4" />
//               </div>
//               <h3 className="text-sm font-medium">{stat.title}</h3>
//             </div>
//             <p className="mt-2 text-xl font-bold">{stat.value}</p>
//             {stat.progress !== undefined && (
//               <Progress
//                 value={stat.progress}
//                 className="progress-animation mt-2 h-1.5"
//               />
//             )}
//             <p className="mt-1 text-xs text-gray-500">{stat.sub}</p>
//           </Card>
//         ))}
//       </div>

//       {/* Main Content */}
//       <Tabs
//         value={activeTab}
//         onValueChange={setActiveTab}
//         className="space-y-6"
//       >
//         <TabsList className="grid w-full grid-cols-4 rounded-xl border border-border/30 bg-primary-foreground p-1 shadow-sm">
//           {["overview", "plans", "benefits", "renewals"].map((tab) => (
//             <TabsTrigger
//               key={tab}
//               value={tab}
//               className="tab-transition rounded-lg capitalize"
//             >
//               {tab}
//             </TabsTrigger>
//           ))}
//         </TabsList>

//         <TabsContent value="overview" className="animate-fade-in space-y-6">
//           <div className="grid gap-6 md:grid-cols-2">
//             <Card className="card-hover animate-fade-in">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Calendar className="h-5 w-5 text-primary" />
//                   <span>Policy Renewals</span>
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div
//                   className={`chart-container h-[300px] ${chartVisible ? "transform-none opacity-100" : ""}`}
//                 >
//                   <ResponsiveContainer>
//                     <BarChart data={brokerData.renewalData}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                       <XAxis dataKey="month" />
//                       <YAxis />
//                       <Tooltip
//                         formatter={(value) => [`${value} policies`, "Renewals"]}
//                         contentStyle={{
//                           borderRadius: "8px",
//                           border: "none",
//                           boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
//                         }}
//                       />
//                       <Bar
//                         dataKey="policies"
//                         fill="#3b82f6"
//                         radius={[4, 4, 0, 0]}
//                         animationDuration={1500}
//                         animationEasing="ease-out"
//                       />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               </CardContent>
//             </Card>
//             <Card
//               className="card-hover animate-fade-in"
//               style={{ animationDelay: "0.2s" }}
//             >
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Package className="h-5 w-5 text-primary" />
//                   <span>Plan Distribution</span>
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div
//                   className={`chart-container h-[300px] ${chartVisible ? "transform-none opacity-100" : ""}`}
//                   style={{ animationDelay: "0.3s" }}
//                 >
//                   <ResponsiveContainer>
//                     <PieChart>
//                       <Pie
//                         data={brokerData.planDistribution}
//                         dataKey="value"
//                         nameKey="name"
//                         cx="50%"
//                         cy="50%"
//                         outerRadius={100}
//                         label={({ name, percent }) =>
//                           `${name} (${(percent * 100).toFixed(0)}%)`
//                         }
//                         animationDuration={1500}
//                         animationEasing="ease-out"
//                       >
//                         {brokerData.planDistribution.map((entry, index) => (
//                           <Cell
//                             key={`cell-${index}`}
//                             fill={COLORS[index % COLORS.length]}
//                             stroke="none"
//                           />
//                         ))}
//                       </Pie>
//                       <Tooltip
//                         formatter={(value) => `${value}%`}
//                         contentStyle={{
//                           borderRadius: "8px",
//                           border: "none",
//                           boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
//                         }}
//                       />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         <TabsContent
//           value="plans"
//           className="animate-fade-in space-y-6"
//           style={{ animationDelay: "0.1s" }}
//         >
//           <Card className="card-hover">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Shield className="h-5 w-5 text-primary" />
//                 <span>Active Plans</span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="border-b text-left text-sm text-gray-500">
//                       <th className="pb-4 font-medium">ID</th>
//                       <th className="pb-4 font-medium">Provider</th>
//                       <th className="pb-4 font-medium">Type</th>
//                       <th className="pb-4 font-medium">Monthly Cost</th>
//                       <th className="pb-4 font-medium">Renewal</th>
//                       <th className="pb-4 font-medium">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {brokerData.activePlans.map((plan, i) => (
//                       <tr
//                         key={plan.id}
//                         className="animate-fade-in border-b last:border-0"
//                         style={{ animationDelay: `${i * 0.15}s` }}
//                       >
//                         <td className="py-4 text-sm font-medium">{plan.id}</td>
//                         <td className="py-4 text-sm">{plan.provider}</td>
//                         <td className="py-4 text-sm">{plan.type}</td>
//                         <td className="py-4 text-sm">
//                           {formatCurrency(plan.monthlyCost)}
//                         </td>
//                         <td className="py-4 text-sm">{plan.renewal}</td>
//                         <td className="py-4">
//                           <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
//                             {plan.status}
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent
//           value="benefits"
//           className="animate-fade-in space-y-6"
//           style={{ animationDelay: "0.2s" }}
//         >
//           <Card className="card-hover">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Heart className="h-5 w-5 text-primary" />
//                 <span>Plan Benefits</span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid gap-4 md:grid-cols-2">
//                 {[
//                   { benefit: "Outpatient Care", coverage: "Fully Covered" },
//                   { benefit: "Inpatient Treatment", coverage: "Fully Covered" },
//                   {
//                     benefit: "Specialist Consultation",
//                     coverage: "Limited to ₦500,000",
//                   },
//                   { benefit: "Maternity Care", coverage: "Up to ₦1,000,000" },
//                   { benefit: "Prescription Drugs", coverage: "Fully Covered" },
//                   {
//                     benefit: "Dental Treatment",
//                     coverage: "Limited to ₦250,000",
//                   },
//                   { benefit: "Optical Care", coverage: "Limited to ₦200,000" },
//                   { benefit: "Mental Health", coverage: "Limited to ₦300,000" },
//                 ].map((item, index) => (
//                   <div
//                     key={index}
//                     className="animate-fade-in flex justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4"
//                     style={{ animationDelay: `${index * 0.1}s` }}
//                   >
//                     <p className="font-medium text-gray-900">{item.benefit}</p>
//                     <p className="font-medium text-primary">{item.coverage}</p>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent
//           value="renewals"
//           className="animate-fade-in space-y-6"
//           style={{ animationDelay: "0.3s" }}
//         >
//           <Card className="card-hover">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Calendar className="h-5 w-5 text-primary" />
//                 <span>Upcoming Renewals</span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {brokerData.upcomingRenewals.map((renewal, index) => (
//                   <div
//                     key={index}
//                     className="animate-fade-in flex flex-col justify-between rounded-xl border border-blue-100 bg-gradient-to-r from-white to-blue-50/50 p-4 md:flex-row md:items-center"
//                     style={{ animationDelay: `${index * 0.2}s` }}
//                   >
//                     <div className="mb-3 md:mb-0">
//                       <div className="flex items-center gap-2">
//                         <div className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-primary">
//                           {renewal.id}
//                         </div>
//                         <p className="text-sm text-gray-500">{renewal.date}</p>
//                       </div>
//                       <h3 className="mt-1 font-medium">{renewal.client}</h3>
//                       <p className="text-sm text-gray-600">{renewal.plan}</p>
//                     </div>
//                     <div className="flex items-center gap-3">
//                       <div className="text-lg font-bold text-primary">
//                         {formatCurrency(renewal.value)}
//                       </div>
//                       <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90">
//                         Manage
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {/* Quick Actions */}
//       <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
//         {[
//           {
//             icon: FileText,
//             title: "Generate Quote",
//             description: "Create custom insurance quotes for clients",
//             action: "Create",
//           },
//           {
//             icon: HelpCircle,
//             title: "Customer Support",
//             description: "Contact our support team for assistance",
//             action: "Contact",
//           },
//           {
//             icon: Package,
//             title: "Plan Comparison",
//             description: "Compare different insurance plans",
//             action: "Compare",
//           },
//         ].map((action, index) => (
//           <Card
//             key={index}
//             className="animate-fade-in bg-accent/100 p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
//             style={{ animationDelay: `${index * 0.15 + 0.5}s` }}
//           >
//             <div className="flex flex-col items-start space-y-2">
//               <div className="rounded-full bg-primary/10 p-2">
//                 <action.icon className="h-5 w-5 text-primary" />
//               </div>
//               <div>
//                 <h3 className="font-medium">{action.title}</h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   {action.description}
//                 </p>
//                 <button className="mt-3 inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80">
//                   {action.action} <span className="ml-1">→</span>
//                 </button>
//               </div>
//             </div>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// }
