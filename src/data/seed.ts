import type {
  AuditLogEntry,
  Chargeback,
  Ticket,
  VendorContract,
} from "@/types";

const now = new Date().toISOString();

export const SEED_CONTRACTS: VendorContract[] = [
  {
    id: "ctr-nokia-001",
    vendorName: "Nokia",
    contractNumber: "VZ-NE-NOK-2024-8842",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2027-12-31",
    slaSummary:
      "Optical transport availability 99.995% monthly; hardware RMA within 4h critical; software defect credits per Exhibit C.",
    chargebackClauses: [
      {
        id: "nok-c1",
        title: "Hardware MTBF breach credit",
        type: "CREDIT",
        text: "If field-replaceable unit failure rate exceeds 0.15% per quarter, Verizon may invoice 120% of demonstrated outage impact per affected NE, capped at $2.5M per incident.",
      },
      {
        id: "nok-c2",
        title: "SLA availability service credit",
        type: "SLA",
        text: "Below 99.995% monthly availability, service credits escalate 2% of monthly fees per 0.001% deficit, minimum $75k per rolling outage window tied to vendor-attributed root cause.",
      },
    ],
    notes: "CTO Office master MSA — optical core.",
    createdAt: now,
  },
  {
    id: "ctr-ciena-002",
    vendorName: "Ciena",
    contractNumber: "VZ-NE-CIE-2023-4410",
    effectiveFrom: "2023-06-01",
    effectiveTo: "2026-05-31",
    slaSummary:
      "Coherent optics RMA NBD; NOC bridge within 30m for P1; liquidated damages for prolonged control-plane faults.",
    chargebackClauses: [
      {
        id: "cie-c1",
        title: "Control plane stability LD",
        type: "PENALTY",
        text: "Vendor-attributed control-plane instability exceeding 45 minutes in a single incident permits chargeback of documented labor, spares, and customer impact at $18k per commenced hour.",
      },
      {
        id: "cie-c2",
        title: "Spares logistics failure",
        type: "CREDIT",
        text: "Failure to meet committed spares delivery window allows recovery of expedite costs plus 15% penalty on affected circuit MRC for 3 months.",
      },
    ],
    createdAt: now,
  },
  {
    id: "ctr-cisco-003",
    vendorName: "Cisco",
    contractNumber: "VZ-NE-CSC-2025-1201",
    effectiveFrom: "2025-01-01",
    effectiveTo: "2028-12-31",
    slaSummary:
      "Router/switch TAC P1 response 15m; software bugfix SLAs per release train; SMARTnet credits for repeat failures.",
    chargebackClauses: [
      {
        id: "csc-c1",
        title: "Repeat defect remediation",
        type: "CREDIT",
        text: "Third occurrence of the same software defect class within 180 days on production hardware authorizes invoice for outage minutes × $950/min up to contract cap $400k.",
      },
    ],
    createdAt: now,
  },
];

export const SEED_TICKETS: Ticket[] = [
  {
    id: "tkt-1001",
    title: "Metro ring flap — ORD edge",
    description:
      "Multiple LOS alarms on 100G coherent line card; traffic shifted to protection within SLA.",
    severity: "P2",
    status: "analyzed",
    region: "Central",
    downtimeMinutes: 42,
    openedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: now,
    vendorHint: "Ciena",
    rca: {
      rootCause:
        "Firmware regression on Wavelogic line card triggered intermittent DSP lock loss under temperature gradient.",
      contributingFactors: [
        "Missed release note for thermal guard band",
        "Deferred patch window",
      ],
      equipment: [
        {
          manufacturer: "Ciena",
          model: "WL5e",
          assetTag: "NE-ORD-88421-LC3",
          failureMode: "DSP lock loss / coherent lock",
          confidence: 0.91,
        },
      ],
      vendors: [
        {
          vendorName: "Ciena",
          role: "OEM hardware & software",
          confidence: 0.93,
          rationale:
            "Vendor-confirmed defect in release 16.2.4; RMA not required after hotfix.",
        },
      ],
      narrative:
        "Incident correlated to vendor bug ID CIEN-77821; maintenance window applied corrective release.",
      analyzedAt: now,
    },
    contractMatches: [
      {
        contractId: "ctr-ciena-002",
        vendorName: "Ciena",
        triggeredClauses: [
          {
            clauseId: "cie-c1",
            clauseTitle: "Control plane stability LD",
            reason:
              "Control-plane instability window exceeded 45 minutes during flap storm.",
            maxRecoverableUsd: 486000,
          },
        ],
        totalMaxRecoverableUsd: 486000,
        summary:
          "Primary match on control-plane LD clause; spares clause not implicated.",
      },
    ],
  },
  {
    id: "tkt-1002",
    title: "Core router BGP churn",
    description:
      "ASR9k RP failover during routine config push; transient packet loss east coast aggregation.",
    severity: "P3",
    status: "open",
    region: "Northeast",
    downtimeMinutes: 18,
    openedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: now,
    vendorHint: "Cisco",
  },
  {
    id: "tkt-1003",
    title: "DWDM span degradation",
    description:
      "OSNR margin collapse on long-haul span LAX-PHX; pre-FEC errors above threshold.",
    severity: "P2",
    status: "chargeback_candidate",
    region: "West",
    downtimeMinutes: 67,
    openedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: now,
    vendorHint: "Nokia",
    rca: {
      rootCause:
        "Amplifier gain tilt after faulty pump laser in ILA hut; vendor RMA issued.",
      contributingFactors: [
        "Aging pump module",
        "Delayed proactive replacement",
      ],
      equipment: [
        {
          manufacturer: "Nokia",
          model: "1830 PSS-32x",
          assetTag: "ILA-LAXPHX-12",
          failureMode: "Pump laser degradation",
          confidence: 0.88,
        },
      ],
      vendors: [
        {
          vendorName: "Nokia",
          role: "OEM line system",
          confidence: 0.9,
          rationale: "Serial traced to known batch; vendor accepted RMA.",
        },
      ],
      narrative:
        "Field team replaced pump module; span restored within maintenance window.",
      analyzedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    contractMatches: [
      {
        contractId: "ctr-nokia-001",
        vendorName: "Nokia",
        triggeredClauses: [
          {
            clauseId: "nok-c1",
            clauseTitle: "Hardware MTBF breach credit",
            reason:
              "Quarterly FRU failure rate spike tied to pump batch; outage impact documented.",
            maxRecoverableUsd: 1250000,
          },
        ],
        totalMaxRecoverableUsd: 1250000,
        summary: "MTBF credit clause triggered; SLA clause secondary review.",
      },
    ],
  },
];

export const SEED_CHARGEBACKS: Chargeback[] = [
  {
    id: "cb-5001",
    ticketId: "tkt-1003",
    contractId: "ctr-nokia-001",
    stage: "review",
    title: "Nokia — LAX-PHX span pump failure",
    totalAmount: 890000,
    lineItems: [
      {
        id: "li-1",
        description: "Documented outage impact — labor & reroute",
        clauseId: "nok-c1",
        clauseTitle: "Hardware MTBF breach credit",
        amount: 620000,
        legalBasis:
          "Contract VZ-NE-NOK-2024-8842 § Hardware MTBF breach credit — vendor-attributed FRU failure with quarterly rate exceedance.",
      },
      {
        id: "li-2",
        description: "Expedite logistics & spares handling",
        clauseId: "nok-c1",
        clauseTitle: "Hardware MTBF breach credit",
        amount: 270000,
        legalBasis:
          "Same clause — 120% of demonstrated outage impact components per Exhibit C caps.",
      },
    ],
    evidenceSummary:
      "RCA package, SNMP/fiber trending, RMA acknowledgment, maintenance window logs.",
    timeline: [
      {
        id: "ev-1",
        at: new Date(Date.now() - 86400000 * 9).toISOString(),
        action: "Draft created",
        actor: "NE Chargeback Console",
        detail: "Auto-generated from RCA match",
      },
      {
        id: "ev-2",
        at: new Date(Date.now() - 86400000 * 8).toISOString(),
        action: "Evidence attached",
        actor: "j.doe@verizon.com",
      },
    ],
    invoiceNumber: "VZ-CB-2026-5001",
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    updatedAt: now,
  },
  {
    id: "cb-5002",
    ticketId: "tkt-1001",
    contractId: "ctr-ciena-002",
    stage: "sent",
    title: "Ciena — ORD metro flap",
    totalAmount: 320000,
    lineItems: [
      {
        id: "li-3",
        description: "Liquidated damages — commenced hours",
        clauseId: "cie-c1",
        clauseTitle: "Control plane stability LD",
        amount: 320000,
        legalBasis:
          "Contract VZ-NE-CIE-2023-4410 — LD at $18k/hour for vendor-attributed instability >45m.",
      },
    ],
    evidenceSummary: "RCA narrative, vendor bug ID, timeline of flap events.",
    timeline: [
      {
        id: "ev-3",
        at: new Date(Date.now() - 86400000 * 4).toISOString(),
        action: "Approved",
        actor: "m.smith@verizon.com",
      },
      {
        id: "ev-4",
        at: new Date(Date.now() - 86400000 * 3).toISOString(),
        action: "Invoice sent",
        actor: "NE Chargeback Console",
      },
    ],
    invoiceNumber: "VZ-CB-2026-5002",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: now,
  },
];

export const SEED_AUDIT: AuditLogEntry[] = [
  {
    id: "aud-1",
    at: now,
    action: "Seed data loaded",
    entityType: "system",
    detail: "Demo dataset initialized",
  },
];
