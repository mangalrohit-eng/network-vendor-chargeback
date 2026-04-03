"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { ChargebackInvoiceDocument } from "@/components/invoice/invoice-document";
import type { Chargeback, Ticket, VendorContract } from "@/types";

export function InvoicePdfActions({
  chargeback,
  contract,
  ticket,
}: {
  chargeback: Chargeback;
  contract: VendorContract | undefined;
  ticket: Ticket | undefined;
}) {
  const fileName = `${chargeback.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <ChargebackInvoiceDocument
          chargeback={chargeback}
          contract={contract}
          ticket={ticket}
        />
      }
      fileName={fileName}
      className="inline-flex"
    >
      {({ loading }) => (
        <Button
          type="button"
          variant="default"
          size="sm"
          className="rounded-sm"
          disabled={loading}
        >
          {loading ? "Preparing PDF…" : "Download PDF invoice"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
