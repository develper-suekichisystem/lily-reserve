import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Menu } from '../../types';

const EMPTY_FORM = {
  name: '',
  price: '',
  description: '',
  customer_duration_minutes: '60',
  provider_duration_minutes: '60',
  is_active: true,
};

export function MenuAdmin() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMenus(); }, []);

  async function fetchMenus() {
    setLoading(true);
    const { data } = await supabase
      .from('menus')
      .select('*')
      .eq('service_type', 'rinpa')
      .order('sort_order');
    if (data) setMenus(data as Menu[]);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(menu: Menu) {
    setEditing(menu);
    setForm({
      name: menu.name,
      price: String(menu.price),
      description: menu.description ?? '',
      customer_duration_minutes: String(menu.customer_duration_minutes ?? menu.duration_minutes ?? 60),
      provider_duration_minutes: String(menu.provider_duration_minutes ?? menu.duration_minutes ?? 60),
      is_active: menu.is_active,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);

    const customerMin = parseInt(form.customer_duration_minutes) || 60;
    const providerMin = parseInt(form.provider_duration_minutes) || 60;

    const payload = {
      name: form.name.trim(),
      price: parseInt(form.price),
      description: form.description.trim() || null,
      customer_duration_minutes: customerMin,
      provider_duration_minutes: providerMin,
      duration_minutes: customerMin, // 互換性のため
      is_active: form.is_active,
    };

    if (editing) {
      await supabase.from('menus').update(payload).eq('id', editing.id);
    } else {
      const maxOrder = menus.length > 0 ? Math.max(...menus.map(m => m.sort_order)) + 1 : 1;
      await supabase.from('menus').insert({ ...payload, sort_order: maxOrder, service_type: 'rinpa' });
    }

    setSaving(false);
    closeForm();
    fetchMenus();
  }

  async function toggleActive(menu: Menu) {
    await supabase.from('menus').update({ is_active: !menu.is_active }).eq('id', menu.id);
    fetchMenus();
  }

  async function handleDelete(menu: Menu) {
    if (!confirm(`「${menu.name}」を削除しますか？`)) return;
    await supabase.from('menus').delete().eq('id', menu.id);
    fetchMenus();
  }

  async function reorder(fromIndex: number, toIndex: number) {
    const reordered = [...menus];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    // 画面を即時更新（楽観的UI）
    setMenus(reordered);
    // 全件の sort_order を連番で振り直す
    await Promise.all(
      reordered.map((menu, i) =>
        supabase.from('menus').update({ sort_order: i + 1 }).eq('id', menu.id)
      )
    );
    fetchMenus();
  }

  const moveUp   = (i: number) => { if (i > 0)                  reorder(i, i - 1); };
  const moveDown = (i: number) => { if (i < menus.length - 1)   reorder(i, i + 1); };

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="menu-admin">
      <div className="menu-admin-header">
        <h2 className="admin-section-title">メニュー管理</h2>
        <button className="btn-add" onClick={openNew}>＋ 追加</button>
      </div>

      <div className="menu-admin-list">
        {menus.map((menu, index) => (
          <div key={menu.id} className={`menu-admin-card${menu.is_active ? '' : ' inactive'}`}>
            <div className="menu-order-btns">
              <button className="btn-order" onClick={() => moveUp(index)} disabled={index === 0}>▲</button>
              <button className="btn-order" onClick={() => moveDown(index)} disabled={index === menus.length - 1}>▼</button>
            </div>
            <div className="menu-admin-info">
              <div className="menu-admin-name">{menu.name}</div>
              <div className="menu-admin-price">¥{menu.price.toLocaleString()}</div>
              <div className="menu-admin-duration">
                お客様: {menu.customer_duration_minutes ?? menu.duration_minutes}分
                　自分: {menu.provider_duration_minutes ?? menu.duration_minutes}分
              </div>
              {menu.description && (
                <div className="menu-admin-desc">{menu.description}</div>
              )}
            </div>
            <div className="menu-admin-actions">
              <button
                className={`btn-toggle${menu.is_active ? ' active' : ''}`}
                onClick={() => toggleActive(menu)}
              >
                {menu.is_active ? '公開中' : '非公開'}
              </button>
              <button className="btn-edit" onClick={() => openEdit(menu)}>編集</button>
              <button className="btn-delete" onClick={() => handleDelete(menu)}>削除</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeForm()}>
          <div className="modal">
            <h3 className="modal-title">{editing ? 'メニューを編集' : 'メニューを追加'}</h3>

            <div className="form-group">
              <label className="form-label">メニュー名 <span className="required">*</span></label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="リンパドレナージュ（全身）"
              />
            </div>

            <div className="form-group">
              <label className="form-label">料金（円） <span className="required">*</span></label>
              <input
                className="form-input"
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="12000"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">お客様の所要時間（分）</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.customer_duration_minutes}
                  onChange={e => setForm(f => ({ ...f, customer_duration_minutes: e.target.value }))}
                  placeholder="60"
                />
                <span className="form-hint">お客様に表示される時間</span>
              </div>
              <div className="form-group">
                <label className="form-label">こちら側の所要時間（分）</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.provider_duration_minutes}
                  onChange={e => setForm(f => ({ ...f, provider_duration_minutes: e.target.value }))}
                  placeholder="90"
                />
                <span className="form-hint">準備・片付け込みの実際の時間</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">説明</label>
              <textarea
                className="form-input"
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="メニューの説明文"
              />
            </div>

            <div className="form-group">
              <label className="form-label-check">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                />
                公開する
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-next" onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
              <button className="btn-back" onClick={closeForm}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
