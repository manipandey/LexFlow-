// ============================================================
// LexFlow - Database TypeScript Types
// Generated to match the PostgreSQL schema exactly.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================
// ENUMS
// ============================================================

export type UserRole =
  | 'firm_owner'
  | 'senior_lawyer'
  | 'lawyer'
  | 'paralegal'
  | 'receptionist'
  | 'client'

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'

export type CaseStatus =
  | 'open'
  | 'under_review'
  | 'filed'
  | 'hearing_scheduled'
  | 'in_progress'
  | 'awaiting_decision'
  | 'closed'

export type CasePriority = 'low' | 'medium' | 'high' | 'urgent'

export type CaseType =
  | 'civil'
  | 'criminal'
  | 'family'
  | 'corporate'
  | 'intellectual_property'
  | 'real_estate'
  | 'immigration'
  | 'employment'
  | 'tax'
  | 'constitutional'
  | 'other'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type DocumentCategory =
  | 'contracts'
  | 'court_documents'
  | 'agreements'
  | 'evidence'
  | 'legal_notices'
  | 'client_ids'
  | 'other'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled'

export type NotificationType =
  | 'hearing_reminder'
  | 'task_deadline'
  | 'new_client'
  | 'new_document'
  | 'invoice_due'
  | 'case_update'
  | 'system'

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'upload'
  | 'download'
  | 'invite'
  | 'view'

// ============================================================
// ROW TYPES (match database columns exactly)
// ============================================================

export interface FirmRow {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string
  postal_code: string | null
  phone: string | null
  email: string | null
  website: string | null
  tax_id: string | null
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SubscriptionRow {
  id: string
  firm_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  max_team_members: number
  max_clients: number | null
  current_period_start: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface ProfileRow {
  id: string
  firm_id: string | null
  role: UserRole
  full_name: string
  avatar_url: string | null
  phone: string | null
  title: string | null
  bio: string | null
  is_active: boolean
  last_seen_at: string | null
  invited_by: string | null
  created_at: string
  updated_at: string
}

export interface ClientRow {
  id: string
  firm_id: string
  profile_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  company_name: string | null
  id_type: string | null
  id_number: string | null
  notes: string | null
  tags: string[]
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CaseRow {
  id: string
  firm_id: string
  case_number: string
  title: string
  case_type: CaseType
  description: string | null
  client_id: string
  assigned_lawyer_id: string | null
  priority: CasePriority
  status: CaseStatus
  court_name: string | null
  filing_date: string | null
  closing_date: string | null
  estimated_value: number | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CaseTeamMemberRow {
  case_id: string
  profile_id: string
  role_on_case: string | null
  added_at: string
}

export interface CaseUpdateRow {
  id: string
  firm_id: string
  case_id: string
  author_id: string | null
  update_type: string
  title: string | null
  content: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

export interface HearingRow {
  id: string
  firm_id: string
  case_id: string | null
  client_id: string | null
  assigned_lawyer_id: string | null
  title: string
  hearing_type: string
  court_name: string | null
  location: string | null
  hearing_date: string
  start_time: string | null
  end_time: string | null
  notes: string | null
  is_completed: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DocumentRow {
  id: string
  firm_id: string
  case_id: string | null
  client_id: string | null
  uploaded_by: string | null
  name: string
  original_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  category: DocumentCategory
  description: string | null
  is_shared_with_client: boolean
  created_at: string
  updated_at: string
}

export interface TaskRow {
  id: string
  firm_id: string
  case_id: string | null
  title: string
  description: string | null
  assigned_to: string | null
  created_by: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceRow {
  id: string
  firm_id: string
  client_id: string
  case_id: string | null
  invoice_number: string
  status: InvoiceStatus
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  currency: string
  notes: string | null
  payment_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItemRow {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
  created_at: string
}

export interface NotificationRow {
  id: string
  firm_id: string
  recipient_id: string
  type: NotificationType
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  read_at: string | null
  related_id: string | null
  related_type: string | null
  created_at: string
}

export interface ActivityLogRow {
  id: string
  firm_id: string
  user_id: string | null
  action: ActivityAction
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  description: string | null
  metadata: Json
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface MessageRow {
  id: string
  firm_id: string
  case_id: string | null
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

// ============================================================
// ENRICHED TYPES (with joined relations)
// ============================================================

export interface Client extends ClientRow {
  cases?: CaseRow[]
  documents?: DocumentRow[]
  invoices?: InvoiceRow[]
}

export interface Case extends CaseRow {
  client?: ClientRow
  assigned_lawyer?: ProfileRow
  team_members?: ProfileRow[]
  hearings?: HearingRow[]
  updates?: CaseUpdateRow[]
  tasks?: TaskRow[]
  documents?: DocumentRow[]
}

export interface Hearing extends HearingRow {
  case?: CaseRow
  client?: ClientRow
  assigned_lawyer?: ProfileRow
}

export interface Task extends TaskRow {
  case?: CaseRow
  assigned_to_profile?: ProfileRow
  created_by_profile?: ProfileRow
}

export interface Invoice extends InvoiceRow {
  client?: ClientRow
  case?: CaseRow
  items?: InvoiceItemRow[]
}

export interface Document extends DocumentRow {
  case?: CaseRow
  client?: ClientRow
  uploaded_by_profile?: ProfileRow
}

export interface Notification extends NotificationRow {
  recipient?: ProfileRow
}

export interface ActivityLog extends ActivityLogRow {
  user?: ProfileRow
}

// ============================================================
// FORM TYPES
// ============================================================

export interface CreateClientData {
  full_name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  company_name?: string
  id_type?: string
  id_number?: string
  notes?: string
  tags?: string[]
}

export interface CreateCaseData {
  title: string
  case_type: CaseType
  description?: string
  client_id: string
  assigned_lawyer_id?: string
  priority: CasePriority
  court_name?: string
  filing_date?: string
  estimated_value?: number
  notes?: string
  team_member_ids?: string[]
}

export interface CreateHearingData {
  case_id?: string
  client_id?: string
  assigned_lawyer_id?: string
  title: string
  hearing_type: 'hearing' | 'meeting' | 'consultation'
  court_name?: string
  location?: string
  hearing_date: string
  start_time?: string
  end_time?: string
  notes?: string
}

export interface CreateTaskData {
  case_id?: string
  title: string
  description?: string
  assigned_to?: string
  priority: TaskPriority
  due_date?: string
}

export interface CreateInvoiceData {
  client_id: string
  case_id?: string
  due_date?: string
  tax_rate?: number
  notes?: string
  currency?: string
  items: {
    description: string
    quantity: number
    unit_price: number
  }[]
}

// ============================================================
// UI STATE TYPES
// ============================================================

export interface DashboardMetrics {
  totalClients: number
  activeCases: number
  closedCases: number
  upcomingHearings: number
  pendingTasks: number
  monthlyRevenue: number
  teamMembers: number
  overdueTasks: number
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface FilterState {
  search?: string
  status?: string
  type?: string
  priority?: string
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

// ============================================================
// SERVER ACTION RESPONSE TYPES
// ============================================================

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}
