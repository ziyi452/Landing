// POST /api/treehole/react  —  切换互动（点赞/抱抱/同感/启发）
// 请求体：{ postId, userId, reactionType, action: 'add' | 'remove' }

import { callBitableApi, TABLES, REACTION_FIELD_MAP, sendJson } from '../_lib/feishu.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { success: false, message: '仅支持 POST 方法' });
      return;
    }

    const { postId, userId, reactionType, action } = req.body || {};
    if (!postId || !userId || !reactionType) {
      sendJson(res, 400, { success: false, message: '缺少必要参数（postId / userId / reactionType）' });
      return;
    }

    const mapping = REACTION_FIELD_MAP[reactionType];
    if (!mapping) {
      sendJson(res, 400, { success: false, message: '无效的互动类型' });
      return;
    }

    if (action === 'remove') {
      // 1. 找到用户的互动记录并删除
      const reactionData = await callBitableApi(
        'GET',
        `tables/${TABLES.reactions}/records?page_size=200`
      );
      const record = (reactionData.items || []).find(
        (r) =>
          r.fields['树洞ID'] === postId &&
          r.fields['用户ID'] === userId &&
          (r.fields['互动类型'] === mapping.label ||
            (Array.isArray(r.fields['互动类型']) && r.fields['互动类型'][0] === mapping.label))
      );
      if (record) {
        await callBitableApi('DELETE', `tables/${TABLES.reactions}/records/${record.record_id}`);
      }
      // 2. 帖子对应字段 -1
      const postData = await callBitableApi('GET', `tables/${TABLES.posts}/records/${postId}`);
      const currentValue = postData.record?.fields?.[mapping.field] || 0;
      await callBitableApi('PUT', `tables/${TABLES.posts}/records/${postId}`, {
        fields: { [mapping.field]: Math.max(0, currentValue - 1) },
      });
      sendJson(res, 200, { success: true, action: 'removed' });
    } else {
      // add
      // 1. 添加互动记录
      const now = new Date().toISOString();
      await callBitableApi('POST', `tables/${TABLES.reactions}/records`, {
        fields: {
          '树洞ID': postId,
          '用户ID': userId,
          '互动类型': mapping.label,
          '互动时间': now,
        },
      });
      // 2. 帖子对应字段 +1
      const postData = await callBitableApi('GET', `tables/${TABLES.posts}/records/${postId}`);
      const currentValue = postData.record?.fields?.[mapping.field] || 0;
      await callBitableApi('PUT', `tables/${TABLES.posts}/records/${postId}`, {
        fields: { [mapping.field]: currentValue + 1 },
      });
      sendJson(res, 200, { success: true, action: 'added' });
    }
  } catch (e) {
    console.error('[treehole/react] 错误:', e.message);
    sendJson(res, 500, { success: false, message: e.message || '服务器错误' });
  }
}
