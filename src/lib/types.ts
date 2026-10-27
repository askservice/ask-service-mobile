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

// ── Signed-in client (GET /api/user/get-created-services, quotes, chats, profile) ──

export type QuoteStatus = 'SENT' | 'ACCEPTED' | 'IGNORED' | string

export type Quote = {
  _id: string
  vendor_id: string
  service_request_id: string
  quote_price: number
  price?: number
  price_display?: string
  service_description?: string
  available_start_date?: string
  /** Temporary link (1 h) to the file joined by the provider. */
  attachment_url?: string | null
  status: QuoteStatus
  createdAt: string
  provider_name?: string
  rating?: number | null
  reviews_count?: number
  vendor?: { _id: string; first_name?: string; last_name?: string; profile_pic?: string | null }
}

export type MyRequest = {
  _id: string
  reference_no: string
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | string
  service_category?: { _id: string; title: string; icon?: string | null } | null
  child_category?: { _id: string; title: string; icon?: string | null } | null
  city?: string
  pincode?: string
  address_1?: string
  note?: string
  createdAt: string
  /** open | hold | accepted | ignore | closed */
  quotes_status?: string
  quotes_count?: number
  new_quotes_count?: number
  accepted_quote_message?: string | null
  accepted_quote_sub_message?: string | null
  dynamic_answers?: { key: string; label: string; value: string }[] | null
  quotes?: (Quote | null)[] | null
}

export type ChatUser = {
  _id: string
  first_name?: string
  last_name?: string
  business_name?: string | null
  profile_pic?: string | null
  itsMe?: boolean
}

export type Chat = {
  _id: string
  users?: ChatUser[] | null
  latestMessage?: { content?: string; createdAt?: string; sender?: { _id?: string } | string } | null
  unreadCount?: number
  updatedAt: string
  quote_id?: { _id: string; quote_price?: number; service_request_id?: ChatRequest | string | null } | null
  // Request the conversation is about, set even before any quote.
  service_request_id?: ChatRequest | null
}

export type ChatRequest = {
  _id?: string
  reference_no?: string
  service_category?: { title?: string } | string | null
  child_category?: { title?: string } | string | null
  manual_child_category?: string | null
}

export type Message = {
  _id: string
  sender: { _id: string; first_name?: string; last_name?: string }
  content: string
  media_url?: string | null
  chat: { _id: string } | string
  createdAt: string
  readBy?: (string | { _id: string })[] | null
}

export type Profile = {
  _id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  is_phone_verified?: boolean
  address?: string | null
  postal_code?: string | null
  city?: string | null
  role?: string
  is_vendor?: boolean
}

export type NotificationPrefs = {
  email_notifications?: { new_quotes?: boolean; messages?: boolean; product_updates?: boolean }
  push_notifications?: { new_quotes?: boolean; messages?: boolean }
}
