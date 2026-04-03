import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Chargeback, Ticket, VendorContract } from "@/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  headerBar: {
    borderBottomWidth: 3,
    borderBottomColor: "#A100FF",
    paddingBottom: 12,
    marginBottom: 20,
  },
  brand: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 1,
  },
  sub: {
    fontSize: 9,
    color: "#444",
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: { width: 120, color: "#555", fontSize: 9 },
  value: { flex: 1, fontSize: 9 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 6,
    marginTop: 16,
    fontWeight: 700,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    paddingVertical: 8,
    fontSize: 9,
  },
  colDesc: { flex: 3, paddingRight: 8 },
  colAmt: { width: 72, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  legal: {
    marginTop: 20,
    fontSize: 8,
    lineHeight: 1.4,
    color: "#333",
  },
  terms: {
    marginTop: 16,
    fontSize: 8,
    color: "#555",
  },
});

export function ChargebackInvoiceDocument({
  chargeback,
  contract,
  ticket,
}: {
  chargeback: Chargeback;
  contract: VendorContract | undefined;
  ticket: Ticket | undefined;
}) {
  const vendor = contract?.vendorName ?? "Vendor";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.brand}>VERIZON</Text>
          <Text style={styles.sub}>
            Network Engineering · CTO Office — Vendor chargeback notice
          </Text>
        </View>

        <Text style={styles.title}>Formal chargeback invoice</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Invoice number</Text>
          <Text style={styles.value}>{chargeback.invoiceNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{today}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bill to</Text>
          <Text style={styles.value}>{vendor}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contract</Text>
          <Text style={styles.value}>
            {contract?.contractNumber ?? "—"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Reference ticket</Text>
          <Text style={styles.value}>{ticket?.title ?? chargeback.ticketId}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colAmt}>Amount (USD)</Text>
        </View>
        {chargeback.lineItems.map((li) => (
          <View key={li.id} style={styles.tableRow} wrap={false}>
            <View style={styles.colDesc}>
              <Text>{li.description}</Text>
              <Text style={{ marginTop: 2, color: "#666", fontSize: 8 }}>
                Clause: {li.clauseTitle}
              </Text>
            </View>
            <Text style={styles.colAmt}>
              {li.amount.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginRight: 16 }}>
            Total due
          </Text>
          <Text style={{ fontSize: 11, fontWeight: 700, width: 90, textAlign: "right" }}>
            {chargeback.totalAmount.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </Text>
        </View>

        <Text style={styles.legal}>
          Legal basis: Amounts are invoiced pursuant to the referenced agreement and the
          following clause-level remedies (summarized per line item). Supporting technical
          evidence, root-cause analysis, and outage records are maintained under Verizon NE
          records retention and will be produced upon formal dispute resolution procedures
          defined in the agreement.
        </Text>
        <Text style={styles.legal}>
          Itemized legal references:{" "}
          {chargeback.lineItems.map((li) => li.legalBasis).join(" · ")}
        </Text>

        <Text style={styles.terms}>
          Payment terms: Net 30 from invoice date. Remit per wire instructions on file.
          Questions: NE Vendor Management — reference {chargeback.invoiceNumber}.
        </Text>
      </Page>
    </Document>
  );
}
