import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const VAT_RATE = 0.19;

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  companyName: { fontSize: 14, fontWeight: 700, color: "#059669" },
  metaLabel: { fontSize: 8, color: "#64748b" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#64748b", marginBottom: 20 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  rowLabel: { color: "#475569" },
  rowValue: { fontWeight: 700 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 },
  statBox: {
    width: "22%",
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 8,
  },
  statValue: { fontSize: 12, fontWeight: 700 },
  statLabel: { fontSize: 7, color: "#64748b", marginTop: 2 },
  priceBox: {
    marginTop: 16,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    padding: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  priceTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#059669",
  },
  priceTotalLabel: { fontSize: 12, fontWeight: 700 },
  priceTotalValue: { fontSize: 14, fontWeight: 700, color: "#059669" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

function eur(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

export type OfferDocumentProps = {
  offerNumber: string;
  createdAt: Date;
  customer: {
    salutation: string | null;
    firstName: string;
    lastName: string;
    company: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
  };
  pv: {
    kwp: number;
    moduleCount: number;
    moduleLabel: string;
    inverterLabel: string | null;
    storageLabel: string | null;
    annualYieldKwh: number;
    selfConsumptionKwh: number;
    autarkyPercent: number;
    savingsPerYearEur: number;
    co2SavingsKg: number;
  } | null;
  heatPump: {
    deviceLabel: string | null;
    heatLoadKw: number;
    jaz: number;
    annualOperatingCostEur: number;
    savingsPerYearEur: number | null;
    co2SavingsKg: number | null;
  } | null;
  clima: {
    deviceLabel: string | null;
    totalCoolingLoadKw: number;
    recommendedUnitsCount: number;
    estimatedAnnualOperatingCostEur: number;
  } | null;
  salesPriceNet: number;
  monthlyRate: number | null;
};

export function OfferDocument(props: OfferDocumentProps) {
  const { customer, pv, heatPump, clima, salesPriceNet, monthlyRate } = props;
  const salesPriceGross = salesPriceNet * (1 + VAT_RATE);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.companyName}>☀ PV &amp; Wärmepumpe Vertrieb</Text>
          <View>
            <Text style={styles.metaLabel}>Angebotsnummer</Text>
            <Text>{props.offerNumber}</Text>
            <Text style={[styles.metaLabel, { marginTop: 4 }]}>Datum</Text>
            <Text>{new Intl.DateTimeFormat("de-DE").format(props.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.title}>
          Angebot für {customer.salutation ? `${customer.salutation} ` : ""}
          {customer.firstName} {customer.lastName}
        </Text>
        <Text style={styles.subtitle}>
          {customer.company ? `${customer.company}\n` : ""}
          {[customer.street, [customer.postalCode, customer.city].filter(Boolean).join(" ")]
            .filter(Boolean)
            .join(", ")}
        </Text>

        {pv && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photovoltaikanlage</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Module</Text>
              <Text style={styles.rowValue}>
                {pv.moduleCount}x {pv.moduleLabel}
              </Text>
            </View>
            {pv.inverterLabel && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Wechselrichter</Text>
                <Text style={styles.rowValue}>{pv.inverterLabel}</Text>
              </View>
            )}
            {pv.storageLabel && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Batteriespeicher</Text>
                <Text style={styles.rowValue}>{pv.storageLabel}</Text>
              </View>
            )}
            <View style={styles.statGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{pv.kwp} kWp</Text>
                <Text style={styles.statLabel}>Anlagenleistung</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {pv.annualYieldKwh.toLocaleString("de-DE")} kWh
                </Text>
                <Text style={styles.statLabel}>Jahresertrag</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{pv.autarkyPercent} %</Text>
                <Text style={styles.statLabel}>Autarkiegrad</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{eur(pv.savingsPerYearEur)}</Text>
                <Text style={styles.statLabel}>Ersparnis / Jahr</Text>
              </View>
            </View>
          </View>
        )}

        {heatPump && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wärmepumpe</Text>
            {heatPump.deviceLabel && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Gerät</Text>
                <Text style={styles.rowValue}>{heatPump.deviceLabel}</Text>
              </View>
            )}
            <View style={styles.statGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{heatPump.heatLoadKw} kW</Text>
                <Text style={styles.statLabel}>Heizlast</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{heatPump.jaz}</Text>
                <Text style={styles.statLabel}>Jahresarbeitszahl</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {eur(heatPump.annualOperatingCostEur)}
                </Text>
                <Text style={styles.statLabel}>Betriebskosten / Jahr</Text>
              </View>
              {heatPump.savingsPerYearEur != null && (
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {eur(heatPump.savingsPerYearEur)}
                  </Text>
                  <Text style={styles.statLabel}>Ersparnis / Jahr</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {clima && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Klimaanlage</Text>
            {clima.deviceLabel && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Gerät</Text>
                <Text style={styles.rowValue}>{clima.deviceLabel}</Text>
              </View>
            )}
            <View style={styles.statGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{clima.totalCoolingLoadKw} kW</Text>
                <Text style={styles.statLabel}>Kühllast gesamt</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{clima.recommendedUnitsCount}</Text>
                <Text style={styles.statLabel}>Inneneinheiten</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {eur(clima.estimatedAnnualOperatingCostEur)}
                </Text>
                <Text style={styles.statLabel}>Betriebskosten / Jahr</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.priceBox}>
          <View style={styles.priceRow}>
            <Text style={styles.rowLabel}>Gesamtpreis (netto)</Text>
            <Text>{eur(salesPriceNet)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.rowLabel}>zzgl. 19% MwSt.</Text>
            <Text>{eur(salesPriceGross - salesPriceNet)}</Text>
          </View>
          <View style={styles.priceTotalRow}>
            <Text style={styles.priceTotalLabel}>Gesamtpreis (brutto)</Text>
            <Text style={styles.priceTotalValue}>{eur(salesPriceGross)}</Text>
          </View>
          {monthlyRate != null && (
            <View style={[styles.priceRow, { marginTop: 8 }]}>
              <Text style={styles.rowLabel}>Monatliche Finanzierungsrate</Text>
              <Text style={styles.rowValue}>{eur(monthlyRate)} / Monat</Text>
            </View>
          )}
        </View>

        <Text style={styles.footer}>
          Angaben zu Ertrag, Verbrauch und Amortisation sind unverbindliche
          Schätzwerte auf Basis vereinfachter Berechnungsverfahren. Alle Preise
          verstehen sich vorbehaltlich einer technischen Vor-Ort-Prüfung.
        </Text>
      </Page>
    </Document>
  );
}
