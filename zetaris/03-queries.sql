-- The federation queries behind Proofline's demo answers, against the USL.
-- These mirror src/agent/intents.ts one-for-one; on a live install the agent's
-- federated layer swaps SQLite/CSV for this endpoint and keeps the same
-- EvidenceRef lineage stamping (query text + row ids) on every result.

-- On-time delivery record per supplier (intent: onTime)
SELECT s.name AS supplier_name, COUNT(*) AS n, SUM(p.delivered_on_time) AS on_time, AVG(p.unit_price) AS avg_price
FROM lightning.metastore.proofline.supplier_risk.purchase_orders p
JOIN lightning.metastore.proofline.supplier_risk.suppliers s ON s.id = p.supplier_id
GROUP BY p.supplier_id, s.name;

-- Batch quality per supplier (intent: quality)
SELECT supplier_id, COUNT(*) AS n, SUM(passed) AS passed, AVG(brix) AS avg_brix
FROM lightning.metastore.proofline.supplier_risk.quality_tests
GROUP BY supplier_id;

-- Current price lists (intent: pricing)
SELECT * FROM lightning.metastore.proofline.supplier_risk.supplier_price_lists;

-- Certifications (intent: certs)
SELECT * FROM lightning.metastore.proofline.supplier_risk.certifications;

-- Recall / advisory exposure (intent: recalls)
SELECT * FROM lightning.metastore.proofline.supplier_risk.recall_notices;

-- Cheapest qualified option, joined across lake + warehouse in one query
-- (the cross-source join the demo answer cites):
SELECT pl.supplier, pl.unit_price_usd, pl.moq_liters, pl.lead_time_days, pl.contract_discount_pct,
       ot.n AS orders, ot.on_time AS on_time_deliveries
FROM lightning.metastore.proofline.supplier_risk.supplier_price_lists pl
JOIN (
  SELECT s.name AS supplier_name, COUNT(*) AS n, SUM(p.delivered_on_time) AS on_time
  FROM lightning.metastore.proofline.supplier_risk.purchase_orders p
  JOIN lightning.metastore.proofline.supplier_risk.suppliers s ON s.id = p.supplier_id
  GROUP BY p.supplier_id, s.name
) ot ON ot.supplier_name = pl.supplier
ORDER BY pl.unit_price_usd ASC;
