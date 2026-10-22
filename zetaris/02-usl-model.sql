-- Proofline USL: one semantic model over all six sources (Lightning reference section 13).
-- Run each statement separately. Send COMPILE USL as ONE statement (JDBC/HTTP runner or
-- the UI's "Unified Semantic Layer -> New USL" flow); do not split the CREATE TABLEs.

CREATE NAMESPACE IF NOT EXISTS lightning.metastore.proofline;

COMPILE USL supplier_risk DEPLOY NAMESPACE lightning.metastore.proofline DDL
CREATE TABLE suppliers (
  id varchar(20) NOT NULL PRIMARY KEY,
  name varchar(100),
  hq varchar(100),
  since int,
  status varchar(20)
);
CREATE TABLE purchase_orders (
  id varchar(20) NOT NULL PRIMARY KEY,
  supplier_id varchar(20) FOREIGN KEY REFERENCES suppliers(id),
  order_date varchar(10),
  product varchar(100),
  qty_liters double,
  unit_price double,
  delivered_on_time int
);
CREATE TABLE quality_tests (
  id int NOT NULL PRIMARY KEY,
  supplier_id varchar(20) FOREIGN KEY REFERENCES suppliers(id),
  batch varchar(20),
  test_date varchar(10),
  brix double,
  ph double,
  microbial varchar(20),
  passed int
);
CREATE TABLE supplier_price_lists (
  supplier varchar(100) NOT NULL PRIMARY KEY,
  product varchar(100),
  unit_price_usd double,
  moq_liters int,
  lead_time_days int,
  contract_discount_pct int,
  updated varchar(10)
);
CREATE TABLE certifications (
  supplier varchar(100),
  certification varchar(100),
  valid_until varchar(10),
  scope varchar(50)
);
CREATE TABLE recall_notices (
  source varchar(100),
  date varchar(10),
  supplier varchar(100),
  notice varchar(500),
  severity varchar(20),
  url varchar(200)
);

-- Bind each USL table to its source query (schema-checked by the platform):
ACTIVATE USL TABLE lightning.metastore.proofline.supplier_risk.suppliers AS
SELECT COALESCE(id, '') AS id, name, hq, since, status FROM proofline_lake.suppliers;

ACTIVATE USL TABLE lightning.metastore.proofline.supplier_risk.purchase_orders AS
SELECT COALESCE(id, '') AS id, supplier_id, order_date, product, qty_liters, unit_price, delivered_on_time
FROM proofline_lake.purchase_orders;

ACTIVATE USL TABLE lightning.metastore.proofline.supplier_risk.quality_tests AS
SELECT COALESCE(id, 0) AS id, supplier_id, batch, test_date, brix, ph, microbial, passed
FROM proofline_lake.quality_tests;

ACTIVATE USL TABLE lightning.metastore.proofline.supplier_risk.supplier_price_lists AS
SELECT COALESCE(supplier, '') AS supplier, product, unit_price_usd, moq_liters, lead_time_days, contract_discount_pct, updated
FROM proofline_lake.supplier_price_lists;

ACTIVATE USL TABLE lightning.metastore.proofline.supplier_risk.certifications AS
SELECT supplier, certification, valid_until, scope FROM proofline_lake.certifications;

ACTIVATE USL TABLE lightning.metastore.proofline.supplier_risk.recall_notices AS
SELECT source, date, supplier, notice, severity, url FROM proofline_lake.recall_notices;
