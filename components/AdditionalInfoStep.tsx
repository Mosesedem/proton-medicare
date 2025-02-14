"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { maritalStatus, plans, durations } from "@/lib/constants";
import { PlanSelectionModal } from "./PlanSelectionModal";

interface AdditionalInfoStepProps {
  formData: {
    dob: string;
    maritalStatus: string;
    plan: string;
    planId: string;
    duration: string;
    referral: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  price: number;
}

export function AdditionalInfoStep({
  formData,
  handleInputChange,
  handleSelectChange,
  handleFileChange,
  price,
}: AdditionalInfoStepProps) {
  const searchParams = useSearchParams();
  const [isPlanPreSelected, setIsPlanPreSelected] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    const planFromUrl = searchParams.get("plan");
    if (planFromUrl && !formData.plan) {
      const decodedPlan = decodeURIComponent(planFromUrl);
      const selectedPlan = plans.find((p) => p.name === decodedPlan);
      if (selectedPlan) {
        handleSelectChange("plan", decodedPlan);
        handleSelectChange("planId", selectedPlan.id);
      }
      setIsPlanPreSelected(true);
    }
  }, [searchParams, handleSelectChange, formData.plan]);

  const handleChangePlan = () => {
    setShowPlanModal(true);
  };

  const handlePlanSelection = (planName: string) => {
    const selectedPlan = plans.find((p) => p.name === planName);
    if (selectedPlan) {
      handleSelectChange("plan", planName);
      handleSelectChange("planId", selectedPlan.id);
    }
    setShowPlanModal(false);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="plan">Selected Plan</Label>
          <div className="flex items-center gap-3">
            {isPlanPreSelected || formData.plan ? (
              <>
                <Input
                  id="plan"
                  name="plan"
                  value={formData.plan}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChangePlan}
                  className="text-teal-600 hover:text-teal-500"
                >
                  <RefreshCw className="h-2 w-2 text-teal-400" />
                  {/* Change Plan */}
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowPlanModal(true)} className="w-full">
                Select Plan
              </Button>
            )}
          </div>
        </div>

        <Input
          id="planId"
          name="planId"
          type="hidden"
          value={formData.planId}
          onChange={handleInputChange}
          required
        />
        <div className="space-y-2">
          <Label htmlFor="duration">Payment Duration</Label>
          <Select
            onValueChange={(value) => handleSelectChange("duration", value)}
            value={formData.duration}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {durations.map((duration) => (
                <SelectItem key={duration.value} value={duration.value}>
                  {duration.label} ({duration.discount * 100}% off)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-2md font-bold">
          Total Price: ${price.toFixed(2)}
        </div>
      </div>
      <hr />
      <div className="text-2xl font-bold">User details</div>
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            name="dob"
            type="date"
            value={formData.dob}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <Select
            onValueChange={(value) =>
              handleSelectChange("maritalStatus", value)
            }
            value={formData.maritalStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Marital Status" />
            </SelectTrigger>
            <SelectContent>
              {maritalStatus.map((status) => (
                <SelectItem key={status.id} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="headshot">Headshot Image</Label>
          <Input
            id="headshot"
            name="headshot"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Referral Code</Label>
          <Input
            id="referral"
            name="referral"
            type="text"
            placeholder="User-referral ID"
            value={formData.referral}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* <PlanSelectionModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSelectPlan={(plan) => {
          handleSelectChange("plan", plan);
          setShowPlanModal(false);
        }}
        plans={plans}
      /> */}

      <PlanSelectionModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSelectPlan={handlePlanSelection}
        plans={plans}
      />
    </>
  );
}
