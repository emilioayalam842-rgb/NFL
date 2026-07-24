import * as cheerio from "cheerio";

/**
 * Client for Banxico's public CEP (Comprobante Electrónico de Pago) lookup —
 * the same tool at banxico.org.mx/cep that anyone can use to confirm a SPEI
 * transfer really happened, given its tracking key (clave de rastreo).
 *
 * IMPORTANT — read before trusting this in production:
 * Banxico exposes no official API or SLA for this. The endpoint/markup below
 * reflects the form fields the public CEP site has used for years, but Banxico
 * can change the HTML, add a CAPTCHA, or rate-limit at any time without
 * notice. Treat a "not found" or "unreachable" result as "needs a human to
 * check", never as proof the transfer didn't happen — that's why every
 * PaymentClaim also has a MANUAL_REVIEW path in the admin panel. Don't quietly
 * auto-reject a claim; only auto-approve on a clear, confident match and let
 * everything else fall through to a person.
 */

const CEP_URL = process.env.BANXICO_CEP_URL ?? "https://www.banxico.org.mx/cep/valida.do";

export interface CepLookupInput {
  fecha: Date; // fecha de la operación
  claveRastreo: string;
  emisor: string; // clave del banco emisor (ordenante), 3-5 dígitos SPEI
  receptor: string; // clave del banco receptor (beneficiario) — normalmente el tuyo
  cuentaOrdenante: string;
  cuentaBeneficiaria: string; // tu CLABE / cuenta, la de PAYOUT_CLABE
  monto: number; // MXN, con centavos
}

export type CepResult =
  | { status: "MATCH"; raw: string }
  | { status: "AMOUNT_MISMATCH"; raw: string }
  | { status: "NOT_FOUND"; raw: string }
  | { status: "UNAVAILABLE"; reason: string };

function formatDateForBanxico(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

export async function lookupCep(input: CepLookupInput): Promise<CepResult> {
  const params = new URLSearchParams({
    fecha: formatDateForBanxico(input.fecha),
    criterioOrdenante: "0", // 0 = CLABE
    tipoCriterioOrdenante: "C",
    numCtaOrdenante: input.cuentaOrdenante,
    criterioBeneficiario: "0",
    tipoCriterioBeneficiario: "C",
    numCtaBeneficiario: input.cuentaBeneficiaria,
    emisor: input.emisor,
    receptor: input.receptor,
    monto: input.monto.toFixed(2),
    claveRastreo: input.claveRastreo,
  });

  let html: string;
  try {
    const res = await fetch(`${CEP_URL}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "text/html" },
      cache: "no-store",
    });
    if (!res.ok) return { status: "UNAVAILABLE", reason: `HTTP ${res.status}` };
    html = await res.text();
  } catch (err) {
    return { status: "UNAVAILABLE", reason: err instanceof Error ? err.message : "network error" };
  }

  const $ = cheerio.load(html);
  const text = $("body").text().replace(/\s+/g, " ").trim().toLowerCase();

  if (text.includes("captcha")) {
    return { status: "UNAVAILABLE", reason: "Banxico solicitó CAPTCHA; requiere revisión manual." };
  }

  const notFoundMarkers = ["no se encontr", "no existe", "no fue posible"];
  if (notFoundMarkers.some((m) => text.includes(m))) {
    return { status: "NOT_FOUND", raw: html };
  }

  // A confirmed CEP page echoes the exact amount searched for; if it's not
  // present in the response, don't trust a "success"-looking page.
  const amountStr = input.monto.toFixed(2);
  if (!text.includes(amountStr.replace(".", ",")) && !text.includes(amountStr)) {
    return { status: "AMOUNT_MISMATCH", raw: html };
  }

  return { status: "MATCH", raw: html };
}
