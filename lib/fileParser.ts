export async function parsePdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return (data.text as string).replace(/\s+\n/g, '\n').trim();
}

export async function parsePptx(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const officeParser = require('officeparser');
  const text: string = await officeParser.parseOfficeAsync(buffer);
  return text.replace(/\s+\n/g, '\n').trim();
}

export function parseText(buffer: Buffer): string {
  return buffer.toString('utf-8').trim();
}
