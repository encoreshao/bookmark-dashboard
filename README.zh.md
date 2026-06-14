<p align="right">
  <a href="README.md">English</a> | <a href="README.zh.md">简体中文</a>
</p>

<p align="center">
  <img src="src/icons/icon128.png" width="80" alt="书签仪表板" />
</p>

<h1 align="center">书签仪表板 — AI赋能</h1>

<p align="center">
  <strong>用智能、美观的书签指挥中心替换你的新标签页。</strong><br/>
  搜索、整理、标签、分析你的全部书签库 — 由 AI 驱动。
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/bookmark-dashboard/imknfkidkilkomeomcidnnjojiilaofb"><img src="https://img.shields.io/chrome-web-store/v/imknfkidkilkomeomcidnnjojiilaofb?label=Chrome%20Web%20Store&color=4285F4&style=flat-square" alt="Chrome 网上应用店" /></a>
  <img src="https://img.shields.io/badge/manifest-v3-10B981?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/typescript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-F59E0B?style=flat-square" alt="MIT 许可证" />
</p>

---

## 为什么选择书签仪表板？

Chrome 默认的新标签页是浪费的空间。每次打开新标签页，你面对的是一片空白 — 而那些曾经用心保存的数百个书签，正在你遗忘的文件夹里积灰。

书签仪表板将那个浪费的瞬间变成强大的生产力中枢：

- **所有书签，即时呈现** — 打开新标签页的瞬间，你的全部书签库就已加载完毕
- **AI 行动，而不只是建议** — 一键重组、去重、清理失效链接
- **标签，而不只是文件夹** — 在 Chrome 文件夹结构之上叠加灵活的标签体系
- **零锁定** — 直接使用 Chrome 书签 API；卸载后一切原封不动
- **隐私优先** — 所有数据本地存储；AI API 密钥保存在浏览器中，永不上传服务器

---

## 功能特性

### 书签管理

| 功能 | 说明 |
|---|---|
| **全文搜索** | 按标题或 URL 即时查找任意书签 — `⌘K` / `Ctrl+K` 跳转搜索框；显示实时结果数量和清除按钮 |
| **添加书签** | `N` 打开两步对话框：输入 URL + 标题 + 文件夹，然后应用标签（可选 AI 建议） |
| **拖拽排序** | 拖动书签在文件夹间移动；全程可视化反馈 |
| **批量操作** | 选中多个书签，一次性移动或删除 |
| **编辑与删除** | 重命名书签，带确认的删除 — 全部从卡片操作 |
| **置顶收藏** | 将任意书签置顶到始终可见的顶部区域或专属右侧栏 |
| **文件夹侧边栏** | 左侧边缘的细拉条，悬停或点击展开完整文件夹树；可固定展开或作为浮动覆盖层 |
| **文件夹与标签浏览器** | 侧边栏分为文件夹（上，可滚动）和标签（下，可滚动）两个独立区域 |
| **文件夹搜索** | 实时筛选文件夹树，快速跳转到任意文件夹 |

### 标签系统

标签叠加在 Chrome 文件夹结构之上，而非取而代之。一个书签可以在某个文件夹中，同时拥有任意数量的标签。

| 功能 | 说明 |
|---|---|
| **灵活打标签** | 为任意书签添加一个或多个标签 — 无需预定义列表 |
| **自动分配颜色** | 每个标签从 10 色调色板中自动获得独特颜色 |
| **标签筛选条** | 点击一个或多个标签，即时筛选整个仪表板 |
| **侧边栏标签浏览器** | 文件夹侧边栏中的可滚动标签列表，含每个标签的数量 |
| **AI 标签建议** | 添加书签时，AI 根据页面内容推荐相关标签 |
| **保存时自动打标签** | 可选择在每次保存新书签时自动触发 AI 标签建议 |
| **标签管理** | 创建、重命名和删除标签；孤立标签自动清理 |

### AI 洞察

连接你自己的 API 密钥 — OpenAI、Google Gemini 或 Anthropic Claude — 解锁智能书签管理。密钥本地存储，永不共享。

| 模式 | 功能说明 |
|---|---|
| **整理评分** | 对书签库整理质量评分（0–100），提供具体可操作的建议 |
| **智能分析** | 全面概览：文件夹结构健康度、命名一致性、内容多样性及顶级建议 |
| **查找重复** | 即时本地扫描 — 一键清理跨文件夹的所有重复 URL |
| **失效链接扫描** | 带实时进度条和取消支持，检查每个书签是否失效；批量删除死链 |
| **智能重组** | AI 提出具体操作 — 移动、合并、重命名、创建、删除 — 每项一键应用；包含完整操作历史 |
| **空文件夹清理** | 检测并一键删除空文件夹 |

**支持的 AI 提供商：**
- **OpenAI** — GPT-4o、GPT-4o Mini、GPT-4.1 Mini
- **Google Gemini** — Gemini 2.0 Flash、Gemini 2.5 Pro
- **Anthropic Claude** — Claude Sonnet 4、Claude Haiku

自定义指令让你引导 AI 的分析方向 — 例如 *"按项目分组，而非按技术"* 或 *"重点关注开发和设计类书签"*。

### 域名视图

清晰查看你的书签分布在网络中的哪些地方。

| 功能 | 说明 |
|---|---|
| **域名树状图** | 可视化磁贴网格 — 书签越多的域名磁贴越大 |
| **域名统计** | 每个域名的书签数量及占总量的百分比 |
| **域名浏览器** | 点击任意磁贴，打开该域名书签的完整筛选视图 |
| **列表模式** | 切换到带百分比条的排名列表 |
| **网站图标展示** | 全程显示域名图标；优雅回退到域名首字母 |

### 阅读列表

内置于新标签页的无干扰阅读空间。

| 功能 | 说明 |
|---|---|
| **快速添加** | 粘贴任意 URL 或直接从书签添加；内容自动抓取并缓存 |
| **内置阅读器** | 提取的可读文章视图 — 无广告、无干扰（由 Mozilla Readability 驱动） |
| **状态追踪** | 标记文章为已读（归档）或未读；打开时自动选中第一篇未读文章 |
| **归档与恢复** | 读完后归档；取消归档可重读；读完后删除 |
| **持久存储** | 阅读列表在浏览器重启和扩展更新后依然保留 |

### 界面与个性化

顶部栏分为三个清晰区域：**品牌**（Logo + 名称 + 版本）· **导航**（视图）· **工具**（视图切换、主题、快捷键、设置、添加）。每个图标按钮悬停时即时显示提示。

| 选项 | 可选项 |
|---|---|
| **主题** | 深色 · 浅色 · 跟随系统（跟随操作系统偏好，自动切换） |
| **背景** | 5 张预设图片（山脉、海洋、森林、城市、夜景）· 自定义图片 URL · 无背景 |
| **显示模式** | 网格（默认）· 列表 · 紧凑 — 按 `V` 切换 |
| **导航栏** | 完整（图标 + 标签）· 紧凑（仅图标） |
| **文件夹侧边栏** | 固定（始终可见）· 浮动（悬停或点击拉条展开） |
| **置顶书签** | 顶部区域 · 专属右侧栏 |
| **语言** | English · 简体中文 · 日本語 |

### 顶部英雄区

每次打开新标签页都有个人化体验：

- **时段感知问候** — 早上好 / 下午好 / 晚上好 / 深夜好，附带你的显示名称
- **实时时钟** — 实时时钟和日期始终可见
- **统一搜索** — 一个搜索框，全部书签 — 带实时结果数量和清除按钮

### Google 应用启动器

按一下 `G` 打开可自定义的 Google 应用菜单。从完整套件中选择显示哪些服务：Gmail、日历、云端硬盘、文档、表格、幻灯片、Meet、Keep、NotebookLM、YouTube、Gemini、AI Studio 等。

### 保存弹窗

在任意页面点击扩展图标即可立即保存：

- 自动填充 URL 和页面标题
- 显示 AI 建议标签（如已启用）
- 完整标签编辑器 — 应用建议、添加自定义标签、删除任意标签
- 无需离开当前页面即可保存书签

---

## 键盘快捷键

| 按键 | 操作 |
|---|---|
| `⌘K` / `Ctrl+K` | 聚焦搜索框 |
| `N` | 添加新书签 |
| `?` | 显示所有键盘快捷键 |
| `S` | 设置 |
| `T` | 循环切换主题（深色 → 浅色 → 跟随系统） |
| `V` | 切换显示模式（网格 ↔ 列表 ↔ 紧凑） |
| `D` | 域名视图 |
| `R` | 最近添加 |
| `A` | AI 洞察 |
| `L` | 阅读列表 |
| `G` | Google 应用菜单 |
| `Shift+G` | 打开 Google.com |
| `Esc` | 关闭 / 返回 / 清除搜索 |

在 `chrome://extensions/shortcuts` 配置 AI 标记当前页面的扩展快捷键。

---

## 快速上手

### 从 Chrome 网上应用店安装

<a href="https://chromewebstore.google.com/detail/bookmark-dashboard/imknfkidkilkomeomcidnnjojiilaofb">
  <img src="https://raw.githubusercontent.com/encoreshao/bookmark-dashboard/master/src/icons/icon128.png" width="100" alt="在 Chrome 网上应用店中获取" />
</a>

### 从源码安装（开发者模式）

```bash
git clone https://github.com/encoreshao/bookmark-dashboard.git
cd bookmark-dashboard
npm install
npm run build
```

然后在 Chrome 中加载：

1. 打开 `chrome://extensions`
2. 启用**开发者模式**
3. 点击**加载已解压的扩展程序** → 选择 `dist/` 文件夹
4. 打开新标签页

### 开发

```bash
npm run dev      # 监听模式 — Vite 在每次更改时重新构建 dist/
npm run build    # 生产构建
npm test         # 运行 Vitest 测试套件
```

在监听模式下修改源码后，在 `chrome://extensions` 中点击 **↺ 更新** 以重新加载扩展。

---

## 设置说明

按 `S` 或点击齿轮图标打开设置。

| 标签页 | 内容 |
|---|---|
| **通用** | 显示名称 · 语言 · 显示模式 · 导航样式 · 文件夹侧边栏模式 · 置顶书签位置 |
| **个性化** | 主题 · 背景图片 |
| **AI 与应用** | AI 提供商 · 模型 · API 密钥（本地存储，永不共享）· 自定义指令 · 保存时自动打标签 · Google 应用可见性 |
| **账户** | Google 账户集成（同步 — 即将推出） |

---

## 技术栈

| 层级 | 技术 |
|---|---|
| **UI** | React 18 · TypeScript 5 |
| **构建** | Vite 5 |
| **扩展** | Chrome Manifest V3 |
| **存储** | `chrome.storage.local` — 仅本地，永不同步 |
| **书签** | `chrome.bookmarks` API |
| **AI** | OpenAI · Google Gemini · Anthropic Claude |
| **文章解析** | Mozilla Readability 0.6 |
| **内容净化** | DOMPurify 3 |
| **测试** | Vitest · jsdom |
| **样式** | CSS 自定义属性 — 无框架 |
| **国际化** | 自定义轻量翻译器（EN / ZH / JA） |

---

## 项目结构

```
src/
├── components/     # 24 个 React UI 组件
│   ├── Topbar.tsx              # 三区域顶部栏：品牌 | 导航 | 工具
│   ├── FolderSidebar.tsx       # 文件夹树 + 标签浏览器，带拉条触发器
│   ├── SearchSection.tsx       # 搜索框，含清除按钮和结果数量
│   ├── BookmarkView.tsx        # 主书签网格 / 列表 / 紧凑视图
│   ├── AIInsightsView.tsx      # AI 分析中心
│   ├── DomainView.tsx          # 域名树状图可视化
│   ├── ReadingListView.tsx     # 阅读列表 + 内置文章阅读器
│   ├── SettingsPanel.tsx       # 四标签页设置
│   ├── KeyboardShortcuts.tsx   # 快捷键模态框
│   ├── Footer.tsx              # 底部栏，含作者和项目链接
│   └── …
├── context/        # React Context 提供者（设置、书签、UI、标签、阅读列表）
├── types/          # 共享 TypeScript 接口
├── utils/          # AI、书签、国际化、标签、时间、Google 应用工具函数
├── styles/         # CSS（主仪表板、标签、阅读列表、保存弹窗）
├── popup/          # 保存书签弹窗（点击扩展图标触发）
├── options/        # 独立扩展选项页
├── js/             # Service Worker、选项逻辑
├── icons/          # 扩展图标（16 / 48 / 128 像素）
├── index.html      # Vite 入口 — 新标签页
├── main.tsx        # React 入口点
├── App.tsx         # 根组件 + 全局键盘快捷键
└── manifest.json   # Chrome 扩展清单（V3）
```

---

## 发布流程

### 1. 更新版本号

同时更新 `src/manifest.json` 和 `package.json` 中的 `"version"` 字段。

### 2. 构建与打包

```bash
./scripts/release.sh
```

执行构建，将 `dist/` 打包为 `releases/bookmark-dashboard-v{version}.zip`，可选择打包 PEM 密钥以保持扩展 ID 一致。

```bash
./scripts/release.sh 2.1.0      # 覆盖版本号
./scripts/release.sh --no-key   # 跳过 PEM 打包
```

### 3. 发布

将 zip 文件上传到 [Chrome 网上应用店开发者控制台](https://chrome.google.com/webstore/developer/dashboard)。

> **PEM 密钥** — 存储在 `config/credentials/key.pem`（已加入 .gitignore）。这样可以在更新之间保持扩展 ID 稳定。

---

## 贡献

欢迎贡献。请先开 Issue 讨论你想做的改动。

1. Fork 仓库
2. 创建功能分支（`git checkout -b feature/amazing-thing`）
3. 提交你的改动
4. Push 并发起 Pull Request

---

## 作者

**Encore Shao** — [github.com/encoreshao](https://github.com/encoreshao) · [bookmark.linktr.cn](https://bookmark.linktr.cn)

## 许可证

[MIT](LICENSE)
