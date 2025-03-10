import EnrollmentForm from "@/components/EnrollmentForm";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EnrollPage() {
  const userId = await requireAuth();

  if (!userId) {
    redirect("/sign-in");
  }
  return (
    // <div className="container mx-auto px-4 py-8">
    <EnrollmentForm />
    // </div>
  );
}
