-- Auckland Weather Game — Supabase Schema
-- Run this in the Supabase Dashboard → SQL Editor

-- ── Avatars ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_avatars (
  id          serial PRIMARY KEY,
  emoji       text NOT NULL,
  name        text NOT NULL,
  description text NOT NULL,
  cost        integer NOT NULL DEFAULT 0,
  is_default  boolean DEFAULT false
);

-- ── Profiles (anonymous users) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname         text NOT NULL UNIQUE,
  avatar_emoji     text NOT NULL DEFAULT '🌤️',
  score            integer DEFAULT 0,
  total_guesses    integer DEFAULT 0,
  correct_guesses  integer DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- ── Daily Guesses ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_guesses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES game_profiles(id) ON DELETE CASCADE,
  target_date  date NOT NULL,
  temp_guess   numeric(4,1) NOT NULL,
  rain_guess   boolean NOT NULL,
  actual_temp  numeric(4,1),
  actual_rain  boolean,
  temp_points  integer DEFAULT 0,
  rain_points  integer DEFAULT 0,
  bonus_points integer DEFAULT 0,
  is_verified  boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, target_date)
);

-- ── User's Unlocked Avatars ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_avatars (
  user_id    uuid REFERENCES game_profiles(id) ON DELETE CASCADE,
  avatar_id  integer REFERENCES game_avatars(id),
  unlocked_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, avatar_id)
);

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE game_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_guesses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_avatars  ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_avatars  ENABLE ROW LEVEL SECURITY;

-- Public read (leaderboard / shop)
CREATE POLICY "public_read_profiles" ON game_profiles FOR SELECT USING (true);
CREATE POLICY "public_read_guesses"  ON game_guesses  FOR SELECT USING (true);
CREATE POLICY "public_read_avatars"  ON game_avatars  FOR SELECT USING (true);
CREATE POLICY "public_read_user_avatars" ON user_avatars FOR SELECT USING (true);

-- Service-role writes (all mutations go through API routes with service key)
CREATE POLICY "service_insert_profiles" ON game_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_profiles" ON game_profiles FOR UPDATE USING (true);
CREATE POLICY "service_insert_guesses"  ON game_guesses  FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_guesses"  ON game_guesses  FOR UPDATE USING (true);
CREATE POLICY "service_insert_user_avatars" ON user_avatars FOR INSERT WITH CHECK (true);

-- ── Seed Avatars ─────────────────────────────────────────────────────────────
INSERT INTO game_avatars (emoji, name, description, cost, is_default) VALUES
  ('🌤️', '晴转多云',  '默认头像，就像奥克兰天气一样变幻莫测', 0,    true),
  ('⛅',  '多云',     '云层渐厚，但仍有阳光透过',              50,   false),
  ('🌧️', '小雨',     '奥克兰最常见的天气，雨中散步的浪漫',    100,  false),
  ('⛈️', '雷阵雨',   '风雨交加，惊雷闪电的戏剧之夜',          200,  false),
  ('🌈', '彩虹',     '雨后彩虹横跨天际，希望与美好',          300,  false),
  ('🌊', '海浪',     '塔斯曼海的汹涌浪潮，壮阔无边',          500,  false),
  ('🌋', '火山',     '北岛的地热奇观，万年传说',              800,  false),
  ('⭐', '星辰',     '夜空中最亮的星，照亮归途',             1000,  false),
  ('🦄', '独角兽',   '传说中的神兽，极其稀有的荣耀',         2000,  false)
ON CONFLICT DO NOTHING;
