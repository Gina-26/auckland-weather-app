# 🌤️ Auckland Weather — 奥克兰天气分析 + 猜天气游戏

> 60年奥克兰气象数据分析 + 每日互动猜天气游戏，全栈数据科学项目作品集

**Live Demo** · [GitHub](https://github.com/your-username/auckland-weather-app)

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Python](https://img.shields.io/badge/Python-3.10+-blue) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

---

## 功能特性

### 📊 数据分析仪表盘
- **60年历史数据**：1966—2026 年奥克兰逐日最高/最低温度 + 降雨量
- **交互式图表**（Recharts）：月均气温折线图、60年趋势、月均降雨量柱状图
- **AI 季节预测**：基于傅里叶特征的线性回归模型，R² = 0.76

### 🎮 猜天气游戏
- 每天预测明天奥克兰最高温度（滑块选择）和是否下雨
- 次日通过 Open-Meteo 气象档案 API 自动验证并计算积分
- **积分规则**：温度差 ≤1°C → +20分 | ≤2°C → +10分 | ≤3°C → +5分 | 降雨猜对 → +10分 | 双中奖励 → +5分

### 🛒 头像商店
- 9款专属天气主题 emoji 头像（🌤️⛅🌧️⛈️🌈🌊🌋⭐🦄）
- 用游戏积分兑换，购买后永久拥有
- 实时积分排行榜（Top 10）

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 |
| 图表 | Recharts v3 |
| 数据分析 | Python · Pandas · scikit-learn |
| 后端 | Next.js API Routes · Supabase (PostgreSQL) |
| 天气 API | Open-Meteo（免费，无需 API Key） |
| 部署 | Vercel |

---

## 本地开发

### 前置条件
- Node.js 18+
- Python 3.10+（带 Anaconda 或手动安装 pandas/sklearn）

### 1. 克隆项目
```bash
git clone https://github.com/your-username/auckland-weather-app.git
cd auckland-weather-app
```

### 2. 运行 Python 数据分析（首次必做）
```bash
# 将原始 CSV 文件放到项目根目录上一级，或修改 analyze.py 中的路径
cd data
python analyze.py
# 生成 public/data/ 下的 4 个 JSON 文件
```

### 3. 配置环境变量
```bash
cp .env.local.example .env.local
# 编辑 .env.local，填入 Supabase 凭据
```

### 4. 配置 Supabase
1. 在 [app.supabase.com](https://app.supabase.com) 创建新项目
2. 在 SQL Editor 中执行 `supabase/schema.sql`
3. 将项目 URL 和 Key 填入 `.env.local`

### 5. 安装依赖并启动
```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

---

## 数据说明

数据来源：新西兰国家气象局（NIWA）奥克兰气象站

| 文件 | 内容 | 时间范围 |
|------|------|----------|
| `1962__Temperature__daily.csv` | 逐日最高/最低/平均气温 | 1966—2026 |
| `1962__Rain__daily.csv` | 逐日降雨量（mm） | 1962—2026 |

### 生成的 JSON 文件
```
public/data/
├── stats.json            # 全局统计（极值、均值、最热/最湿月等）
├── monthly_averages.json # 月均数据 + AI预测
├── yearly_trends.json    # 逐年均值趋势
└── model.json            # ML 模型元数据
```

### 模型训练
- **温度预测**：以 day-of-year 的傅里叶基（sin/cos）为特征，线性回归，R² = 0.76
- **降雨预测**：同特征，逻辑回归，准确率 = 66.2%

---

## 部署到 Vercel

```bash
npm install -g vercel
vercel --prod
```

在 Vercel Dashboard 配置以下环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_BASE_URL`（填写 Vercel 分配的域名，如 `https://auckland-weather-app.vercel.app`）

---

## 项目结构
```
auckland-weather-app/
├── data/
│   ├── analyze.py          # Python 数据分析 + ML 训练脚本
│   └── requirements.txt
├── public/data/            # Python 生成的 JSON（提交到 Git）
├── src/
│   ├── app/
│   │   ├── page.tsx        # 数据分析仪表盘
│   │   ├── game/page.tsx   # 猜天气游戏
│   │   ├── shop/page.tsx   # 头像商店
│   │   └── api/            # Next.js API 路由
│   ├── components/
│   │   ├── charts/         # Recharts 图表组件
│   │   ├── game/           # 游戏 UI 组件
│   │   └── ui/             # 通用组件（Navbar, StatCard）
│   ├── lib/
│   │   ├── supabase.ts     # Supabase 客户端
│   │   └── openmeteo.ts    # Open-Meteo API 封装
│   └── types/index.ts
└── supabase/schema.sql     # 数据库 DDL + 头像种子数据
```

---

## 开源协议

MIT
