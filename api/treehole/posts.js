// GET /api/treehole/posts  —  读取所有树洞（不按用户过滤，所有人可见）
// POST /api/treehole/posts —  发布一条树洞

import { callBitableApi, TABLES, sendJson } from '../_lib/feishu.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return await handleGet(req, res);
    }
    if (req.method === 'POST') {
      return await handlePost(req, res);
    }
    sendJson(res, 405, { success: false, message: '仅支持 GET / POST 方法' });
  } catch (e) {
    console.error('[treehole/posts] 错误:', e.message);
    sendJson(res, 500, { success: false, message: e.message || '服务器错误' });
  }
}

async function handleGet(req, res) {
  const data = await callBitableApi(
    'GET',
    `tables/${TABLES.posts}/records?page_size=100&sort=[{"field_name":"发布时间","desc":true}]`
  );
  const records = data.items || [];
  const posts = records.map((r) => ({
    id: r.record_id,
    content: r.fields['内容'] || '',
    mood: r.fields['心情'] || '😊',
    author: r.fields['发布者'] || '匿名用户',
    authorId: r.fields['发布者ID'] || '',
    timestamp: new Date(r.fields['发布时间'] || Date.now()).getTime(),
    date: new Date(r.fields['发布时间'] || Date.now()).toLocaleDateString('zh-CN'),
    like: r.fields['点赞数'] || 0,
    hug: r.fields['抱抱数'] || 0,
    same: r.fields['同感数'] || 0,
    inspired: r.fields['启发数'] || 0,
    commentCount: r.fields['评论数'] || 0,
  }));
  sendJson(res, 200, { success: true, posts });
}

async function handlePost(req, res) {
  const { content, mood, userId, userName } = req.body || {};
  if (!content) {
    sendJson(res, 400, { success: false, message: '缺少 content 参数' });
    return;
  }

  const now = new Date().toISOString();
  const fields = {
    '内容': content,
    '心情': mood || '😊',
    '发布者': userName || '匿名用户',
    '发布者ID': userId || 'anonymous',
    '发布时间': now,
    '点赞数': 0,
    '抱抱数': 0,
    '同感数': 0,
    '启发数': 0,
    '评论数': 0,
  };

  const data = await callBitableApi('POST', `tables/${TABLES.posts}/records`, { fields });
  sendJson(res, 200, { success: true, id: data.record?.record_id });
}
