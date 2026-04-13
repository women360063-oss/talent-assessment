# 天赋测评网页 - 部署指南

## 🌐 Cloudflare Pages 部署（推荐！最简单！

### 方法一：直接上传（最快）

1. 访问 https://pages.cloudflare.com
2. 登录你的 Cloudflare 账号（women360063@gmail.com）
3. 点击 "Create a project"
4. 选择 "Upload assets"
5. 项目名称：talent-assessment
6. 上传 index.html 文件
7. 点击 "Deploy site"
8. 部署成功后在项目设置 → Custom domains → 添加 healwealthy.com

### 方法二：GitHub 自动部署

1. 把 talent-assessment 文件夹推送到 GitHub
2. 在 Cloudflare Pages 中连接 GitHub 仓库
3. 自动部署！

---

## 🐧 腾讯云服务器部署（如果你想用服务器）

### 如果你想用腾讯云服务器：

```bash
# 1. 登录腾讯云服务器
ssh root@82.156.191.219

# 2. 检查 Nginx
systemctl status nginx

# 3. 如果没有 Nginx，安装
apt-get update
apt-get install -y nginx

# 4. 上传 index.html 到 /var/www/html/

# 5. 配置域名和HTTPS

```

---

## 📱 访问测试

部署成功后访问：
- Cloudflare Pages: https://talent-assessment.pages.dev
- 你的域名: https://healwealthy.com
