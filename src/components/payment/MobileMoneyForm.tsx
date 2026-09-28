import { TextField } from "@/components/ui/TextField"
import type { MobileMoneyDetails } from "@/lib/payments/mobileMoney"
import type { FieldErrors } from "@/lib/payments/types"

interface MobileMoneyFormProps {
  formId: string
  methodName: string
  details: MobileMoneyDetails
  errors: FieldErrors<MobileMoneyDetails>
  onChange: (details: MobileMoneyDetails) => void
  onSubmit: () => void
}

/** The wallet's phone number; the payment request goes to that phone. */
export function MobileMoneyForm({ formId, methodName, details, errors, onChange, onSubmit }: MobileMoneyFormProps) {
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <TextField
        id={`${formId}-phone`}
        name="phone"
        label={`${methodName} number`}
        hint="We send the payment request to this phone. Approve it there with your PIN."
        placeholder="+237 677 123 456"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={details.phone}
        onValueChange={(phone) => onChange({ phone })}
        error={errors.phone}
      />
    </form>
  )
}
