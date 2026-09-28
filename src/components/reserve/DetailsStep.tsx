"use client"

import { useRef, useState, type FormEvent } from "react"
import { SelectField } from "@/components/ui/SelectField"
import { TextField } from "@/components/ui/TextField"
import { RELATIONSHIP_OPTIONS, validateBuyer, type BuyerField } from "@/lib/reservation"
import type { BuyerDetails } from "@/lib/store"
import { StepHeading } from "./StepHeading"
import { STEP_TITLE } from "./steps"

interface DetailsStepProps {
  formId: string
  buyer: BuyerDetails
  onChange: (patch: Partial<BuyerDetails>) => void
  onValid: () => void
}

const FIELD_ORDER: BuyerField[] = ["fullName", "phone", "email", "relationship"]

/**
 * The buyer's contact details. A field shows its error once the person has
 * left it or tried to continue, never while they are still typing it for the
 * first time. Continuing with errors moves focus to the first one.
 */
export function DetailsStep({ formId, buyer, onChange, onValid }: DetailsStepProps) {
  const [touched, setTouched] = useState<Partial<Record<BuyerField, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const errors = validateBuyer(buyer)
  const visibleError = (field: BuyerField) => (submitted || touched[field] ? errors[field] : undefined)
  const touch = (field: BuyerField) => () => setTouched((current) => ({ ...current, [field]: true }))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const firstInvalid = FIELD_ORDER.find((field) => errors[field])
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    onValid()
  }

  return (
    <form ref={formRef} id={formId} noValidate onSubmit={handleSubmit}>
      <StepHeading description="We use these only to confirm the reservation with you.">{STEP_TITLE.details}</StepHeading>
      <div className="space-y-4">
        <TextField
          id={`${formId}-name`}
          name="fullName"
          label="Full name"
          placeholder="First and last name"
          autoComplete="name"
          value={buyer.fullName}
          onValueChange={(fullName) => onChange({ fullName })}
          onBlur={touch("fullName")}
          error={visibleError("fullName")}
        />
        <TextField
          id={`${formId}-phone`}
          name="phone"
          label="Phone number"
          placeholder="+237 677 123 456"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={buyer.phone}
          onValueChange={(phone) => onChange({ phone })}
          onBlur={touch("phone")}
          error={visibleError("phone")}
        />
        <TextField
          id={`${formId}-email`}
          name="email"
          label="Email"
          placeholder="name@example.com"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          value={buyer.email}
          onValueChange={(email) => onChange({ email })}
          onBlur={touch("email")}
          error={visibleError("email")}
        />
        <SelectField
          id={`${formId}-relationship`}
          name="relationship"
          label="Your relationship to the deceased"
          optional
          placeholder="Select if you wish"
          options={RELATIONSHIP_OPTIONS}
          value={buyer.relationship}
          onValueChange={(relationship) => onChange({ relationship })}
        />
      </div>
    </form>
  )
}
