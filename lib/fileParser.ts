export async function parsePdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return (data.text as string).replace(/\s+\n/g, '\n').trim();
}

export function parseText(buffer: Buffer): string {
  return buffer.toString('utf-8').trim();
}
