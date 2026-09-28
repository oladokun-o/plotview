import { TextField } from "@/components/ui/TextField"
import { formatCardNumber, formatExpiry, type CardDetails } from "@/lib/payments/card"
import type { FieldErrors } from "@/lib/payments/types"

interface CardFormProps {
  formId: string
  details: CardDetails
  errors: FieldErrors<CardDetails>
  onChange: (details: CardDetails) => void
  onSubmit: () => void
}

/**
 * Standard card fields with the browser's card autofill hints. The number and
 * expiry format themselves as they are typed. Nothing entered here is stored or sent.
 */
export function CardForm({ formId, details, errors, onChange, onSubmit }: CardFormProps) {
  const update = (patch: Partial<CardDetails>) => onChange({ ...details, ...patch })

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="space-y-4"
    >
      <TextField
        id={`${formId}-number`}
        name="number"
        label="Card number"
        placeholder="1234 5678 9012 3456"
        inputMode="numeric"
        autoComplete="cc-number"
        value={details.number}
        onValueChange={(number) => update({ number: formatCardNumber(number) })}
        error={errors.number}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          id={`${formId}-expiry`}
          name="expiry"
          label="Expiry date"
          placeholder="MM / YY"
          inputMode="numeric"
          autoComplete="cc-exp"
          value={details.expiry}
          onValueChange={(expiry) => update({ expiry: formatExpiry(expiry) })}
          error={errors.expiry}
        />
        <TextField
          id={`${formId}-cvc`}
          name="cvc"
          label="Security code"
          placeholder="123"
          inputMode="numeric"
          autoComplete="cc-csc"
          maxLength={4}
          value={details.cvc}
          onValueChange={(cvc) => update({ cvc: cvc.replace(/\D/g, "") })}
          error={errors.cvc}
        />
      </div>
      <TextField
        id={`${formId}-name`}
        name="name"
        label="Name on card"
        placeholder="As it appears on the card"
        autoComplete="cc-name"
        value={details.name}
        onValueChange={(name) => update({ name })}
        error={errors.name}
      />
    </form>
  )
}
