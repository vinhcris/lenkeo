export const TIER = Object.freeze({ TRA_DA: 'tra_da', BIA_HOI: 'bia_hoi', LEN_MAM: 'len_mam' });

export const PLANS = Object.freeze({
  [TIER.TRA_DA]: { label: 'Trà Đá', price: '0đ', memberLimit: 12, features: ['Vote lịch đá cơ bản', 'Thông tin đội bóng', 'Danh sách thành viên rút gọn'] },
  [TIER.BIA_HOI]: { label: 'Bia Hơi', price: '179.000đ/tháng', memberLimit: Infinity, features: ['Danh sách chưa vote', 'Sổ quỹ 4 mục chi tiết', 'Số dư cá nhân', 'Thống kê trận đấu'] },
  [TIER.LEN_MAM]: { label: 'Lên Mâm', price: '429.000đ/tháng', memberLimit: Infinity, features: ['Toàn bộ Bia Hơi', 'Đồng bộ Google Sheets', 'Logo & màu đội riêng', 'Hỗ trợ kỹ thuật 1-1'] }
});

const minimumTier = Object.freeze({
  overview: TIER.TRA_DA, team_identity: TIER.TRA_DA, member_list: TIER.TRA_DA,
  unvoted_list: TIER.BIA_HOI, treasury: TIER.BIA_HOI, personal_balance: TIER.BIA_HOI, match_stats: TIER.BIA_HOI,
  google_sheets: TIER.LEN_MAM, branding: TIER.LEN_MAM, priority_support: TIER.LEN_MAM
});
const tierWeight = Object.freeze({ [TIER.TRA_DA]: 0, [TIER.BIA_HOI]: 1, [TIER.LEN_MAM]: 2 });

export function canAccessFeature(tier, feature) { return tierWeight[tier] >= tierWeight[minimumTier[feature] ?? TIER.LEN_MAM]; }
export function tierLabel(tier) { const plan = PLANS[tier]; return plan ? `Gói ${plan.label} · ${plan.price}` : 'Gói chưa xác định'; }
export function memberLimit(tier) { return PLANS[tier]?.memberLimit ?? 0; }
