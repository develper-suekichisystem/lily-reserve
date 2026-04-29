-- ============================================================
-- ゆか Rinpa 予約システム — Supabase Schema
-- ============================================================

-- menus（メニューマスタ）
CREATE TABLE menus (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT        NOT NULL,
  price            INTEGER     NOT NULL,
  duration_minutes INTEGER     DEFAULT 60,
  description      TEXT,
  is_active        BOOLEAN     DEFAULT true,
  sort_order       INTEGER     DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- users（LINE連携ユーザー）
CREATE TABLE users (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id  TEXT        UNIQUE NOT NULL,
  name          TEXT        NOT NULL,
  phone         TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  is_first_visit BOOLEAN    DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- reservations（予約）
CREATE TABLE reservations (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES users(id)  NOT NULL,
  menu_id       UUID        REFERENCES menus(id)  NOT NULL,
  date          DATE        NOT NULL,
  time          TIME        NOT NULL,
  status        TEXT        DEFAULT 'confirmed'
                            CHECK (status IN ('confirmed', 'cancelled')),
  referrer_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 重複予約防止：confirmed状態での (date, time) を一意に
CREATE UNIQUE INDEX reservations_no_overlap
  ON reservations(date, time)
  WHERE status = 'confirmed';

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE menus         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations  ENABLE ROW LEVEL SECURITY;

-- menus: 有効メニューは全員読み取り可
CREATE POLICY "menus_select_active"
  ON menus FOR SELECT USING (is_active = true);

-- users: 全操作許可（サービスロールキー or anon経由 — 本番はRLS強化推奨）
CREATE POLICY "users_all"
  ON users FOR ALL USING (true) WITH CHECK (true);

-- reservations: 全操作許可
CREATE POLICY "reservations_all"
  ON reservations FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 初期データ（メニュー）
-- ============================================================
INSERT INTO menus (name, price, duration_minutes, description, sort_order) VALUES
  ('リンパドレナージュ（全身）', 12000, 60, '全身のリンパの流れを改善し、むくみやこりを解消します', 1),
  ('カウンセリング＋リンパケア', 15000, 60, 'カウンセリングとリンパケアを組み合わせたプレミアムコース', 2),
  ('肩・首集中ケア',            10000, 60, '肩こり・首こりに特化したケアコース', 3),
  ('フェイシャルリンパ',        11000, 60, '顔のリンパを流し、小顔・むくみ改善効果', 4),
  ('初回体験コース',             8000, 60, '初めての方向けのお試しコース（紹介者必須）', 5);
