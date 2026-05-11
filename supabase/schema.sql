-- ============================================================
-- ゆか Rinpa 予約システム — Supabase Schema
-- ============================================================

-- menus（メニューマスタ）
CREATE TABLE menus (
  id                         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name                       TEXT        NOT NULL,
  price                      INTEGER     NOT NULL,
  duration_minutes           INTEGER     DEFAULT 60,
  customer_duration_minutes  INTEGER,
  provider_duration_minutes  INTEGER,
  description                TEXT,
  is_active                  BOOLEAN     DEFAULT true,
  sort_order                 INTEGER     DEFAULT 0,
  created_at                 TIMESTAMPTZ DEFAULT NOW()
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

-- menus: 全操作許可
CREATE POLICY "menus_select_all"
  ON menus FOR SELECT USING (true);

CREATE POLICY "menus_insert"
  ON menus FOR INSERT WITH CHECK (true);

CREATE POLICY "menus_update"
  ON menus FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "menus_delete"
  ON menus FOR DELETE USING (true);

-- users: 全操作許可（サービスロールキー or anon経由 — 本番はRLS強化推奨）
CREATE POLICY "users_all"
  ON users FOR ALL USING (true) WITH CHECK (true);

-- reservations: 全操作許可
CREATE POLICY "reservations_all"
  ON reservations FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- closed_dates（定休曜日・特定の休日）
-- ============================================================
CREATE TABLE closed_dates (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  type         TEXT        NOT NULL CHECK (type IN ('weekly', 'date')),
  day_of_week  INTEGER     CHECK (day_of_week BETWEEN 0 AND 6),
  date         DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE closed_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "closed_dates_all" ON closed_dates FOR ALL USING (true) WITH CHECK (true);

-- available_slots（予約受付可能日時）
-- ※ 旧 blocked_slots（対応不可日時）から変更。管理者が「受付OK」の日時を登録する方式に変更。
CREATE TABLE available_slots (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  date       DATE        NOT NULL,
  time       TIME        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (date, time)
);

ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "available_slots_all" ON available_slots FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Migration: blocked_slots から available_slots へ移行
-- Supabase で既に blocked_slots が存在する場合は以下を実行:
-- DROP TABLE IF EXISTS blocked_slots;
-- DROP TABLE IF EXISTS closed_dates;
-- ============================================================

-- ============================================================
-- 初期データ（メニュー）
-- ============================================================
INSERT INTO menus (name, price, duration_minutes, description, sort_order) VALUES
  ('リンパドレナージュ（全身）', 12000, 60, '全身のリンパの流れを改善し、むくみやこりを解消します', 1),
  ('カウンセリング＋リンパケア', 15000, 60, 'カウンセリングとリンパケアを組み合わせたプレミアムコース', 2),
  ('肩・首集中ケア',            10000, 60, '肩こり・首こりに特化したケアコース', 3),
  ('フェイシャルリンパ',        11000, 60, '顔のリンパを流し、小顔・むくみ改善効果', 4),
  ('初回体験コース',             8000, 60, '初めての方向けのお試しコース（紹介者必須）', 5);
