// 飞书 API 工具：token 缓存 + bitable 调用
// Vercel Serverless 环境下，内存缓存仅在单实例单次冷启动周期内有效

const FEISHU_BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || 'ZDiWbVs9paV8i9spdDfc95AHn0e';
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || '';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || '';
const FEISHU_OPEN_API_HOST = process.env.FEISHU_OPEN_API_HOST || 'https://open.feishu.cn';

let cachedToken = null;
let cachedTokenExpireAt = 0;

export async function getTenantAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedTokenExpireAt - now > 5 * 60 * 1000) {
    return cachedToken;
  }

  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    throw new Error('飞书应用凭证未配置（FEISHU_APP_ID / FEISHU_APP_SECRET 环境变量缺失）');
  }

  const res = await fetch(
    `${FEISHU_OPEN_API_HOST}/open-apis/auth/v3/tenant_access_token/internal`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: FEISHU_APP_ID,
        app_secret: FEISHU_APP_SECRET,
      }),
    }
  );

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`获取 tenant_access_token 失败: code=${data.code}, msg=${data.msg}`);
  }

  cachedToken = data.tenant_access_token;
  cachedTokenExpireAt = now + data.expire * 1000;
  return cachedToken;
}

export async function callBitableApi(method, pathSuffix, body) {
  const token = await getTenantAccessToken();
  const url = `${FEISHU_OPEN_API_HOST}/open-apis/bitable/v1/apps/${FEISHU_BASE_TOKEN}/${pathSuffix}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`bitable API 失败 [${method} ${pathSuffix}]: code=${data.code}, msg=${data.msg || '未知错误'}`);
  }
  return data.data;
}

export const TABLES = {
  posts: process.env.TREEHOLE_TABLE_ID || 'tblehAIqPGsBSXHp',
  comments: process.env.TREEHOLE_COMMENT_TABLE_ID || 'tblxpXKuSC1tSotF',
  reactions: process.env.TREEHOLE_REACTION_TABLE_ID || 'tblxh1We5wdOkGCJ',
};

export const REACTION_FIELD_MAP = {
  like:     { field: '点赞数',   label: '点赞' },
  hug:      { field: '抱抱数',   label: '抱抱' },
  same:     { field: '同感数',   label: '同感' },
  inspired: { field: '启发数',   label: '启发' },
};

export function sendJson(res, statusCode, data) {
  res.status(statusCode).json(data);
}
