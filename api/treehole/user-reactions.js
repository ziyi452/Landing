// GET /api/treehole/user-reactions?userId=xxx  —  获取指定用户对所有树洞的互动记录

import { callBitableApi, TABLES, REACTION_FIELD_MAP, sendJson } from '../_lib/feishu.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      sendJson(res, 405, { success: false, message: '仅支持 GET 方法' });
      return;
    }

    const { userId } = req.query;
    if (!userId) {
      sendJson(res, 400, { success: false, message: '缺少 userId 参数' });
      return;
    }

    const data = await callBitableApi(
      'GET',
      `tables/${TABLES.reactions}/records?page_size=200`
    );

    // 反转 label -> key
    const labelToKey = {};
    Object.entries(REACTION_FIELD_MAP).forEach(([key, val]) => {
      labelToKey[val.label] = key;
    });

    const reactions = {};
    (data.items || [])
      .filter((r) => r.fields['用户ID'] === userId)
      .forEach((r) => {
        const postId = r.fields['树洞ID'];
        const typeVal = Array.isArray(r.fields['互动类型'])
          ? r.fields['互动类型'][0]
          : r.fields['互动类型'];
        const reactionType = labelToKey[typeVal] || typeVal;
        if (!reactions[postId]) reactions[postId] = {};
        reactions[postId][reactionType] = r.record_id;
      });

    sendJson(res, 200, { success: true, reactions });
  } catch (e) {
    console.error('[treehole/user-reactions] 错误:', e.message);
    sendJson(res, 500, { success: false, message: e.message || '服务器错误' });
  }
}
