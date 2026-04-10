# 真我天赋探索测评

> 探索内在 · 构建自己 · 创造财富 · 收获幸福

## 项目简介

这是一个基于心理学研究的天赋测评工具，帮助用户发现自己的核心优势，并提供职业发展、财富创造和幸福感提升的建议。

## 快速部署

### 方案一：Vercel 部署（推荐）

1. Fork 或上传这个项目到 GitHub
2. 访问 [vercel.com](https://vercel.com) 用 GitHub 账号登录
3. 点击 "New Project"，选择这个仓库
4. 点击 "Deploy"，等待部署完成
5. 在项目设置中绑定你的自定义域名

### 方案二：GitHub Pages

1. 上传项目到 GitHub
2. 进入仓库 Settings → Pages
3. Source 选择 "main" 分支，文件夹选择 "/"
4. 点击 Save，等待部署完成
5. 访问 `https://你的用户名.github.io/仓库名`

### 方案三：本地服务器

```bash
# Python 3
python3 -m http.server 8080

# Node.js (http-server)
npx http-server -p 8080

# 然后访问 http://localhost:8080
```

## 项目结构

```
talent-assessment/
├── index.html      # 主页面
└── README.md       # 说明文档
```

## 功能特点

- ✨ 6大核心维度测评
- 📊 36道专业题目
- 🎯 个性化结果解析
- 💎 天赋变现建议
- 📱 响应式设计

## 自定义域名配置

### 使用 Cloudflare（推荐）

1. 在 [cloudflare.com](https://cloudflare.com) 注册账号
2. 添加你的域名，按照提示修改 DNS
3. 在 DNS 记录中添加 CNAME 指向 Vercel/GitHub Pages
4. 开启 HTTPS 和 CDN

### 使用 Namecheap / GoDaddy 等

1. 购买域名
2. 在 DNS 管理中添加 CNAME 或 A 记录
3. 等待 DNS 生效（通常需要几小时）

## 技术栈

- 纯 HTML/CSS/JavaScript
- 无需后端
- 完全静态网站

## 版权说明

本项目为 "真我蜕变 主导人生" 品牌定制开发。
