// GET /api/user/list  —  获取所有用户列表
import { callBitableApi, sendJson } from '../_lib/feishu.js';

const USER_PROGRESS_TABLE_ID = process.env.USER_PROGRESS_TABLE_ID || '';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      sendJson(res, 405, { success: false, message: '仅支持 GET 方法' });
      return;
    }
    if (!USER_PROGRESS_TABLE_ID) {
      sendJson(res, 500, { success: false, message: '用户进度表未配置' });
      return;
    }

    const data = await callBitableApi('GET', `tables/${USER_PROGRESS_TABLE_ID}/records?page_size=100`);
    const users = (data.items || []).map((r) => ({
      userId: r.fields['用户ID'],
      name: r.fields['姓名'],
      joinDate: r.fields['入职日期'],
      currentStage: r.fields['当前阶段'] || 1,
      completedCount: r.fields['已完成任务数'] || 0,
      points: r.fields['积分'] || 0,
      streakDays: r.fields['连续打卡天数'] || 0,
      lastUpdate: r.fields['最后更新时间'],
    }));

    // 按积分排序
    users.sort((a, b) => (b.points || 0) - (a.points || 0));

    sendJson(res, 200, { success: true, users, total: users.length });
  } catch (e) {
    console.error('[user/list] 错误:', e.message);
    sendJson(res, 500, { success: false, message: e.message || '服务器错误' });
  }
}
