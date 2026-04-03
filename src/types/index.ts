export type TicketSeverity = "P1" | "P2" | "P3" | "P4";
export type TicketStatus =
  | "open"
  | "analyzing"
  | "analyzed"
  | "chargeback_candidate"
  | "closed";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  rawIncidentText?: string;
  severity: TicketSeverity;
  status: TicketStatus;
  region: string;
  downtimeMinutes: number;
  openedAt: string;
  updatedAt: string;
  vendorHint?: string;
  rca?: RCAAnalysis | null;
  contractMatches?: ContractMatchResult[] | null;
}

export interface EquipmentAttribution {
  manufacturer: string;
  model: string;
  assetTag?: string;
  failureMode: string;
  confidence: number;
}

export interface VendorAttribution {
  vendorName: string;
  role: string;
  confidence: number;
  rationale: string;
}

export interface RCAAnalysis {
  rootCause: string;
  contributingFactors: string[];
  equipment: EquipmentAttribution[];
  vendors: VendorAttribution[];
  narrative: string;
  analyzedAt: string;
}

export interface ContractClause {
  id: string;
  title: string;
  type: "SLA" | "CREDIT" | "PENALTY" | "OTHER";
  text: string;
}

export interface VendorContract {
  id: string;
  vendorName: string;
  contractNumber: string;
  effectiveFrom: string;
  effectiveTo: string;
  slaSummary: string;
  chargebackClauses: ContractClause[];
  notes?: string;
  createdAt: string;
}

export type ChargebackStage =
  | "draft"
  | "review"
  | "approved"
  | "sent"
  | "disputed"
  | "paid";

export interface ChargebackTimelineEntry {
  id: string;
  at: string;
  action: string;
  actor: string;
  detail?: string;
}

export interface ChargebackLineItem {
  id: string;
  description: string;
  clauseId: string;
  clauseTitle: string;
  amount: number;
  legalBasis: string;
}

export interface Chargeback {
  id: string;
  ticketId: string;
  contractId: string;
  stage: ChargebackStage;
  title: string;
  totalAmount: number;
  lineItems: ChargebackLineItem[];
  evidenceSummary: string;
  timeline: ChargebackTimelineEntry[];
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractMatchResult {
  contractId: string;
  vendorName: string;
  triggeredClauses: {
    clauseId: string;
    clauseTitle: string;
    reason: string;
    maxRecoverableUsd: number;
  }[];
  totalMaxRecoverableUsd: number;
  summary: string;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  action: string;
  entityType: string;
  entityId?: string;
  detail?: string;
}
