"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  SEED_AUDIT,
  SEED_CHARGEBACKS,
  SEED_CONTRACTS,
  SEED_TICKETS,
} from "@/data/seed";
import { newId } from "@/lib/id";
import type {
  AuditLogEntry,
  Chargeback,
  ChargebackStage,
  ContractMatchResult,
  Ticket,
  VendorContract,
} from "@/types";

const STORAGE_KEY = "vzn-ne-chargeback-v1";

export interface AppState {
  tickets: Ticket[];
  contracts: VendorContract[];
  chargebacks: Chargeback[];
  auditLog: AuditLogEntry[];
  seedApplied: boolean;
  addAudit: (action: string, entityType: string, entityId?: string, detail?: string) => void;
  ensureSeed: () => void;
  addTicket: (t: Omit<Ticket, "id" | "openedAt" | "updatedAt"> & { id?: string }) => string;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  deleteTicket: (id: string) => void;
  addContract: (c: Omit<VendorContract, "id" | "createdAt"> & { id?: string }) => string;
  updateContract: (id: string, patch: Partial<VendorContract>) => void;
  deleteContract: (id: string) => void;
  addChargeback: (cb: Omit<Chargeback, "id" | "createdAt" | "updatedAt" | "invoiceNumber"> & { id?: string }) => string;
  updateChargeback: (id: string, patch: Partial<Chargeback>) => void;
  moveChargebackStage: (id: string, stage: ChargebackStage) => void;
  resetAll: () => void;
}

function nowIso() {
  return new Date().toISOString();
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tickets: [],
      contracts: [],
      chargebacks: [],
      auditLog: [],
      seedApplied: false,

      addAudit: (action, entityType, entityId, detail) => {
        const entry: AuditLogEntry = {
          id: newId(),
          at: nowIso(),
          action,
          entityType,
          entityId,
          detail,
        };
        set((s) => ({ auditLog: [entry, ...s.auditLog].slice(0, 500) }));
      },

      ensureSeed: () => {
        const { seedApplied, tickets, contracts } = get();
        if (seedApplied) return;
        if (tickets.length > 0 || contracts.length > 0) {
          set({ seedApplied: true });
          return;
        }
        set({
          tickets: SEED_TICKETS.map((t) => ({ ...t })),
          contracts: SEED_CONTRACTS.map((c) => ({ ...c })),
          chargebacks: SEED_CHARGEBACKS.map((c) => ({ ...c })),
          auditLog: [...SEED_AUDIT],
          seedApplied: true,
        });
      },

      addTicket: (t) => {
        const id = t.id ?? newId();
        const ts = nowIso();
        const ticket: Ticket = {
          ...t,
          id,
          openedAt: ts,
          updatedAt: ts,
        };
        set((s) => ({ tickets: [ticket, ...s.tickets] }));
        get().addAudit("Ticket created", "ticket", id);
        return id;
      },

      updateTicket: (id, patch) => {
        set((s) => ({
          tickets: s.tickets.map((x) =>
            x.id === id ? { ...x, ...patch, updatedAt: nowIso() } : x
          ),
        }));
        get().addAudit("Ticket updated", "ticket", id);
      },

      deleteTicket: (id) => {
        set((s) => ({
          tickets: s.tickets.filter((x) => x.id !== id),
          chargebacks: s.chargebacks.filter((c) => c.ticketId !== id),
        }));
        get().addAudit("Ticket deleted", "ticket", id);
      },

      addContract: (c) => {
        const id = c.id ?? newId();
        const contract: VendorContract = {
          ...c,
          id,
          createdAt: nowIso(),
        };
        set((s) => ({ contracts: [contract, ...s.contracts] }));
        get().addAudit("Contract added", "contract", id);
        return id;
      },

      updateContract: (id, patch) => {
        set((s) => ({
          contracts: s.contracts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
        get().addAudit("Contract updated", "contract", id);
      },

      deleteContract: (id) => {
        set((s) => ({
          contracts: s.contracts.filter((x) => x.id !== id),
          chargebacks: s.chargebacks.filter((c) => c.contractId !== id),
        }));
        get().addAudit("Contract deleted", "contract", id);
      },

      addChargeback: (cb) => {
        const id = cb.id ?? newId();
        const ts = nowIso();
        const num = `VZ-CB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const row: Chargeback = {
          ...cb,
          id,
          invoiceNumber: num,
          createdAt: ts,
          updatedAt: ts,
          timeline: cb.timeline ?? [
            {
              id: newId(),
              at: ts,
              action: "Draft created",
              actor: "NE Chargeback Console",
            },
          ],
        };
        set((s) => ({ chargebacks: [row, ...s.chargebacks] }));
        get().addAudit("Chargeback created", "chargeback", id);
        return id;
      },

      updateChargeback: (id, patch) => {
        set((s) => ({
          chargebacks: s.chargebacks.map((x) =>
            x.id === id ? { ...x, ...patch, updatedAt: nowIso() } : x
          ),
        }));
        get().addAudit("Chargeback updated", "chargeback", id);
      },

      moveChargebackStage: (id, stage) => {
        const ts = nowIso();
        set((s) => ({
          chargebacks: s.chargebacks.map((x) =>
            x.id === id
              ? {
                  ...x,
                  stage,
                  updatedAt: ts,
                  timeline: [
                    {
                      id: newId(),
                      at: ts,
                      action: `Stage → ${stage}`,
                      actor: "User",
                    },
                    ...x.timeline,
                  ],
                }
              : x
          ),
        }));
        get().addAudit(`Chargeback stage: ${stage}`, "chargeback", id);
      },

      resetAll: () => {
        set({
          tickets: [],
          contracts: [],
          chargebacks: [],
          auditLog: [],
          seedApplied: false,
        });
        get().ensureSeed();
        get().addAudit("Data reset", "system");
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tickets: s.tickets,
        contracts: s.contracts,
        chargebacks: s.chargebacks,
        auditLog: s.auditLog,
        seedApplied: s.seedApplied,
      }),
    }
  )
);

export function buildChargebackFromTicket(
  ticket: Ticket,
  contract: VendorContract,
  match: ContractMatchResult
): Omit<Chargeback, "id" | "createdAt" | "updatedAt" | "invoiceNumber"> {
  const lineItems = match.triggeredClauses.map((tc) => ({
    id: newId(),
    description: `${tc.clauseTitle} — estimated recovery`,
    clauseId: tc.clauseId,
    clauseTitle: tc.clauseTitle,
    amount: Math.round(tc.maxRecoverableUsd * 0.35),
    legalBasis: `${contract.contractNumber} — ${tc.clauseTitle}: ${tc.reason}`,
  }));
  const totalAmount = lineItems.reduce((a, b) => a + b.amount, 0);
  return {
    ticketId: ticket.id,
    contractId: contract.id,
    stage: "draft",
    title: `${contract.vendorName} — ${ticket.title}`,
    totalAmount,
    lineItems,
    evidenceSummary: ticket.rca?.narrative ?? ticket.description,
    timeline: [],
  };
}
