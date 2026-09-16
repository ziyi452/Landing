// DELETE /api/treehole/posts/[id]  —  删除一条树洞

import { callBitableApi, TABLES, sendJson } from '../../_lib/feishu.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'DELETE') {
      sendJson(res, 405, { success: false, message: '仅支持 DELETE 方法' });
      return;
    }

    const { id } = req.query;
    if (!id) {
      sendJson(res, 400, { success: false, message: '缺少记录ID' });
      return;
    }

    await callBitableApi('DELETE', `tables/${TABLES.posts}/records/${id}`);
    sendJson(res, 200, { success: true });
  } catch (e) {
    console.error('[treehole/posts/[id]] 错误:', e.message);
    sendJson(res, 500, { success: false, message: e.message || '服务器错误' });
  }
}
