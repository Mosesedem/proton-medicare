// import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"

// interface PaymentChoiceDialogProps {
//   open: boolean
//   onClose: () => void
//   onChoose: (type: "subscription" | "onetime") => void
//   price: number
//   duration: string
// }

// export default function PaymentChoiceDialog({ open, onClose, onChoose, price, duration }: PaymentChoiceDialogProps) {
//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-md">
//         <DialogTitle className="text-xl font-semibold">Choose Payment Option</DialogTitle>
//         <div className="space-y-4 pt-4">
//           <p>
//             Plan Price: ${price.toFixed(2)} / {duration}
//           </p>
//           <div className="flex justify-between space-x-4">
//             <Button onClick={() => onChoose("subscription")} className="w-full">
//               Subscribe
//             </Button>
//             <Button onClick={() => onChoose("onetime")} className="w-full">
//               One-time Payment
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CreditCard, RefreshCw } from "lucide-react";

const PaymentChoiceDialog = ({
  open,
  onClose,
  onChoose,
  price,
  duration,
}: {
  open: boolean;
  onClose: () => void;
  onChoose: (type: "subscription" | "onetime") => void;
  price: number;
  duration: string;
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogTitle className="text-center text-xl font-bold">
          How would you like to pay?
        </DialogTitle>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
            onClick={() => onChoose("subscription")}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-primary/10 p-3">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Subscription Based</h3>
              <p className="text-center text-sm text-gray-500">
                Auto-renew at the end of {duration} months to maintain
                continuous coverage
              </p>
              <div className="text-2xl font-bold text-primary">
                ${price}/{duration} Months
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Uninterrupted
                  coverage
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Automatic renewals
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Cancel anytime
                </li>
              </ul>
            </div>
          </Card>

          <Card
            className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
            onClick={() => onChoose("onetime")}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-primary/10 p-3">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">One-Time Payment</h3>
              <p className="text-center text-sm text-gray-500">
                Single payment for {duration} months worth of coverage
              </p>
              <div className="text-2xl font-bold text-primary">${price}</div>
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  Your insurance cycle may be disrupted if your plan expires and
                  is not renewed on time
                </p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentChoiceDialog;
