# 溯光 Agent V2

这是 healwealthy.com / 溯光商业网站的新版本原型。旧的 talent-assessment 项目可作为 V1 备份；本项目把页面、业务配置、知识库、Agent 规则和交互逻辑拆开，方便后续迁移到 React、Next.js 或真实后端。

## 项目结构

```text
healwealthy-agent-v2/
  index.html
  package.json
  soulight-knowledge.md
  training/
    source-documents/
    extracted/
    cases/
    methodology/
  assets/
    logo-new.jpg
    logo-transparent.png
  functions/
    api/chat.js
  src/
    config/brand.js
    data/methodology.js
    data/knowledge.js
    data/roles.js
    data/examples.js
    data/sales.js
    data/sales-cases.js
    lib/agent-engine.js
    ui/app.js
    ui/styles.css
```

## 本地预览

如果只想看静态页面，可以直接打开 `index.html`。

如果要让 Agent 真正调用大模型，必须启动带 `/api/chat` 的本地服务：

```bash
node scripts/dev-server.js
```

然后访问 http://localhost:5174。

本地服务会读取项目根目录的 `.env`。可以参考 `.env.example` 配置：

```bash
OPENAI_API_KEY=你的 OpenAI Key
ANTHROPIC_API_KEY=你的 Claude Key
GEMINI_API_KEY=你的 Gemini Key
VOLCENGINE_API_KEY=你的火山引擎 HiPaaS / 方舟 Coding Plan Key
DEEPSEEK_API_KEY=你的 DeepSeek Key
ZHIPU_API_KEY=你的智谱 Key
DASHSCOPE_API_KEY=你的阿里云百炼 Key
MOONSHOT_API_KEY=你的 Moonshot/Kimi Key
```

普通静态服务，例如 `python3 -m http.server`，不会执行 `functions/api/chat.js`，因此对话会回退到本地规则 Agent。

## 本地构建

执行 npm run build 会生成 dist/ 目录，里面包含当前静态页面、资源、前端源码和 Cloudflare Pages Function。

构建后可以执行 npm run preview，并访问 http://localhost:4174 查看 dist/ 产物。

## 当前能力

- 商业测评首页
- 溯光 Agent 对话
- 三角色模式：客服、售前咨询、心理咨询师
- 售前 MVP：12 步顾问成交法、服务推荐、价格答疑、异议处理
- 服务匹配
- 预约留资
- 真实大模型代理：`/api/chat` 支持 OpenAI / Claude / Gemini
- BYOK：用户可在浏览器本地保存自己的 API Key
- 产品用量控制：按 199 / 599 / 1299 / 1999 / 29800 档位限制每日远程消息、估算 token 和单次输入长度
- 预约跟进闭环：本地线索保存、跟进动作生成、最近线索看板、JSON 导出
- 医疗、心理危机、投资承诺类安全边界

## Agent 开发说明

三角色架构和知识库维护方式见 `AGENT_ARCHITECTURE.md`。

## 训练资料

`training/` 用来保存训练和校准 Agent 的资料，不是线上运行时直接加载的数据：

- `training/source-documents/`：原始 Word 训练文档
- `training/extracted/`：从 Word 提取出的 Markdown
- `training/cases/`：模拟对话沉淀出的训练案例
- `training/methodology/`：方法论训练说明

Agent 运行时使用的结构化数据在 `src/data/`。

## 和 V1 的对应关系

V1 备份项目在 `../talent-assessment-v1-backup`，当前 V2 沿用了它的静态站 + Cloudflare Pages Functions 思路：

- `index.html`：新版本主站和 Agent 页面
- `functions/api/chat.js`：兼容 Cloudflare Pages 的 `/api/chat` 代理
- `soulight-knowledge.md`：从 V1 迁入的溯光知识库备份
- `assets/logo-new.jpg`、`assets/logo-transparent.png`：从 V1 迁入的品牌图像

当前页面会先用本地规则 Agent 生成画像和草稿，再尝试调用 `/api/chat` 生成更自然的回复；如果 API 未配置或调用失败，会回退到本地规则回复。

## 大模型配置

Cloudflare Pages Functions 通过 `functions/api/chat.js` 提供统一代理。

官方额度模式需要在部署环境配置以下变量之一：

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `VOLCENGINE_API_KEY`
- `DEEPSEEK_API_KEY`
- `ZHIPU_API_KEY`
- `DASHSCOPE_API_KEY`
- `MOONSHOT_API_KEY`

自带 Key 模式下，用户的 Key 保存在当前浏览器，并在对话请求时临时发送给 `/api/chat`。当前代码不会把用户 Key 写入服务端存储。

### 服务商和模型默认选项

页面里的“模型服务商 / 模型”按两层展示：

| 服务商 | 默认模型 | 说明 |
| --- | --- | --- |
| OpenAI ChatGPT | `gpt-4.1-mini` | OpenAI Responses API |
| Claude | `claude-3-5-sonnet-latest` | Anthropic Messages API |
| Google Gemini | `gemini-1.5-pro` | Gemini generateContent API |
| 火山引擎 HiPaaS / 方舟 Coding Plan | `ark-code-latest` | OpenAI-compatible `/chat/completions`，Base URL: `https://ark.cn-beijing.volces.com/api/coding/v3` |
| DeepSeek 官方 API | `deepseek-chat` | OpenAI-compatible `/chat/completions` |
| 智谱 GLM / 智谱清言 | `glm-4.5` | OpenAI-compatible `/chat/completions` |
| 阿里云百炼 / 通义千问 | `qwen-plus` | DashScope OpenAI 兼容模式 |
| Moonshot Kimi | `moonshot-v1-8k` | OpenAI-compatible `/chat/completions` |

如果你要使用火山引擎 Coding Plan，页面里应这样选择：

- 模型服务商：`火山引擎 HiPaaS / 方舟 Coding Plan`
- 模型：优先选 `ark-code-latest`；如果控制台已开通对应模型，也可以选 `deepseek-v3.2`、`glm-4.7`、`kimi-k2.5` 或 `doubao-seed-2.0-code`
- API Key：填写火山引擎 HiPaaS / 方舟 Coding Plan 的 Key

本地直接打开 `index.html` 时不会调用远程 API，只使用本地规则 Agent。要测试 `/api/chat`，请使用 `node scripts/dev-server.js`，或部署到支持 Cloudflare Pages Functions 的线上环境。

## 用量控制

产品额度配置在 `src/config/usage.js`，服务端兜底配置在 `functions/api/chat.js`。

当前 MVP 支持两层限制：

- 浏览器本地限制：记录当天每个产品档位的远程消息数和估算 token，用完后回退本地规则 Agent。
- 服务端限制：如果 Cloudflare 绑定了 `SUGUANG_USAGE_KV`，`/api/chat` 会按 `userId + plan + date` 记录每日用量并返回剩余额度。

没有 KV 时，服务端会参考前端传来的本地用量做 MVP 级拦截；正式收费上线建议接账号、支付订单和服务端 entitlement。

## 预约跟进

预约表单会把线索保存到浏览器本地 `suguang-agent-leads`，并生成跟进建议。页面右侧显示最近 5 条线索，可复制 JSON 给表格或 CRM。
