(() => {
  const savedConversation = loadConversationState();
  const state = {
    profile: savedConversation.profile || window.SuguangAgent.initialProfile(),
    messages: savedConversation.messages || [],
    selectedRole: savedConversation.selectedRole || 'sales',
    model: loadModelSettings(),
    usage: loadUsageState(),
    userId: loadUserId()
  };

  const chatLog = document.querySelector('#chatLog');
  const chatForm = document.querySelector('#chatForm');
  const messageInput = document.querySelector('#messageInput');
  const profilePanel = document.querySelector('#profilePanel');
  const serviceCards = document.querySelector('#serviceCards');
  const faqList = document.querySelector('#faqList');
  const assessmentForm = document.querySelector('#assessmentForm');
  const assessmentResult = document.querySelector('#assessmentResult');
  const leadForm = document.querySelector('#leadForm');
  const leadNotice = document.querySelector('#leadNotice');
  const leadPath = document.querySelector('#leadPath');
  const roleSwitcher = document.querySelector('#roleSwitcher');
  const modelForm = document.querySelector('#modelForm');
  const byokFields = document.querySelector('#byokFields');
  const modelNotice = document.querySelector('#modelNotice');
  const modelStatusBar = document.querySelector('#modelStatusBar');
  const usageMeter = document.querySelector('#usageMeter');
  const testModelButton = document.querySelector('#testModelButton');
  const clearModelButton = document.querySelector('#clearModelButton');
  const clearUsageButton = document.querySelector('#clearUsageButton');
  const resetChatButton = document.querySelector('#resetChatButton');
  const exportLeadsButton = document.querySelector('#exportLeadsButton');
  const clearLeadsButton = document.querySelector('#clearLeadsButton');
  const leadQueue = document.querySelector('#leadQueue');

  function loadModelSettings() {
    const fallback = {
      plan: 'aiTrial',
      mode: 'official',
      provider: 'openai',
      model: 'gpt-4.1-mini',
      apiKey: ''
    };
    try {
      const settings = { ...fallback, ...JSON.parse(localStorage.getItem('suguang-model-settings') || '{}') };
      if (settings.apiKey) settings.mode = 'byok';
      return settings;
    } catch (error) {
      return fallback;
    }
  }

  function loadConversationState() {
    try {
      const saved = JSON.parse(localStorage.getItem('suguang-chat-state') || '{}');
      const messages = Array.isArray(saved.messages) ? saved.messages : [];
      return {
        profile: saved.profile || null,
        messages: messages.filter((item) => item && item.role && item.content).slice(-40),
        selectedRole: saved.selectedRole || '',
      };
    } catch (error) {
      return {};
    }
  }

  function saveConversationState() {
    localStorage.setItem('suguang-chat-state', JSON.stringify({
      profile: state.profile,
      messages: state.messages.slice(-40),
      selectedRole: state.selectedRole,
      updatedAt: new Date().toISOString(),
    }));
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function currentPlan() {
    return window.SUGUANG_USAGE_PLANS[state.model.plan] || window.SUGUANG_USAGE_PLANS.aiTrial;
  }

  function loadUsageState() {
    const fallback = { date: todayKey(), byPlan: {} };
    try {
      const saved = JSON.parse(localStorage.getItem('suguang-usage-state') || '{}');
      if (saved.date === fallback.date && saved.byPlan) return { ...fallback, ...saved };
      return fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveUsageState() {
    localStorage.setItem('suguang-usage-state', JSON.stringify(state.usage));
  }

  function loadUserId() {
    const key = 'suguang-user-id';
    let value = localStorage.getItem(key);
    if (!value) {
      value = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, value);
    }
    return value;
  }

  function usageForPlan(planId = state.model.plan) {
    if (state.usage.date !== todayKey()) {
      state.usage = { date: todayKey(), byPlan: {} };
      saveUsageState();
    }
    if (!state.usage.byPlan[planId]) state.usage.byPlan[planId] = { messages: 0, tokens: 0 };
    return state.usage.byPlan[planId];
  }

  function estimateTokens(text) {
    return Math.max(1, Math.ceil(String(text || '').length / 1.8));
  }

  function estimateRequestTokens(text, localDraft) {
    const recent = state.messages.slice(-10).map((item) => item.content).join('\n');
    return estimateTokens([text, localDraft, recent].join('\n')) + 1200;
  }

  function checkUsageBeforeRemote(text, localDraft) {
    const plan = currentPlan();
    const estimate = estimateRequestTokens(text, localDraft);
    if (String(text || '').length > plan.maxInputChars) {
      return {
        ok: false,
        reason: '这次输入超过「' + plan.label + '」的单次长度上限。你可以先压缩成一个关键问题，或升级到更高档位。'
      };
    }
    if (isUsingByok()) {
      return { ok: true, estimate, skipUsage: true };
    }
    const usage = usageForPlan(plan.id);
    if (usage.messages + 1 > plan.dailyMessages || usage.tokens + estimate > plan.dailyTokens) {
      return {
        ok: false,
        reason: '今天的「' + plan.label + '」远程模型额度已用完。你仍可以继续使用本地规则回复，或留下预约意向让人工跟进。'
      };
    }
    return { ok: true, estimate };
  }

  function recordUsage(payload, estimate) {
    if (isUsingByok()) {
      renderUsageMeter();
      return;
    }
    const plan = currentPlan();
    const usage = usageForPlan(plan.id);
    usage.messages += 1;
    usage.tokens += Number(payload.usage?.estimatedTokens || estimate || 0);
    saveUsageState();
    renderUsageMeter();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function renderServices() {
    serviceCards.innerHTML = window.SUGUANG_BRAND.services.map((service) => {
      const includes = (service.includes || []).map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
      return '<article class="service-card" data-service-id="' + escapeHtml(service.id) + '">' +
        '<div class="service-index">' + escapeHtml(service.id) + '</div>' +
        '<h3>' + escapeHtml(service.name) + '</h3>' +
        '<div class="service-meta"><span>' + escapeHtml(service.price || '待确认') + '</span><span>' + escapeHtml(service.duration || '') + '</span></div>' +
        '<p>' + escapeHtml(service.subtitle) + '</p>' +
        (includes ? '<ul>' + includes + '</ul>' : '') +
        '<strong>' + escapeHtml(service.outcome) + '</strong>' +
        '<button type="button" data-service-question="' + escapeHtml(service.name) + '适合什么人？">了解这个路径</button>' +
      '</article>';
    }).join('');
  }

  function renderFaq() {
    if (!faqList) return;
    faqList.innerHTML = window.SUGUANG_KNOWLEDGE.faq.map((item) => {
      return '<article class="faq-item">' +
        '<h3>' + escapeHtml(item.q) + '</h3>' +
        '<p>' + escapeHtml(item.a) + '</p>' +
        '<button type="button" data-faq-question="' + escapeHtml(item.q) + '">问 Agent</button>' +
      '</article>';
    }).join('');
  }

  function renderProfile() {
    const rows = [
      ['当前角色', window.SUGUANG_ROLES[state.profile.role]?.label || '自动判断'],
      ['识别议题', state.profile.topic],
      ['强度判断', state.profile.intensity],
      ['来访意图', state.profile.intent],
      ['建议路径', state.profile.suggestedPath],
      ['模型模式', isUsingByok() ? '自带 Key：' + providerLabel(state.model.provider) : '官方体验额度'],
      ['当前权益', currentPlan().label],
      ['售前阶段', state.profile.sales?.stage || '未开始'],
      ['成交步骤', state.profile.sales?.playbookStep ? state.profile.sales.playbookStep + '. ' + state.profile.sales.playbookLabel : '未开始'],
      ['服务状态', state.profile.service?.active ? '服务中：' + (state.profile.service.plan || '已开通') : '未开通'],
      ['意向分', String(state.profile.sales?.leadScore ?? 0) + '/7']
    ];
    profilePanel.innerHTML = rows.map(([key, value]) => '<dt>' + escapeHtml(key) + '</dt><dd>' + escapeHtml(value) + '</dd>').join('');
    if (leadPath) leadPath.value = state.profile.suggestedPath || '';
    saveConversationState();
  }

  function addMessage(role, content) {
    state.messages.push({ role, content, time: new Date().toISOString() });
    renderMessage(role, content);
    saveConversationState();
  }

  function renderMessage(role, content) {
    const item = document.createElement('article');
    item.className = 'message ' + role;
    item.innerHTML = '<div>' + escapeHtml(content).replace(/\n/g, '<br>') + '</div>';
    chatLog.appendChild(item);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function updateLastAgentMessage(content) {
    const lastMessage = Array.from(chatLog.querySelectorAll('.message.agent')).at(-1);
    if (!lastMessage) return;
    lastMessage.innerHTML = '<div>' + escapeHtml(content).replace(/\n/g, '<br>') + '</div>';
    const stateMessage = [...state.messages].reverse().find((item) => item.role === 'agent');
    if (stateMessage) stateMessage.content = content;
    chatLog.scrollTop = chatLog.scrollHeight;
    saveConversationState();
  }

  function restoreChat() {
    chatLog.innerHTML = '';
    state.messages.forEach((item) => renderMessage(item.role, item.content));
  }

  function buildAgentContext(requestedRole) {
    const salesCaseSummaries = (window.SUGUANG_SALES_CASES || []).map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.userProfile?.situation || item.summary || item.scenario || '',
      recommendedProduct: item.recommendedProduct,
      productInsight: item.productInsight,
      closingScript: item.closingScript,
    }));
    return {
      brand: {
        name: window.SUGUANG_BRAND.name,
        promise: window.SUGUANG_BRAND.promise,
        tone: window.SUGUANG_BRAND.tone,
      },
      services: window.SUGUANG_BRAND.services,
      roleConfig: requestedRole ? window.SUGUANG_ROLES[requestedRole] : null,
      topics: window.SUGUANG_KNOWLEDGE.topics,
      faq: window.SUGUANG_KNOWLEDGE.faq,
      subconsciousExercises: window.SUGUANG_KNOWLEDGE.subconsciousExercises,
      methodology: window.SUGUANG_METHODOLOGY,
      salesPrinciples: window.SUGUANG_SALES.objectionPrinciples,
      salesCases: salesCaseSummaries,
      examples: window.SUGUANG_EXAMPLES || [],
      usagePlan: currentPlan(),
    };
  }

  function shouldUseRemoteModel() {
    if (window.location.protocol === 'file:') return false;
    if (isUsingByok()) return Boolean(state.model.apiKey);
    return true;
  }

  function isUsingByok(model = state.model) {
    return model.mode === 'byok' || Boolean(model.apiKey);
  }

  function modelForRequest(model = state.model) {
    return isUsingByok(model) ? { ...model, mode: 'byok' } : model;
  }

  async function requestRemoteReply({ requestedRole, localDraft }) {
    const plan = currentPlan();
    const usage = usageForPlan(plan.id);
    const response = await fetch('./api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: requestedRole || state.profile.role,
        profile: state.profile,
        model: modelForRequest(),
        plan: {
          id: plan.id,
          label: plan.label,
          dailyMessages: plan.dailyMessages,
          dailyTokens: plan.dailyTokens,
          maxInputChars: plan.maxInputChars,
        },
        userId: state.userId,
        clientUsage: {
          date: state.usage.date,
          messages: usage.messages,
          tokens: usage.tokens,
        },
        messages: state.messages.filter((item) => item.content !== '正在调用大模型生成回复...').slice(-10),
        localDraft,
        context: buildAgentContext(requestedRole || state.profile.role),
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!payload) {
      throw new Error('没有连上 `/api/chat`。本地预览请使用 `npm run dev` 或 `node scripts/dev-server.js`，不要用纯静态服务。');
    }
    if (!response.ok || !payload.ok) {
      const error = payload.error || '大模型暂时不可用。';
      throw new Error(error);
    }
    return payload;
  }

  async function checkApiHealth() {
    const response = await fetch('./api/chat');
    const payload = await response.json().catch(() => null);
    if (!payload) {
      throw new Error('没有检测到 `/api/chat`。请使用 `npm run dev`、`node scripts/dev-server.js`，或部署到支持 Functions 的 Cloudflare Pages。');
    }
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || 'API 健康检查失败。');
    }
    return payload;
  }

  async function testRemoteModel(values) {
    const plan = currentPlan();
    const response = await fetch('./api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'support',
        profile: state.profile,
        model: modelForRequest(values),
        plan: {
          id: plan.id,
          label: plan.label,
          dailyMessages: plan.dailyMessages,
          dailyTokens: plan.dailyTokens,
          maxInputChars: plan.maxInputChars,
        },
        userId: state.userId + '-config-test',
        clientUsage: { date: todayKey(), messages: 0, tokens: 0 },
        messages: [{ role: 'user', content: '请只回复：连接成功' }],
        localDraft: '',
        context: buildAgentContext('support'),
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!payload) throw new Error('模型测试没有返回 JSON。');
    if (!response.ok || !payload.ok) throw new Error(payload.error || '模型测试失败。');
    return payload;
  }

  async function sendUserMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    addMessage('user', trimmed);
    const requestedRole = state.selectedRole === 'auto' ? null : state.selectedRole;
    const result = window.SuguangAgent.answer(trimmed, state.profile, requestedRole);
    state.profile = result.profile;
    renderProfile();

    if (!shouldUseRemoteModel()) {
      addMessage('agent', result.reply);
      renderUsageMeter();
      return;
    }

    const usageCheck = checkUsageBeforeRemote(trimmed, result.reply);
    if (!usageCheck.ok) {
      addMessage('agent', result.reply + '\n\n[当前使用本地规则回复：' + usageCheck.reason + ']');
      renderUsageMeter();
      return;
    }

    addMessage('agent', result.reply + '\n\n[大模型正在优化回复...]');
    try {
      const payload = await requestRemoteReply({
        requestedRole,
        localDraft: result.reply,
      });
      recordUsage(payload, usageCheck.estimate);
      updateLastAgentMessage(payload.reply);
    } catch (error) {
      updateLastAgentMessage(result.reply + '\n\n[已先使用本地规则回复：' + error.message + ']');
    } finally {
      renderProfile();
    }
  }

  function bootChat() {
    if (state.messages.length) {
      restoreChat();
      renderProfile();
      return;
    }
    addMessage('agent', '你好，我是溯光 Agent。你可以直接说：最近最消耗你的是什么？我会先帮你把问题分层，而不是急着给答案。');
    renderProfile();
  }

  function providerLabel(provider) {
    const labels = {
      openai: 'OpenAI ChatGPT',
      anthropic: 'Claude',
      gemini: 'Google Gemini',
      'volcengine-coding': '火山引擎 HiPaaS / 方舟 Coding Plan',
      deepseek: 'DeepSeek 官方 API',
      zhipu: '智谱 GLM / 智谱清言',
      dashscope: '阿里云百炼 / 通义千问',
      moonshot: 'Moonshot Kimi'
    };
    return labels[provider] || provider;
  }

  function maskKey(key) {
    if (!key) return '未填写';
    if (key.length <= 10) return '已保存';
    return key.slice(0, 6) + '...' + key.slice(-4);
  }

  function expectedKeyHint(provider) {
    if (provider === 'openai') return 'OpenAI Key 通常以 sk- 开头。';
    if (provider === 'anthropic') return 'Claude Key 通常以 sk-ant- 开头。';
    if (provider === 'gemini') return 'Gemini Key 通常以 AIza 开头。';
    if (provider === 'volcengine-coding') return '请填写火山引擎 HiPaaS / 方舟 Coding Plan 的 API Key。';
    if (provider === 'deepseek') return '请填写 DeepSeek 官方 API Key。';
    if (provider === 'zhipu') return '请填写智谱开放平台 API Key。';
    if (provider === 'dashscope') return '请填写阿里云百炼 DashScope API Key。';
    if (provider === 'moonshot') return '请填写 Moonshot/Kimi API Key。';
    return '请填写服务商后台生成的 API Key。';
  }

  function validateKey(provider, key) {
    if (!key) return '还没有填写 API Key。';
    if (provider === 'openai' && !key.startsWith('sk-')) return expectedKeyHint(provider);
    if (provider === 'anthropic' && !key.startsWith('sk-ant-')) return expectedKeyHint(provider);
    if (provider === 'gemini' && !key.startsWith('AIza')) return expectedKeyHint(provider);
    return '';
  }

  function currentFormValues() {
    const values = Object.fromEntries(new FormData(modelForm).entries());
    if (!values.apiKey && state.model.apiKey) values.apiKey = state.model.apiKey;
    return values;
  }

  function syncModelOptions() {
    if (!modelForm) return;
    const provider = modelForm.elements.provider?.value || state.model.provider;
    const modelSelect = modelForm.elements.model;
    if (!modelSelect) return;
    Array.from(modelSelect.options).forEach((option) => {
      const visible = option.dataset.provider === provider;
      option.hidden = !visible;
      option.disabled = !visible;
    });
    if (modelSelect.selectedOptions[0]?.disabled) {
      const firstAvailable = Array.from(modelSelect.options).find((option) => !option.disabled);
      if (firstAvailable) modelSelect.value = firstAvailable.value;
    }
  }

  function renderModelSettings() {
    if (!modelForm) return;
    modelForm.elements.plan.value = state.model.plan || 'aiTrial';
    modelForm.elements.mode.value = state.model.mode;
    modelForm.elements.provider.value = state.model.provider;
    syncModelOptions();
    const savedModelOption = Array.from(modelForm.elements.model.options).find((option) => {
      return option.value === state.model.model && !option.disabled;
    });
    if (savedModelOption) {
      modelForm.elements.model.value = state.model.model;
    } else {
      state.model.model = modelForm.elements.model.value;
    }
    modelForm.elements.apiKey.value = '';
    modelForm.elements.apiKey.placeholder = state.model.apiKey ? maskKey(state.model.apiKey) + '，重新填写可覆盖' : '只保存在当前浏览器';
    byokFields.hidden = state.model.mode !== 'byok';

    const isByok = isUsingByok();
    const plan = currentPlan();
    const provider = providerLabel(state.model.provider);
    const modelName = state.model.model;
    const keyState = maskKey(state.model.apiKey);
    modelNotice.textContent = isByok
      ? '当前使用自带 Key 模式：' + provider + ' / ' + modelName + ' / ' + keyState + '。Key 仅保存在当前浏览器。'
      : '当前使用官方体验模式。产品权益：' + plan.label + '，每日上限 ' + plan.dailyMessages + ' 条远程回复。';

    modelStatusBar.innerHTML = isByok
      ? '<strong>' + escapeHtml(plan.label) + '</strong><span>' + escapeHtml(provider + ' · ' + modelName + ' · ' + keyState) + '</span>'
      : '<strong>' + escapeHtml(plan.label) + '</strong><span>官方额度已接入 `/api/chat`；未配置 Key 时回退本地规则。</span>';
    renderUsageMeter();
    renderProfile();
  }

  function renderRoleSwitcher() {
    roleSwitcher.querySelectorAll('button').forEach((item) => {
      item.classList.toggle('active', item.dataset.role === state.selectedRole);
    });
  }

  function renderUsageMeter() {
    if (!usageMeter) return;
    const plan = currentPlan();
    if (isUsingByok()) {
      usageMeter.classList.remove('is-limited');
      usageMeter.innerHTML = '<strong>' + escapeHtml(plan.label + ' · 自带 Key 模式') + '</strong>' +
        '<span>当前使用你自己的 API Key，不消耗平台每日消息/token 额度；仅保留单次输入长度和安全边界。</span>';
      return;
    }
    const usage = usageForPlan(plan.id);
    const messagePct = Math.min(100, Math.round((usage.messages / plan.dailyMessages) * 100));
    const tokenPct = Math.min(100, Math.round((usage.tokens / plan.dailyTokens) * 100));
    const isLimited = usage.messages >= plan.dailyMessages || usage.tokens >= plan.dailyTokens;
    usageMeter.classList.toggle('is-limited', isLimited);
    usageMeter.innerHTML = '<strong>' + escapeHtml(plan.label + ' · 今日远程额度') + '</strong>' +
      '<div class="usage-bars">' +
        '<div class="usage-bar"><span>消息</span><div class="usage-track"><div class="usage-fill" style="width:' + messagePct + '%"></div></div><small>' + usage.messages + '/' + plan.dailyMessages + '</small></div>' +
        '<div class="usage-bar"><span>估算 token</span><div class="usage-track"><div class="usage-fill" style="width:' + tokenPct + '%"></div></div><small>' + usage.tokens + '/' + plan.dailyTokens + '</small></div>' +
      '</div>' +
      '<span>' + escapeHtml(plan.followUpSla) + '</span>';
  }

  function saveModelSettings(values) {
    state.model = { ...state.model, ...values };
    localStorage.setItem('suguang-model-settings', JSON.stringify(state.model));
    renderModelSettings();
  }

  function resetConversation() {
    state.profile = window.SuguangAgent.initialProfile();
    state.messages = [];
    state.selectedRole = 'sales';
    localStorage.removeItem('suguang-chat-state');
    renderRoleSwitcher();
    chatLog.innerHTML = '';
    bootChat();
  }

  function clearTodayUsage() {
    state.usage = { date: todayKey(), byPlan: {} };
    saveUsageState();
    renderUsageMeter();
    modelNotice.textContent = '今日本地远程额度已清空。';
  }

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    sendUserMessage(messageInput.value);
    messageInput.value = '';
    messageInput.focus();
  });

  messageInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    chatForm.requestSubmit();
  });

  document.querySelectorAll('[data-sample]').forEach((button) => {
    button.addEventListener('click', () => {
      sendUserMessage(button.dataset.sample);
    });
  });

  serviceCards.addEventListener('click', (event) => {
    const button = event.target.closest('[data-service-question]');
    if (!button) return;
    sendUserMessage(button.dataset.serviceQuestion);
    document.querySelector('#agent').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (faqList) {
    faqList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-faq-question]');
      if (!button) return;
      sendUserMessage(button.dataset.faqQuestion);
      document.querySelector('#agent').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  roleSwitcher.addEventListener('click', (event) => {
    const button = event.target.closest('[data-role]');
    if (!button) return;
    state.selectedRole = button.dataset.role;
    renderRoleSwitcher();
    const label = state.selectedRole === 'auto' ? '自动判断' : window.SUGUANG_ROLES[state.selectedRole].label;
    if (state.selectedRole !== 'auto') state.profile = { ...state.profile, role: state.selectedRole };
    renderProfile();
    addMessage('agent', '已切换为「' + label + '」模式。你可以继续说当前问题，我会按这个角色承接。');
  });

  resetChatButton?.addEventListener('click', resetConversation);

  assessmentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(assessmentForm).entries());
    assessmentResult.textContent = window.SuguangAgent.assess(values);
    assessmentResult.classList.add('is-ready');
  });

  function loadLeads() {
    try {
      return JSON.parse(localStorage.getItem(window.SUGUANG_BRAND.booking.storageKey) || '[]');
    } catch (error) {
      return [];
    }
  }

  function buildFollowUp(values) {
    const plan = currentPlan();
    const path = values.path || state.profile.suggestedPath || plan.label;
    if (values.status === 'booked') return '确认时间、发送准备问题，并标记推荐路径「' + path + '」。';
    if (values.status === 'qualified') return '人工复核议题边界，确认是否进入「' + path + '」。';
    if (values.status === 'follow_up') return '24 小时内低压跟进：询问是否要继续完成诊断或预约。';
    return plan.followUpSla + '；先确认问题、预算、期望和风险边界。';
  }

  function renderLeads() {
    if (!leadQueue) return;
    const leads = loadLeads().slice(-5).reverse();
    if (!leads.length) {
      leadQueue.innerHTML = '<div class="lead-item"><span>还没有本地线索。保存预约意向后，会在这里生成跟进摘要。</span></div>';
      return;
    }
    leadQueue.innerHTML = leads.map((lead) => {
      return '<article class="lead-item">' +
        '<strong>' + escapeHtml(lead.name || '未命名线索') + ' · ' + escapeHtml(lead.status || 'new') + '</strong>' +
        '<span>' + escapeHtml(lead.path || lead.profile?.suggestedPath || '待匹配路径') + '</span>' +
        '<small>' + escapeHtml(lead.contact || '未留联系方式') + '</small>' +
        '<small>' + escapeHtml(lead.followUp || '') + '</small>' +
      '</article>';
    }).join('');
  }

  function exportLeads() {
    const leads = loadLeads();
    const payload = JSON.stringify(leads, null, 2);
    navigator.clipboard?.writeText(payload).then(() => {
      leadNotice.textContent = '已复制 ' + leads.length + ' 条线索 JSON，可粘贴到表格或 CRM。';
    }).catch(() => {
      leadNotice.textContent = payload;
    });
  }

  leadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(leadForm).entries());
    const storageKey = window.SUGUANG_BRAND.booking.storageKey;
    const leads = loadLeads();
    const followUp = buildFollowUp(values);
    leads.push({ ...values, followUp, profile: state.profile, plan: currentPlan().id, createdAt: new Date().toISOString() });
    localStorage.setItem(storageKey, JSON.stringify(leads));
    leadNotice.textContent = '已保存。建议跟进：' + followUp;
    leadForm.reset();
    renderLeads();
  });

  exportLeadsButton?.addEventListener('click', exportLeads);

  clearLeadsButton?.addEventListener('click', () => {
    localStorage.removeItem(window.SUGUANG_BRAND.booking.storageKey);
    leadNotice.textContent = '已清空本地线索。';
    renderLeads();
  });

  if (modelForm) {
    modelForm.addEventListener('change', (event) => {
      if (event.target.name === 'plan') {
        state.model.plan = event.target.value;
      }
      if (event.target.name === 'mode') {
        state.model.mode = event.target.value;
        byokFields.hidden = state.model.mode !== 'byok';
      }
      if (event.target.name === 'provider') {
        state.model.provider = event.target.value;
        syncModelOptions();
        state.model.model = modelForm.elements.model.value;
      }
      if (event.target.name === 'model') {
        state.model.model = event.target.value;
      }
      if (event.target.name === 'apiKey') {
        state.model.apiKey = event.target.value.trim();
      }
      renderModelSettings();
    });

    modelForm.elements.apiKey.addEventListener('input', (event) => {
      state.model.apiKey = event.target.value.trim();
    });

    modelForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = currentFormValues();
      saveModelSettings(values);
      const warning = values.mode === 'byok' ? validateKey(values.provider, values.apiKey) : '';
      modelNotice.textContent = warning || '模型设置已保存。Key 保存在当前浏览器；发送对话时会临时转发给 `/api/chat`。';
    });

    testModelButton.addEventListener('click', async () => {
      const values = currentFormValues();
      const warning = values.mode === 'byok' ? validateKey(values.provider, values.apiKey) : '';
      if (warning) {
        modelNotice.textContent = warning;
        return;
      }
      modelNotice.textContent = '正在检测 `/api/chat`...';
      try {
        const health = await checkApiHealth();
        if (values.mode === 'official' && !health.providers?.[values.provider]) {
          modelNotice.textContent = '代理已连上，但服务端还没有配置 ' + providerLabel(values.provider) + ' API Key。请在 `.env` 或部署环境里配置。';
          return;
        }
        modelNotice.textContent = '代理已连上，正在请求模型...';
        const payload = await testRemoteModel(values);
        modelNotice.textContent = '模型连接成功：' + providerLabel(values.provider) + ' / ' + payload.model + '。';
      } catch (error) {
        modelNotice.textContent = error.message;
      }
    });

    clearModelButton.addEventListener('click', () => {
      saveModelSettings({
        plan: state.model.plan || 'aiTrial',
        mode: 'official',
        provider: 'openai',
        model: 'gpt-4.1-mini',
        apiKey: ''
      });
      modelNotice.textContent = '已清除本地 API Key，并切回官方体验模式。';
    });

    clearUsageButton?.addEventListener('click', clearTodayUsage);
  }

  renderServices();
  renderFaq();
  renderRoleSwitcher();
  renderModelSettings();
  renderLeads();
  bootChat();
})();
