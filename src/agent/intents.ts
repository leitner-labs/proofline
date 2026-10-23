/** Question routing: pick a gather plan + claim builder per intent.
 *  Keeps the demo honest across question shapes, not just one hardcoded question. */
import { Federated } from '../tools/federated.js';

export type Intent = 'supplier-decision' | 'recalls' | 'pricing' | 'quality' | 'on-time' | 'savings';
export function classify(q: string): Intent {
  const s = q.toLowerCase();
  if (/recall|safety|contaminat|bacillus/.test(s)) return 'recalls';
  if (/on.?time|deliver|reliab/.test(s)) return 'on-time';
  if (/save|savings/.test(s)) return 'savings';
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
      `SELECT s.name AS supplier_name, COUNT(*) n, SUM(p.delivered_on_time) on_time, AVG(p.unit_price) avg_price
       FROM purchase_orders p JOIN suppliers s ON s.id = p.supplier_id GROUP BY p.supplier_id`),
    quality: () => fed.sql('quality_tests',
      `SELECT supplier_id, COUNT(*) n, SUM(passed) passed, AVG(brix) avg_brix
       FROM quality_tests GROUP BY supplier_id`),
    volume: () => fed.sql('purchase_orders',
      `SELECT SUM(qty_liters) total_liters, COUNT(*) n FROM purchase_orders`),
  };
  switch (intent) {
    case 'recalls': return { recalls: base.recalls(), certs: base.certs() };
    case 'on-time': return { onTime: base.onTime() };
    case 'savings': return { pricing: base.pricing(), volume: base.volume() };
    case 'pricing': return { pricing: base.pricing(), onTime: base.onTime() };
    case 'quality': return { quality: base.quality(), recalls: base.recalls() };
    default: return { pricing: base.pricing(), certs: base.certs(), recalls: base.recalls(), onTime: base.onTime(), quality: base.quality() };
  }
}
