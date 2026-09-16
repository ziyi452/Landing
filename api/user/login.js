// POST /api/user/login  —  登录/注册用户
import { callBitableApi, sendJson } from '../_lib/feishu.js';

const USER_PROGRESS_TABLE_ID = process.env.USER_PROGRESS_TABLE_ID || '';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { success: false, message: '仅支持 POST 方法' });
      return;
    }
    if (!USER_PROGRESS_TABLE_ID) {
      sendJson(res, 500, { success: false, message: '用户进度表未配置' });
      return;
    }
    const { name, joinDate } = req.body || {};
    if (!name || !joinDate) {
      sendJson(res, 400, { success: false, message: '缺少 name 或 joinDate 参数' });
      return;
    }
    const userId = `user_${Buffer.from(`${name}_${joinDate}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}`;
    const existingData = await callBitableApi('GET', `tables/${USER_PROGRESS_TABLE_ID}/records?page_size=100`);
    const existingUser = (existingData.items || []).find((r) => r.fields['用户ID'] === userId);
    if (existingUser) {
      sendJson(res, 200, { success: true, userId, name, joinDate, isNewUser: false, message: `欢迎回来，${name}！` });
    } else {
      const now = Date.now();
      const joinDateTs = new Date(joinDate).getTime();
      const fields = {
        '用户ID': userId, '姓名': name, '入职日期': joinDateTs,
        '当前阶段': 1, '已完成任务数': 0, '任务进度': '{}',
        '花园数据': '{}', '心情记录': '[]', '日记数据': '[]',
        '积分': 0, '连续打卡天数': 0, '最后更新时间': now,
      };
      await callBitableApi('POST', `tables/${USER_PROGRESS_TABLE_ID}/records`, { fields });
      sendJson(res, 200, { success: true, userId, name, joinDate, isNewUser: true, message: `欢迎加入，${name}！` });
    }
  } catch (e) {
    console.error('[user/login] 错误:', e.message);
    sendJson(res, 500, { success: false, message: e.message || '服务器错误' });
  }
}
