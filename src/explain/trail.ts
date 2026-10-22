/** Evidence trail: the heart of Proofline. Every claim links to evidence rows,
 *  each carrying source + query lineage. */
export interface EvidenceRef {
  evidenceId: string;
  source: string;          // e.g. 'roaster.db:purchase_orders' or 'certifications.csv'
  query: string;           // the query that produced it (lineage, Zetaris-style)
  rowIds: string[];        // primary keys / line numbers
  retrievedAt: string;     // ISO timestamp
  lineageId: string;       // stable id for the executed query (Zetaris lineage when federated)
}
export interface Claim {
  claimId: string;
  text: string;
  confidence: number;      // 0..1
  evidence: EvidenceRef[];
  verified: boolean;       // true only if >=1 evidence ref actually checked
}
export interface Answer {
  question: string;
  claims: Claim[];
  composedAt: string;
}
let n = 0;
export const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${(n++).toString(36)}`;
