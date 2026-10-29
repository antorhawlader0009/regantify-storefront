import type { StorefrontStockSettings } from '@/lib/storefrontApi';
import { bnDigits } from './storeText';

// Warranty and return policy per product (TellMe idea 54). A product that sets nothing uses the store's default
// (Store > Stock Settings); with no default either, nothing shows. Keep the codes in sync with the server's
// products/product-policy.ts and the client's PolicyField.

export interface ProductPolicyFields {
  warrantyKind?: string | null;
  warrantyCustom?: string | null;
  returnDays?: number | null;
  returnCondition?: string | null;
}

export interface ResolvedPolicy {
  warrantyKind: string | null;
  warrantyCustom: string | null;
  returnDays: number | null;
  returnCondition: string | null;
}

/** The product's own policy, falling back per part (warranty, return window) to the store default. Null when nothing is set. */
export function resolvePolicy(product: ProductPolicyFields, settings: StorefrontStockSettings | undefined): ResolvedPolicy | null {
  const ownWarranty = product.warrantyKind != null;
  const ownReturn = product.returnDays != null;
  const warrantyKind = ownWarranty ? product.warrantyKind! : (settings?.defaultWarrantyKind ?? null);
  const warrantyCustom = ownWarranty ? (product.warrantyCustom ?? null) : (settings?.defaultWarrantyCustom ?? null);
  const returnDays = ownReturn ? product.returnDays! : (settings?.defaultReturnDays ?? null);
  const returnCondition = ownReturn ? (product.returnCondition ?? null) : (settings?.defaultReturnCondition ?? null);
  const policy: ResolvedPolicy = {
    warrantyKind: warrantyKind === 'CUSTOM' && !warrantyCustom ? null : warrantyKind,
    warrantyCustom,
    returnDays,
    returnCondition,
  };
  return policy.warrantyKind || policy.returnDays != null ? policy : null;
}

const WARRANTY_EN: Record<string, string> = { NONE: 'No warranty', D7: '7 days warranty', M1: '1 month warranty', M6: '6 months warranty', Y1: '1 year warranty' };
const WARRANTY_BN: Record<string, string> = { NONE: 'ওয়ারেন্টি নেই', D7: '7 দিনের ওয়ারেন্টি', M1: '1 মাসের ওয়ারেন্টি', M6: '6 মাসের ওয়ারেন্টি', Y1: '1 বছরের ওয়ারেন্টি' };

/** One short line each, in the store's language; null for a part that is not set. */
export function policyLines(policy: ResolvedPolicy | null, language: string | undefined): { warranty: string | null; returns: string | null } {
  const bn = language === 'bn';
  let warranty: string | null = null;
  if (policy?.warrantyKind) {
    warranty =
      policy.warrantyKind === 'CUSTOM'
        ? `${bn ? 'ওয়ারেন্টি' : 'Warranty'}: ${policy.warrantyCustom}`
        : ((bn ? WARRANTY_BN : WARRANTY_EN)[policy.warrantyKind] ?? null);
  }
  let returns: string | null = null;
  if (policy && policy.returnDays != null) {
    if (policy.returnDays === 0) returns = bn ? 'ফেরত বা বদল নেই' : 'No returns or exchange';
    else {
      const base = bn ? `${bnDigits(policy.returnDays)} দিনের মধ্যে ফেরত বা বদল` : `Return or exchange within ${policy.returnDays} days`;
      returns = policy.returnCondition ? `${base} (${policy.returnCondition})` : base;
    }
  }
  return { warranty, returns };
}
