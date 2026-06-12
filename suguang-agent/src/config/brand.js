window.SUGUANG_BRAND = {
  name: '溯光',
  domain: 'healwealthy.com',
  promise: '把身心、财富与人生方向里的卡点，整理成可行动的下一步。',
  tone: ['温和', '清醒', '有边界', '不制造焦虑', '不承诺疗效或收益'],
  booking: {
    cta: '预约一次溯光咨询',
    storageKey: 'suguang-agent-leads'
  },
  payment: {
    note: '当前 MVP 使用付款链接/人工收款开通。正式上线后可替换为 Stripe、微信支付或小鹅通等支付链接。',
    checkoutBaseUrl: './pricing.html',
  },
  services: [
    {
      id: 'aiTrial',
      name: '199 AI 情绪译码年卡',
      subtitle: '适合第一次尝试溯光，想随时把情绪卡点梳理成成长方向的人。',
      price: '199 元',
      duration: '一年有效',
      bestFor: ['clarity', 'new', 'energy', 'direction'],
      outcome: '把混乱情绪翻译成成长需求、阶段目标和轻量任务计划。',
      includes: ['AI 心理咨询与成长咨询', '情绪创伤卡点分析', '成长需求报告', '目标设定', '7 次轻量任务建议'],
      checkoutPath: './pricing.html?plan=aiTrial'
    },
    {
      id: 'aiCompanion',
      name: '599 AI 陪伴执行 7 次',
      subtitle: '适合旧模式被生活触发时，需要有人陪你从情绪走到行动的人。',
      price: '599 元',
      duration: '一年有效',
      bestFor: ['method', 'season', 'money', 'relation'],
      outcome: '完成 7 次成长节点闭环，不只是想明白，而是开始做。',
      includes: ['包含 199 全部内容', '7 次成长节点陪伴', '触发事件处理', '最小行动任务', '执行后复盘与调整'],
      checkoutPath: './pricing.html?plan=aiCompanion'
    },
    {
      id: 'growthYear',
      name: '1299 模式改写计划',
      subtitle: '适合想改变一个反复出现的旧反应模式的人。',
      price: '1299 元',
      duration: '一年有效',
      bestFor: ['support', 'long', 'money', 'direction'],
      outcome: '识别触发场景和旧反应，训练一套新的反应方式。',
      includes: ['包含 599 全部内容', '锁定一个重复模式', '触发场景记录', '替代行为训练', '阶段模式复盘'],
      checkoutPath: './pricing.html?plan=growthYear'
    },
    {
      id: 'humanCalibration',
      name: '1999 阶段跃迁计划',
      subtitle: '适合卡在关系、职业、表达、财富行动等现实关口，想完成一次真实转变的人。',
      price: '1999 元',
      duration: '一年有效',
      bestFor: ['support', 'long', 'relation', 'direction'],
      outcome: '拆解资源、风险和关键动作，推进一个现实世界里的里程碑。',
      includes: ['包含 1299 全部内容', '明确一个阶段关口', '关键动作路径', '里程碑推进', '下一阶段路线图'],
      checkoutPath: './pricing.html?plan=humanCalibration'
    },
    {
      id: 'humanRetainer',
      name: '29800 人生系统重建',
      subtitle: '适合进入重大人生转型、关系重建或商业价值重塑阶段的人。',
      price: '29800 元',
      duration: '两年有效',
      bestFor: ['support', 'long', 'relation', 'direction', 'method'],
      outcome: '人工深度服务加 1999 AI 服务，重建理解自己和行动的系统。',
      includes: ['包含 1999 AI 服务', '人工深度咨询', '关键节点校准', '定制任务系统', '长期阶段复盘'],
      checkoutPath: './pricing.html?plan=humanRetainer'
    }
  ]
};
