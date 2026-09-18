import { supabase } from './supabase.js';
import { PLANS, canAccessFeature, tierLabel } from './tier.js';

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
function show(id) { ['auth-view','register-view','onboarding-view','app-view'].forEach((view) => $(`#${view}`).classList.toggle('hidden', view !== id)); }
function renderTeam() {
  $('#team-title').textContent = currentTeam.name;
  $('#tier-badge').textContent = tierLabel(currentTeam.tier) + (currentTeam.is_upgrade_pending ? ' · Đang chờ duyệt' : '');
  const plan = PLANS[currentTeam.tier];
  $('#plan-detail').textContent = plan ? `${plan.memberLimit === Infinity ? 'Không giới hạn' : `Tối đa ${plan.memberLimit}`} thành viên · ${plan.features.join(' · ')}` : '';
  document.querySelectorAll('[data-feature]').forEach((button) => {
    const locked = !canAccessFeature(currentTeam.tier, button.dataset.feature);
    button.querySelector('span')?.classList.toggle('hidden', !locked);
  });
  $('#transfer-note').textContent = `${currentTeam.name.toUpperCase().replace(/[^A-Z0-9]/g, '')}_BIAHOI`;
}
$('#auth-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const button = $('#auth-submit'); button.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({ email: $('#login-email').value.trim(), password: $('#login-password').value });
  button.disabled = false; if (error) return message('#auth-message', error.message); loadApp();
});
$('#show-register').addEventListener('click', () => show('register-view'));
$('#show-login').addEventListener('click', () => show('auth-view'));
$('#register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = $('#register-email').value.trim(), password = $('#register-password').value;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` } });
  if (error) return message('#register-message', error.message);
  if (data.session) return loadApp();
  message('#register-message', 'Tài khoản đã được tạo. Hãy kiểm tra Hộp thư đến hoặc Spam để xác nhận email, rồi quay lại đăng nhập.', 'text-lime');
});
$('#team-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const { data: team, error } = await supabase.rpc('create_team', { team_name: $('#team-name').value.trim() }).single();
  if (error) return message('#team-message', error.message);
  currentTeam = team; renderTeam(); show('app-view');
});
document.querySelectorAll('.feature-btn').forEach((button) => button.addEventListener('click', () => {
  const feature = button.dataset.feature;
  if (!canAccessFeature(currentTeam.tier, feature)) return openPaywall();
  const names = { overview: 'Tổng quan', unvoted_list: 'Danh sách chưa vote', treasury: 'Quỹ đội' };
  $('#feature-content').innerHTML = `<h2 class="text-xl font-bold">${names[feature]}</h2><p class="mt-2 text-sm text-slate-400">Tính năng đã được mở cho gói ${tierLabel(currentTeam.tier)}.</p>`;
}));
function openPaywall() { $('#paywall').classList.replace('hidden', 'flex'); }
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
