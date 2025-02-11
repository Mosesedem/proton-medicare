import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PaymentChoiceDialogProps {
  open: boolean
  onClose: () => void
  onChoose: (type: "subscription" | "onetime") => void
  price: number
  duration: string
}

export default function PaymentChoiceDialog({ open, onClose, onChoose, price, duration }: PaymentChoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-xl font-semibold">Choose Payment Option</DialogTitle>
        <div className="space-y-4 pt-4">
          <p>
            Plan Price: ${price.toFixed(2)} / {duration}
          </p>
          <div className="flex justify-between space-x-4">
            <Button onClick={() => onChoose("subscription")} className="w-full">
              Subscribe
            </Button>
            <Button onClick={() => onChoose("onetime")} className="w-full">
              One-time Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

