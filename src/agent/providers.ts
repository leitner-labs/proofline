/** Model providers. Nightshift = Meterless local runtime, OpenAI-compatible hotspot.
 *  Mock keeps CI/tests deterministic; Nightshift used for the real demo. */
export interface ModelProvider {
  name: string;
  complete(prompt: string): Promise<string>;
}
export class MockProvider implements ModelProvider {
  name = 'mock-deterministic';
  async complete(prompt: string): Promise<string> {
    if (prompt.startsWith('SYNTHESIZE:')) {
      const lines = prompt.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2));
      const top = lines[0] ?? 'no findings';
      return `Evidence-based answer (${lines.length} verified claim${lines.length === 1 ? '' : 's'}). Top finding: ${top} All claims below link to their source rows.`;
    }
    return 'ok';
  }
}
export class NightshiftProvider implements ModelProvider {
  name = 'meterless-nightshift';
  constructor(private baseUrl = process.env.NIGHTSHIFT_URL ?? 'http://localhost:11434/v1', private model = process.env.NIGHTSHIFT_MODEL ?? 'local-default') {}
  async complete(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`nightshift ${res.status}`);
    const j = (await res.json()) as { choices: { message: { content: string } }[] };
    return j.choices[0].message.content;
  }
}
