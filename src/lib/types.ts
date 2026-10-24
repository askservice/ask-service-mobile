// Shapes of the Ask Service API used by the request flow (GET /api/user/service-categories,
// GET /api/user/service-questions/:service_id, POST /api/user/service-request).

export type Service = {
  _id: string
  title: string
  icon?: string | null
  display_order?: number
}

export type ServiceGroup = {
  _id: string
  title: string
  display_order?: number
  child_categories: Service[]
}

export type QuestionOption = { label: string; value: string; point?: number }

export type Question = {
  _id: string
  label: string
  key: string
  type: string
  is_required?: boolean
  is_multiple?: boolean
  placeholder?: string
  step?: number
  order?: number
  options?: QuestionOption[]
}

export type ClientType = 'Individual' | 'Company'

export type Location = {
  address: string
  pincode: string
  city: string
  state: string
  country: string
}

export type Contact = {
  firstName: string
  lastName: string
  phone: string
  email: string
  notes: string
}

/** Answer of one question: one value, or several for a multiple choice. */
export type Answer = string | string[]

export type Draft = {
  service: Service | null
  clientType: ClientType | null
  location: Location | null
  answers: Record<string, Answer>
  contact: Contact
}
