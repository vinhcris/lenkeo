export const TIER = Object.freeze({ TRA_DA: 'tra_da', BIA_HOI: 'bia_hoi', LEN_MAM: 'len_mam' });
const lockedOnFree = new Set(['unvoted_list', 'treasury']);

export function canAccessFeature(tier, feature) {
  return tier !== TIER.TRA_DA || !lockedOnFree.has(feature);
}

export function tierLabel(tier) {
  return ({ tra_da: 'Gói Trà đá · Miễn phí', bia_hoi: 'Gói Bia hơi · 179.000đ/tháng', len_mam: 'Gói Lên mâm · Cao cấp' })[tier] ?? 'Gói chưa xác định';
}
