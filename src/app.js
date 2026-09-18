import { supabase } from './supabase.js';
import { PAYMENT_QR_URL } from './config.js';
import { canAccessFeature, tierLabel } from './tier.js';

let currentTeam = null;
const $ = (selector) => document.querySelector(selector);
const message = (target, text, color = 'text-red-300') => { const el = $(target); el.textContent = text; el.className = `mt-4 text-sm ${color}`; };

async function loadApp() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return show('auth-view');
  $('#sign-out').classList.remove('hidden');
  const { data: memberships, error } = await supabase.from('team_memberships').select('team_id, teams(id,name,tier,is_upgrade_pending)').eq('user_id', session.user.id).limit(1);
  if (error) return message('#auth-message', `Không tải được đội: ${error.message}`);
  if (!memberships?.length) return show('onboarding-view');
  currentTeam = memberships[0].teams;
  renderTeam(); show('app-view');
}
function show(id) { ['auth-view','onboarding-view','app-view'].forEach((view) => $(`#${view}`).classList.toggle('hidden', view !== id)); }
function renderTeam() {
  $('#team-title').textContent = currentTeam.name;
  $('#tier-badge').textContent = tierLabel(currentTeam.tier) + (currentTeam.is_upgrade_pending ? ' · Đang chờ duyệt' : '');
  document.querySelectorAll('[data-feature]').forEach((button) => {
    const locked = !canAccessFeature(currentTeam.tier, button.dataset.feature);
    button.querySelector('span')?.classList.toggle('hidden', !locked);
  });
  $('#transfer-note').textContent = `LENKEO ${currentTeam.name.toUpperCase()} BIAHOI`;
}
$('#auth-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const button = $('#auth-submit'); button.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({ email: $('#email').value.trim(), password: $('#password').value });
  button.disabled = false; if (error) return message('#auth-message', error.message); loadApp();
});
$('#sign-up').addEventListener('click', async () => {
  const email = $('#email').value.trim(), password = $('#password').value;
  if (!email || password.length < 6) return message('#auth-message', 'Nhập email và mật khẩu tối thiểu 6 ký tự trước.');
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return message('#auth-message', error.message);
  message('#auth-message', 'Đã tạo tài khoản. Kiểm tra email để xác thực, sau đó đăng nhập.', 'text-lime');
});
$('#team-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const { data: { user } } = await supabase.auth.getUser();
  const { data: team, error } = await supabase.from('teams').insert({ name: $('#team-name').value.trim(), created_by: user.id }).select().single();
  if (error) return message('#team-message', error.message);
  const { error: memberError } = await supabase.from('team_memberships').insert({ team_id: team.id, user_id: user.id, role: 'owner' });
  if (memberError) return message('#team-message', memberError.message);
  currentTeam = team; renderTeam(); show('app-view');
});
document.querySelectorAll('.feature-btn').forEach((button) => button.addEventListener('click', () => {
  const feature = button.dataset.feature;
  if (!canAccessFeature(currentTeam.tier, feature)) return openPaywall();
  const names = { overview: 'Tổng quan', unvoted_list: 'Danh sách chưa vote', treasury: 'Quỹ đội' };
  $('#feature-content').innerHTML = `<h2 class="text-xl font-bold">${names[feature]}</h2><p class="mt-2 text-sm text-slate-400">Tính năng đã được mở cho gói ${tierLabel(currentTeam.tier)}.</p>`;
}));
function openPaywall() { $('#paywall').classList.replace('hidden', 'flex'); if (PAYMENT_QR_URL) { $('#payment-qr').src = PAYMENT_QR_URL; $('#payment-qr').classList.remove('hidden'); $('#qr-placeholder').classList.add('hidden'); } }
$('.close-modal').addEventListener('click', () => $('#paywall').classList.replace('flex', 'hidden'));
$('#upgrade-button').addEventListener('click', openPaywall);
$('#paid-button').addEventListener('click', async () => {
  const { error } = await supabase.from('teams').update({ is_upgrade_pending: true }).eq('id', currentTeam.id);
  if (error) return message('#payment-message', error.message);
  currentTeam.is_upgrade_pending = true; renderTeam(); message('#payment-message', 'Đã gửi yêu cầu. Admin sẽ xác nhận và mở gói cho đội bạn.', 'text-lime');
});
$('#sign-out').addEventListener('click', async () => { await supabase.auth.signOut(); currentTeam = null; $('#sign-out').classList.add('hidden'); show('auth-view'); });
supabase.auth.onAuthStateChange(() => loadApp());
loadApp();
