import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

export type CartaType = 'cultura' | 'docente';

export interface CheckResult {
  nominativo: string;
  partitaIva: string;
  ambito: string;
  bene: string;
  importo: string;
}

const ENDPOINTS: Record<CartaType, string> = {
  cultura:
    'https://ws-cartegiovani.cultura.gov.it/WSUtilizzoVoucherGMWEB/VerificaVoucher',
  docente:
    'https://ws.cartadeldocente.istruzione.it/VerificaVoucherDocWEB/VerificaVoucher',
};

function buildSoapEnvelope(codiceVoucher: string): string {
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ver="http://bonus.mibact.it/VerificaVoucher/">
  <soapenv:Header/>
  <soapenv:Body>
    <ver:CheckRequestObj>
      <checkReq>
        <tipoOperazione>1</tipoOperazione>
        <codiceVoucher>${codiceVoucher}</codiceVoucher>
      </checkReq>
    </ver:CheckRequestObj>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const m = xml.match(re);
  return m ? m[1] : '';
}

function extractFault(xml: string): string | null {
  const faultString = extractTag(xml, 'faultstring');
  if (faultString) return faultString;
  const detail = extractTag(xml, 'detail');
  if (detail) return detail;
  return null;
}

export async function checkVoucher(
  codiceVoucher: string,
  tipo: CartaType,
): Promise<CheckResult> {
  const certPath = process.env.SOGEI_CERT_PATH;
  const passphrase = process.env.SOGEI_CERT_PASSPHRASE;

  if (!certPath || !passphrase) {
    throw new Error('SOGEI_CERT_PATH e SOGEI_CERT_PASSPHRASE devono essere configurati');
  }

  const certFile = fs.readFileSync(path.resolve(certPath));

  const agent = new https.Agent({
    cert: certFile,
    key: certFile,
    passphrase,
  });

  const endpoint = ENDPOINTS[tipo];
  const body = buildSoapEnvelope(codiceVoucher);

  const response = await new Promise<string>((resolve, reject) => {
    const url = new URL(endpoint);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        agent,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: '',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  const fault = extractFault(response);
  if (fault) {
    const msg = fault.toLowerCase().includes('internal error')
      ? 'Buono non trovato o non valido'
      : fault;
    throw new Error(msg);
  }

  const nominativo = extractTag(response, 'nominativoBeneficiario');
  const importo = extractTag(response, 'importo');

  if (!nominativo && !importo) {
    throw new Error('Risposta SOAP non valida o buono non trovato');
  }

  return {
    nominativo: extractTag(response, 'nominativoBeneficiario'),
    partitaIva: extractTag(response, 'partitaIvaEsercente'),
    ambito: extractTag(response, 'ambito'),
    bene: extractTag(response, 'bene'),
    importo: extractTag(response, 'importo'),
  };
}
