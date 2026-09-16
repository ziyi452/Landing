// POST /api/submit-landing  —  入职进度提交到飞书多维表格公开表单

import { getTenantAccessToken, sendJson } from './treehole/_lib/feishu.js';

const FEISHU_SHARE_TOKEN = process.env.FEISHU_SHARE_TOKEN || 'shrcneN89yZrUjBSCZx3Iz1sSab';
const FEISHU_OPEN_API_HOST = process.env.FEISHU_OPEN_API_HOST || 'https://open.feishu.cn';

const TASK_FIELD_NAME_MAP = {
  '1-1': '任务1-认识协作方',
  '1-2': '任务2-了解团队文化',
  '1-3': '任务3-熟悉业务流程',
  '1-4': '任务4-业务轮岗体验',
  '1-5': '任务5-每周1v1沟通',
  '1-6': '任务6-试用期目标制定',
  '2-1': '任务7-独立参与项目',
  '2-2': '任务8-商家达人调研',
  '2-3': '任务9-行业动态输出',
  '2-4': '任务10-主动发现问题',
  '2-5': '任务11-分享过往经验',
  '3-1': '任务12-落地3-5个项目',
  '3-2': '任务13-转正答辩',
  '3-3': '任务14-业务管理建议',
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { success: false, message: '仅支持 POST 方法' });
      return;
    }

    const body = req.body || {};

    const content = {};
    content['姓名'] = body.name || '';
    if (body.joinDate) content['入职日期'] = Number(body.joinDate);
    content['当前阶段'] = body.currentStage || '';
    content['已完成任务数'] = Number(body.completedCount) || 0;
    if (body.lastUpdate) content['最后更新时间'] = Number(body.lastUpdate);

    const tasks = body.tasks || {};
    Object.keys(TASK_FIELD_NAME_MAP).forEach((taskId) => {
      content[TASK_FIELD_NAME_MAP[taskId]] = tasks[taskId] || '⬜ 未完成';
    });

    const token = await getTenantAccessToken();
    const url = `${FEISHU_OPEN_API_HOST}/open-apis/base/v3/bases/tables/forms/submit`;
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ share_token: FEISHU_SHARE_TOKEN, content }),
    });

    const data = await apiRes.json();
    if (data.code !== 0 && data.ok !== true) {
      throw new Error(`表单提交失败: code=${data.code ?? 'unknown'}, msg=${data.msg || data.message || '未知错误'}`);
    }

    sendJson(res, 200, {
      success: true,
      message: '同步成功',
      canSubmitAgain: data.data?.can_submit_again,
    });
  } catch (e) {
    console.error('[submit-landing] 错误:', e.message);
    sendJson(res, 500, { success: false, message: e.message || '服务器错误' });
  }
}
