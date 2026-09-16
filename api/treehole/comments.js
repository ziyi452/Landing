// GET /api/treehole/comments  读取评论
// POST /api/treehole/comments  发表评论
import { callBitableApi, TABLES, sendJson } from '../_lib/feishu.js';
import { parseBody } from '../_lib/body-parser.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await handleGet(req, res);
    if (req.method === 'POST') return await handlePost(req, res);
    sendJson(res, 405, { success: false, message: '仅支持 GET / POST 方法' });
  } catch (e) {
    console.error('[treehole/comments] 错误:', e.message);
    sendJson(res, 500, { success: false, message: e.message || '服务器错误' });
  }
}

async function handleGet(req, res) {
  const { postId, userId, postAuthorId } = req.query;
  if (!postId) { sendJson(res, 400, { success: false, message: '缺少 postId 参数' }); return; }
  const data = await callBitableApi('GET', `tables/${TABLES.comments}/records?page_size=200`);
  const currentUserId = userId || '';
  const authorId = postAuthorId || '';
  const comments = (data.items || [])
    .filter((r) => r.fields['树洞ID'] === postId)
    .map((r) => ({
      id: r.record_id, content: r.fields['评论内容'] || '',
      author: r.fields['评论者'] || '匿名用户', authorId: r.fields['评论者ID'] || '',
      commentType: Array.isArray(r.fields['评论类型']) ? r.fields['评论类型'][0] : (r.fields['评论类型'] || '公开'),
      timestamp: r.fields['评论时间'] || Date.now(),
    }))
    .filter((c) => c.commentType === '公开' || authorId === currentUserId || c.authorId === currentUserId)
    .sort((a, b) => a.timestamp - b.timestamp);
  sendJson(res, 200, { success: true, comments });
}

async function handlePost(req, res) {
  const body = await parseBody(req);
  const { postId, userId, userName, content, commentType } = body;
  if (!postId || !content) { sendJson(res, 400, { success: false, message: '缺少必要参数' }); return; }
  const now = Date.now();
  await callBitableApi('POST', `tables/${TABLES.comments}/records`, {
    fields: { '树洞ID': postId, '评论内容': content, '评论者': userName || '匿名用户',
      '评论者ID': userId || 'anonymous', '评论时间': now, '评论类型': commentType || '公开' },
  });
  const postData = await callBitableApi('GET', `tables/${TABLES.posts}/records/${postId}`);
  const currentCount = Number(postData.record?.fields?.['评论数']) || 0;
  await callBitableApi('PUT', `tables/${TABLES.posts}/records/${postId}`, {
    fields: { '评论数': currentCount + 1 },
  });
  sendJson(res, 200, { success: true });
}
