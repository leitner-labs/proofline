-- Proofline source registration for a real Zetaris install (local Docker or AWS cluster).
-- Reference: Lightning command reference, sections 5.2-5.3
-- (zetaris.github.io/getting-started -> guides -> Lightning SQL commands).
--
-- Run statements ONE AT A TIME in SQL Workspace (it splits on semicolons).
-- Before running: put the six CSVs where your Zetaris install can read them
-- (S3/MinIO bucket or platform storage) and replace each <PATH-TO-...> value.
--   lake CSVs:    data/supplier_price_lists.csv, data/certifications.csv, data/recall_notices.csv
--   warehouse:    zetaris/warehouse/*.csv  (regenerate with `node zetaris/export-warehouse.mjs`)
-- Public S3 buckets also need:  isS3BucketPublic "true", useS3PathStyleAccess "true",
-- s3Endpoint "<region endpoint>"  -- see open_data/parquet_csv/HOWTO.md in getting-started.

CREATE LIGHTNING DATABASE proofline_lake DESCRIBE BY "Proofline supplier-risk sources (CSVs + warehouse export)";

CREATE LIGHTNING FILESTORE TABLE supplier_price_lists FROM proofline_lake FORMAT CSV OPTIONS (
  path "<PATH-TO-supplier_price_lists.csv>",
  header "true",
  inferSchema "true"
);

CREATE LIGHTNING FILESTORE TABLE certifications FROM proofline_lake FORMAT CSV OPTIONS (
  path "<PATH-TO-certifications.csv>",
  header "true",
  inferSchema "true"
);

CREATE LIGHTNING FILESTORE TABLE recall_notices FROM proofline_lake FORMAT CSV OPTIONS (
  path "<PATH-TO-recall_notices.csv>",
  header "true",
  inferSchema "true"
);

CREATE LIGHTNING FILESTORE TABLE suppliers FROM proofline_lake FORMAT CSV OPTIONS (
  path "<PATH-TO-warehouse/suppliers.csv>",
  header "true",
  inferSchema "true"
);

CREATE LIGHTNING FILESTORE TABLE purchase_orders FROM proofline_lake FORMAT CSV OPTIONS (
  path "<PATH-TO-warehouse/purchase_orders.csv>",
  header "true",
  inferSchema "true"
);

CREATE LIGHTNING FILESTORE TABLE quality_tests FROM proofline_lake FORMAT CSV OPTIONS (
  path "<PATH-TO-warehouse/quality_tests.csv>",
  header "true",
  inferSchema "true"
);

-- Smoke check:
SELECT * FROM proofline_lake.supplier_price_lists LIMIT 5;
