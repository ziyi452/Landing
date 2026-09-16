// GET /api/user/progress?userId=xxx  获取用户进度
// POST /api/user/progress  保存用户进度
import { callBitableApi, sendJson } from '../_lib/feishu.js';

const USER_PROGRESS_TABLE_ID = process.env.USER_PROGRESS_TABLE_ID || '';

export default async function handler(req, res) {
  try {
    if (!USER_PROGRESS_TABLE_ID) {
      sendJson(res, 500, { success: false, message: '用户进度表未配置' });
      return;
    }
    if (req.method === 'GET') return await handleGet(req, res);
    if (req.method === 'POST') return await handlePost(req, res);
    sendJson(res, 405, { success: false, message: '仅支持 GET / POST 方法' });
  } catch (e) {
    console.error('[user/progress] 错误:', e.message);
    sendJson(res, 500, { success: false, message: e.message || '服务器错误' });
  }
}

async function handleGet(req, res) {
  const { userId } = req.query;
  if (!userId) { sendJson(res, 400, { success: false, message: '缺少 userId 参数' }); return; }
  const data = await callBitableApi('GET', `tables/${USER_PROGRESS_TABLE_ID}/records?page_size=100`);
  const record = (data.items || []).find((r) => r.fields['用户ID'] === userId);
  if (!record) { sendJson(res, 404, { success: false, message: '用户不存在' }); return; }
  const progress = {
    userId: record.fields['用户ID'], name: record.fields['姓名'],
    joinDate: record.fields['入职日期'], currentStage: record.fields['当前阶段'] || 1,
    completedCount: record.fields['已完成任务数'] || 0,
    taskProgress: safeParse(record.fields['任务进度'], {}),
    gardenData: safeParse(record.fields['花园数据'], {}),
    moodRecords: safeParse(record.fields['心情记录'], []),
    diaryData: safeParse(record.fields['日记数据'], []),
    points: record.fields['积分'] || 0, streakDays: record.fields['连续打卡天数'] || 0,
    lastUpdate: record.fields['最后更新时间'],
  };
  sendJson(res, 200, { success: true, progress });
}

async function handlePost(req, res) {
  const { userId, progressData } = req.body || {};
  if (!userId || !progressData) { sendJson(res, 400, { success: false, message: '缺少参数' }); return; }
  const data = await callBitableApi('GET', `tables/${USER_PROGRESS_TABLE_ID}/records?page_size=100`);
  const record = (data.items || []).find((r) => r.fields['用户ID'] === userId);
  if (!record) { sendJson(res, 404, { success: false, message: '用户不存在' }); return; }
  const now = Date.now();
  const fields = {
    '当前阶段': progressData.currentStage || 1,
    '已完成任务数': progressData.completedCount || 0,
    '任务进度': JSON.stringify(progressData.taskProgress || {}),
    '花园数据': JSON.stringify(progressData.gardenData || {}),
    '心情记录': JSON.stringify(progressData.moodRecords || []),
    '日记数据': JSON.stringify(progressData.diaryData || []),
    '积分': progressData.points || 0,
    '连续打卡天数': progressData.streakDays || 0,
    '最后更新时间': now,
  };
  await callBitableApi('PUT', `tables/${USER_PROGRESS_TABLE_ID}/records/${record.record_id}`, { fields });
  sendJson(res, 200, { success: true, message: '进度已保存' });
}

function safeParse(str, defaultValue) {
  try { return str ? JSON.parse(str) : defaultValue; } catch (e) { return defaultValue; }
}
