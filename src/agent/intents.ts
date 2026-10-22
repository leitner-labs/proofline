/** Question routing: pick a gather plan + claim builder per intent.
 *  Keeps the demo honest across question shapes, not just one hardcoded question. */
import { Federated } from '../tools/federated.js';

export type Intent = 'supplier-decision' | 'recalls' | 'pricing' | 'quality';
export function classify(q: string): Intent {
  const s = q.toLowerCase();
  if (/recall|safety|contaminat|bacillus/.test(s)) return 'recalls';
  if (/price|cost|cheap|expensive|discount/.test(s)) return 'pricing';
  if (/quality|brix|test|pass rate/.test(s)) return 'quality';
  return 'supplier-decision';
}
export function plan(fed: Federated, intent: Intent) {
  const base = {
    pricing: () => fed.csv('supplier_price_lists.csv'),
    certs: () => fed.csv('certifications.csv'),
    recalls: () => fed.csv('recall_notices.csv'),
    onTime: () => fed.sql('purchase_orders',
      `SELECT supplier_id, COUNT(*) n, SUM(delivered_on_time) on_time, AVG(unit_price) avg_price
       FROM purchase_orders GROUP BY supplier_id`),
    quality: () => fed.sql('quality_tests',
      `SELECT supplier_id, COUNT(*) n, SUM(passed) passed, AVG(brix) avg_brix
       FROM quality_tests GROUP BY supplier_id`),
  };
  switch (intent) {
    case 'recalls': return { recalls: base.recalls(), certs: base.certs() };
    case 'pricing': return { pricing: base.pricing(), onTime: base.onTime() };
    case 'quality': return { quality: base.quality(), recalls: base.recalls() };
    default: return { pricing: base.pricing(), certs: base.certs(), recalls: base.recalls(), onTime: base.onTime(), quality: base.quality() };
  }
}
