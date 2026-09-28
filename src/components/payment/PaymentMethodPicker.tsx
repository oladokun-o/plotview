import { CreditCard, Smartphone } from "lucide-react"
import { useId, type ReactNode } from "react"
import { cn } from "@/lib/cn"
import { PAYMENT_METHODS, PAYMENT_METHOD_NAME, type PaymentMethodId } from "@/lib/payments"

interface PaymentMethodPickerProps {
  value: PaymentMethodId
  onChange: (method: PaymentMethodId) => void
  disabled?: boolean
}

const DESCRIPTION: Record<PaymentMethodId, string> = {
  "mtn-momo": "Approve with your MoMo PIN",
  "orange-money": "Approve with your Orange Money PIN",
  card: "Visa, Mastercard and other cards",
}

const ICON: Record<PaymentMethodId, ReactNode> = {
  "mtn-momo": <Smartphone aria-hidden="true" className="size-5" />,
  "orange-money": <Smartphone aria-hidden="true" className="size-5" />,
  card: <CreditCard aria-hidden="true" className="size-5" />,
}

/** How to pay, as three selectable cards backed by native radio inputs. */
export function PaymentMethodPicker({ value, onChange, disabled }: PaymentMethodPickerProps) {
  const name = useId()
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-medium text-primary">Pay with</legend>
      <div className="mt-2 grid gap-2">
        {PAYMENT_METHODS.map((method) => {
          const checked = method === value
          return (
            <label
              key={method}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md p-3 ring-1 ring-inset transition-[background-color,box-shadow] duration-150 ease-standard",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                "has-[:disabled]:cursor-default has-[:disabled]:opacity-60",
                checked ? "bg-accent-soft ring-2 ring-accent" : "bg-surface ring-line-subtle hover:bg-sunken",
              )}
            >
              <input
                type="radio"
                name={name}
                value={method}
                checked={checked}
                onChange={() => onChange(method)}
                className="sr-only"
              />
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-sm", checked ? "bg-accent text-on-accent" : "bg-sunken text-secondary")}>
                {ICON[method]}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-primary">{PAYMENT_METHOD_NAME[method]}</span>
                <span className="block text-xs text-secondary">{DESCRIPTION[method]}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
