# 树洞后端 - Vercel 部署包

## 功能说明

基于飞书多维表格的树洞后端服务，部署到 Vercel Serverless Functions。

所有用户共享同一张多维表格，**所有人都能看到所有人发的树洞**。

## API 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/treehole/posts` | 读取所有树洞（按发布时间倒序） |
| POST | `/api/treehole/posts` | 发布一条树洞 |
| DELETE | `/api/treehole/posts/:id` | 删除一条树洞 |
| POST | `/api/treehole/react` | 切换互动（点赞/抱抱/同感/启发） |
| GET | `/api/treehole/comments` | 读取树洞评论（支持悄悄话过滤） |
| POST | `/api/treehole/comments` | 发表评论 |
| GET | `/api/treehole/user-reactions` | 获取当前用户的所有互动记录 |
| POST | `/api/submit-landing` | 提交入职进度到飞书多维表格表单 |

## 部署步骤

### 1. 准备飞书应用

1. 打开 [飞书开放平台](https://open.feishu.cn/app)，创建一个**自建应用**
2. 在「权限管理」中开通以下权限：
   - `bitable:app` — 查看、评论、编辑多维表格
3. 在「凭证与基础信息」中获取 `App ID` 和 `App Secret`
4. 把多维表格分享给这个应用（或设置应用为多维表格管理员）

### 2. 部署到 Vercel

#### 方式一：通过 Vercel 网站导入（推荐）

1. 把整个 `vercel-deploy` 目录上传到 GitHub
2. 打开 [Vercel Dashboard](https://vercel.com/new)
3. 选择你的 GitHub 仓库，点击「Import」
4. Framework Preset 选 **Other**
5. 在「Environment Variables」中添加环境变量（见下面列表）
6. 点击「Deploy」，等待部署完成

#### 方式二：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 进入部署目录
cd vercel-deploy

# 首次部署
vercel

# 设置环境变量
vercel env add FEISHU_APP_ID
vercel env add FEISHU_APP_SECRET
# ... 其他环境变量

# 生产部署
vercel --prod
```

### 3. 环境变量配置

在 Vercel 项目的 **Settings → Environment Variables** 中添加：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `FEISHU_APP_ID` | ✅ | 飞书应用 App ID |
| `FEISHU_APP_SECRET` | ✅ | 飞书应用 App Secret |
| `FEISHU_BASE_TOKEN` | ✅ | 多维表格 base_token（默认已填） |
| `TREEHOLE_TABLE_ID` | ✅ | 树洞表 table_id（默认已填） |
| `TREEHOLE_COMMENT_TABLE_ID` | ✅ | 评论表 table_id（默认已填） |
| `TREEHOLE_REACTION_TABLE_ID` | ✅ | 互动记录表 table_id（默认已填） |
| `FEISHU_SHARE_TOKEN` | - | 入职进度表单 share_token |
| `FEISHU_OPEN_API_HOST` | - | 飞书 API 域名（默认 https://open.feishu.cn） |

### 4. 前端配置

部署成功后，会得到一个 Vercel 域名，比如 `https://treehole-backend.vercel.app`。

把前端 `src/index.html` 中的 `TREEHOLE_API_BASE` 改成你的 Vercel 地址：

```js
const TREEHOLE_API_BASE = 'https://your-project.vercel.app/api/treehole';
```

## 验证部署

部署完成后，用 curl 测试一下：

```bash
# 读取树洞列表
curl https://your-project.vercel.app/api/treehole/posts

# 发布一条树洞
curl -X POST https://your-project.vercel.app/api/treehole/posts \
  -H "Content-Type: application/json" \
  -d '{"content":"测试树洞内容","mood":"😊","userId":"test_user","userName":"测试用户"}'
```

如果返回 `{"success": true, ...}` 就说明部署成功了。

## 注意事项

1. **CORS**：默认允许所有来源（`Access-Control-Allow-Origin: *`），生产环境建议改成你的前端域名
2. **Token 缓存**：Vercel Serverless 是无状态的，每次冷启动都会重新获取 token，属于正常现象
3. **分页**：当前只读取前 100 条树洞，树洞数量超过 100 条后需要加分页逻辑
4. **权限**：确保飞书应用有对应多维表格的读写权限，否则接口会报错
5. **成本**：Vercel Hobby 版免费额度（每月 10 万次 Serverless 调用）对树洞场景完全够用
