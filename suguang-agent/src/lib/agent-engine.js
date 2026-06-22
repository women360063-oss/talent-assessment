window.SuguangAgent = (() => {
  const brand = () => window.SUGUANG_BRAND;
  const knowledge = () => window.SUGUANG_KNOWLEDGE;
  const roles = () => window.SUGUANG_ROLES;
  const examples = () => window.SUGUANG_EXAMPLES || [];
  const sales = () => window.SUGUANG_SALES;

  const initialProfile = () => ({
    role: 'sales',
    topic: '待识别',
    intensity: '轻度探索',
    intent: '倾诉 / 探索',
    suggestedPath: '先做售前诊断',
    sales: {
      active: false,
      step: 0,
      stage: '未开始',
      playbookStep: 0,
      playbookLabel: '未开始',
      leadScore: 0,
      data: {},
      recommendation: ''
    },
    service: {
      active: false,
      plan: '',
      startedAt: '',
      currentFocus: ''
    }
  });

  function detectSafety(text) {
    const lower = text.toLowerCase();
    const safety = knowledge().safety;
    if (safety.crisis.some((word) => lower.includes(word))) return 'crisis';
    if (safety.investment.some((word) => lower.includes(word))) return 'investment';
    if (safety.medical.some((word) => lower.includes(word))) return 'medical';
    return null;
  }

  function detectRole(text, safety) {
    if (safety === 'crisis' || safety === 'medical') return 'therapist';
    const roleScores = Object.entries(roles()).map(([roleId, role]) => {
      const score = role.bestFor.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
      return [roleId, score];
    });
    roleScores.sort((a, b) => b[1] - a[1]);
    if (roleScores[0][1] > 0) return roleScores[0][0];
    if (/多少钱|价格|链接|怎么参加|预约|报名|客服/.test(text)) return 'support';
    if (/适合|方案|服务|陪跑|咨询|测评|购买/.test(text)) return 'sales';
    return 'therapist';
  }

  function detectTopic(text) {
    let best = ['direction', 0];
    for (const [key, topic] of Object.entries(knowledge().topics)) {
      const score = topic.keywords.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
      if (score > best[1]) best = [key, score];
    }
    return best[0];
  }

  function detectIntent(text) {
    if (/转人工|人工咨询|真人咨询|联系人工|人工跟进|加微信|微信/.test(text)) return '转人工咨询';
    if (/下单|购买|买|付款|付费|开通|选择套餐|选套餐|推荐套餐/.test(text)) return '购买 / 套餐选择';
    if (/心理咨询|咨询师|潜意识|冥想|练习|内在小孩|金钱能量/.test(text)) return '心理咨询 / 练习';
    if (/预约|咨询|报名|联系|价格|多少钱|服务/.test(text)) return '预约 / 服务咨询';
    if (/怎么办|方法|解决|改变|行动/.test(text)) return '寻求方法';
    if (/为什么|看清|不知道|迷茫/.test(text)) return '理解问题';
    return '倾诉 / 探索';
  }

  function detectIntensity(text) {
    if (/半年|一年|很久|长期|反复|崩溃|受不了/.test(text)) return '需要深度支持';
    if (/最近|这段时间|几个月|持续/.test(text)) return '中度卡点';
    return '轻度探索';
  }

  function matchService(profile) {
    const services = brand().services;
    if (profile.intensity === '需要深度支持') return services.find((item) => item.id === 'growthYear');
    if (profile.intent === '预约 / 服务咨询') return services.find((item) => item.id === 'aiCompanion');
    if (profile.intent === '寻求方法') return services.find((item) => item.id === 'aiCompanion');
    return services.find((item) => item.id === 'aiTrial');
  }

  function matchSalesService(data, text = '') {
    const allText = Object.values(data).join(' ') + ' ' + text;
    const pattern = sales().dialoguePatterns.find((item) => item.signals.some((word) => allText.includes(word)));
    if (pattern && sales().services[pattern.recommendedService]) return sales().services[pattern.recommendedService];
    let best = Object.values(sales().services)[0];
    let bestScore = -1;
    for (const service of Object.values(sales().services)) {
      const score = service.bestFor.reduce((sum, word) => sum + (allText.includes(word) ? 1 : 0), 0);
      if (score > bestScore) {
        best = service;
        bestScore = score;
      }
    }
    if (/真人|深度|系统重建|29800|两年|重大转型|长期人工/.test(allText)) return sales().services.humanRetainer;
    if (/阶段跃迁|1999|现实关口|职业转型|副业|开始收费|公开表达|里程碑/.test(allText)) return sales().services.humanCalibration;
    if (/模式改写|1299|旧模式|旧反应|讨好|拖延|回避|自我怀疑|不敢表达|羞耻/.test(allText)) return sales().services.growthYear;
    if (/执行|7次|599|触发|节点|沟通|复盘|陪伴执行/.test(allText)) return sales().services.aiCompanion;
    if (/体验|199|试试|译码|情绪卡点|第一次|不确定/.test(allText)) return sales().services.aiTrial;
    return best;
  }

  function scoreLead(data) {
    let score = 0;
    const text = Object.values(data).join(' ');
    if (/长期|半年|一年|反复|很久/.test(text)) score += 2;
    if (/影响|失眠|工作|关系|崩溃|焦虑|内耗/.test(text)) score += 2;
    if (/想解决|一定|必须|很想|愿意|10|9|8|7/.test(text)) score += 2;
    if (/尝试|咨询|课程|运动|学习/.test(text)) score += 1;
    if (/一人公司|自媒体|内容|复盘|秩序|创业|AI助理/.test(text)) score += 1;
    return Math.min(score, 7);
  }

  function findSalesObjection(text) {
    return sales().objections.find((item) => item.keywords.some((word) => text.includes(word)));
  }

  function normalizeQuestion(text) {
    return text.replace(/[？?，,。.\s]/g, '');
  }

  function findFaq(text) {
    const normalizedText = normalizeQuestion(text);
    return knowledge().faq.find((item) => {
      const normalizedQuestion = normalizeQuestion(item.q);
      return normalizedText.includes(normalizedQuestion) ||
        normalizedQuestion.includes(normalizedText) ||
        normalizedQuestion.slice(0, 5).includes(normalizedText.slice(0, 5));
    });
  }

  function findServiceInfo(text) {
    const allServices = [
      ...brand().services,
      ...Object.values(sales().services || {})
    ];
    return allServices.find((item) => {
      return text.includes(item.name) || text.includes(item.price || '') || text.includes(item.id);
    });
  }

  function findSubconsciousExercise(text) {
    return knowledge().subconsciousExercises?.find((exercise) => {
      return text.includes(exercise.name) || exercise.keywords.some((word) => text.includes(word));
    });
  }

  function answerExerciseQuestion(text, role) {
    const exercise = findSubconsciousExercise(text);
    const exercises = knowledge().subconsciousExercises || [];

    if (!exercise && /潜意识练习|冥想练习|冥想|练习/.test(text)) {
      const lines = exercises.map((item) => {
        return '「' + item.name + '」：' + item.bestFor;
      });
      return roleIntro(role.id) + '\n\n' +
        '溯光当前训练了这几类潜意识/冥想练习：\n' +
        lines.join('\n') +
        '\n\n你可以告诉我你现在更接近哪类议题：理想场景、金钱关系、内在小孩/原生家庭，还是睡前自我肯定。';
    }

    if (!exercise) return '';

    return roleIntro(role.id) + '\n\n' +
      '我可以用「' + exercise.name + '」帮你做一个简版引导。\n\n' +
      '适用场景：' + exercise.bestFor + '\n\n' +
      '简版流程：\n' +
      exercise.steps.map((step, index) => String(index + 1) + '. ' + step).join('\n') +
      '\n\n边界提醒：' + exercise.boundary +
      '\n\n如果你要现在开始，我会先确认：你现在是否在安静、安全、不会被打扰的环境里？';
  }

  function nextSalesQuestion(profile, text) {
    const salesState = profile.sales || initialProfile().sales;
    const nextState = {
      ...salesState,
      active: true,
      data: { ...salesState.data }
    };
    const questions = sales().questions;
    const previousQuestion = questions[nextState.step - 1];
    if (previousQuestion) nextState.data[previousQuestion.key] = text;

    if (nextState.step >= questions.length) {
      const service = matchSalesService(nextState.data, text);
      nextState.active = false;
      nextState.stage = '方案推荐';
      nextState.playbookStep = 12;
      nextState.playbookLabel = sales().playbook.find((step) => step.step === 12)?.label || '价格激励并成交';
      nextState.leadScore = scoreLead(nextState.data);
      nextState.recommendation = service.name;
      return {
        salesState: nextState,
        service,
        reply: buildSalesProposal(nextState, service)
      };
    }

    const question = questions[nextState.step];
    nextState.step += 1;
    nextState.stage = sales().stages.find((stage) => stage.id === question.stage)?.label || '售前诊断';
    nextState.playbookStep = question.playbookStep;
    nextState.playbookLabel = sales().playbook.find((step) => step.step === question.playbookStep)?.label || '售前诊断';
    nextState.leadScore = scoreLead(nextState.data);
    const displayQuestion = question.question.replace(/\[名字\]/g, nextState.data.name || '你');
    return {
      salesState: nextState,
      service: null,
      reply: displayQuestion
    };
  }

  function buildSalesProposal(salesState, service) {
    const data = salesState.data;
    const name = data.name || '你';
    const summary = [
      '我先帮你总结一下：',
      '当前状态：' + (data.currentState || '你提到自己正处在一个需要被梳理的阶段'),
      '主要影响：' + (data.impact || '已经对你的生活状态产生影响'),
      '理想状态：' + (data.idealState || data.futureVision || '希望回到更稳定、更有选择权的状态'),
      '根因判断：' + (data.rootCause || '需要有人帮你把方法、节奏和复盘机制固定下来')
    ].join('\n');

    return name + '，我听下来，不建议你一上来就选最重的方案，而是要选最贴合你当前阶段的方案。\n\n' +
      summary + '\n\n' +
      '我会优先推荐「' + service.name + '」。\n' +
      service.description + '\n\n' +
      '服务价值：' + service.value + '\n' +
      '周期/时长：' + service.duration + '\n' +
      '参考价格：' + service.price + '\n\n' +
      '如果你愿意继续，我建议下一步先留下联系方式和你最想解决的一个问题，由人工再帮你确认是否真的适配。';
  }

  function answerSalesDelivery(profile) {
    const recommendation = profile.sales?.recommendation;
    const service = Object.values(sales().services).find((item) => item.name === recommendation) || sales().services.growthYear;
    return '我把「' + service.name + '」的交付讲清楚：\n\n' +
      service.delivery + '\n\n' +
      '周期/时长：' + service.duration + '\n' +
      '参考价格：' + service.price + '\n\n' +
      '这类服务的重点不是让你被信息淹没，而是把真实触发点转成清晰行动，并在执行后有复盘。';
  }

  function findBrandServiceBySalesService(serviceName) {
    const allServices = [
      ...brand().services,
      ...Object.values(sales().services || {})
    ];
    const matched = allServices.find((item) => item.name === serviceName);
    if (!matched) return brand().services.find((item) => item.id === 'aiTrial');
    return brand().services.find((item) => item.id === matched.id) || matched;
  }

  function answerPurchaseNextStep(profile) {
    const recommendation = profile.sales?.recommendation || profile.suggestedPath || '199 AI 情绪译码年卡';
    const service = findBrandServiceBySalesService(recommendation);
    const checkoutPath = service.checkoutPath || brand().payment?.checkoutBaseUrl || './pricing.html';

    return '好，那这一步就不再继续免费诊断了，直接进入购买开通。\n\n' +
      '推荐购买：「' + service.name + '」\n' +
      '价格：' + (service.price || '待确认') + '\n' +
      '有效期：' + (service.duration || '待确认') + '\n\n' +
      '购买步骤：\n' +
      '1. 打开购买页：' + checkoutPath + '\n' +
      '2. 付款备注写：' + service.name + ' + 你的称呼。\n' +
      '3. 付款完成后回到这里回复「已付款，开始服务」。我会直接进入服务模式，先陪你处理当下最悬着的那件事。\n\n' +
      '如果你现在还没有真实支付链接，就先把这个购买页接到微信/小鹅通/Stripe/人工收款二维码；Agent 这里负责把用户从“愿意开始”带到“付款开通 → 开始服务”。';
  }

  function answerPackageChoice(profile, text) {
    const service = matchSalesService(profile.sales?.data || {}, text);
    const lines = Object.values(sales().services).map((item) => {
      return item.price + '：' + item.name + '，' + item.description;
    });
    return roleIntro('sales') + '\n\n' +
      '可以。我先按你这句话做一个快速分流，当前更接近「' + service.name + '」。\n\n' +
      '五档套餐是：\n' + lines.join('\n') + '\n\n' +
      '如果你已经确定要买，我可以下一步直接给你付款开通流程。你回复「购买推荐方案」即可。\n\n' +
      '如果你还不确定，我建议先回复「开始诊断」，我会用 9 个问题帮你判断，不会一上来推高价档。';
  }

  function answerHumanHandoff(profile, topic, text) {
    const recommendation = profile.sales?.recommendation || profile.suggestedPath || '待人工确认';
    return '可以，我现在把你转入人工跟进路径。\n\n' +
      '给人工看的摘要：\n' +
      '1. 当前议题：' + (topic?.label || profile.topic || '待识别') + '\n' +
      '2. 用户原话：' + text + '\n' +
      '3. 当前建议路径：' + recommendation + '\n' +
      '4. 需要人工确认：议题是否适合溯光、是否需要真人咨询、推荐档位是否匹配、是否存在医疗/危机/法律/投资等边界。\n\n' +
      '你现在可以在右侧「保存预约意向」里填称呼、微信/邮箱/电话和想聊的问题。保存后，这条线索会进入本地跟进队列，也可以导出给人工处理。\n\n' +
      '正式上线时，这一步建议接入企业微信/个人微信二维码、CRM 或自动通知。当前 MVP 先完成线索保存和人工摘要。';
  }

  function answerStartPaidService(profile, text) {
    const suggested = profile.suggestedPath || '';
    const usableSuggested = /元|计划|年卡|重建|服务|协议/.test(suggested) ? suggested : '';
    const planName = profile.sales?.recommendation || usableSuggested || profile.service?.plan || '溯光 AI 陪伴服务';
    const focus = text
      .replace(/已付款|付款了|付好了|开始服务|直接开始|开通了|我买了|买好了/g, '')
      .replace(/[，,。.\s]/g, '')
      .trim();
    return '好，服务已进入「' + planName + '」模式。\n\n' +
      '从现在开始，我不再按售前 12 步推进，也不再继续做购买引导；我们直接进入第一次服务。\n\n' +
      '第一步，我先帮你把当下最悬着的事情落下来。' +
      (focus ? '\n\n我先记录你的当前焦点：' + focus : '') +
      '\n\n请你直接发我一句话：现在最压在你心上的那件事是什么？如果说不清，也可以只发几个词。我会按「看见情绪 → 找到渴望 → 松动旧结构 → 做出一个小行动」陪你往下走。';
  }

  function findExample(roleId, text) {
    return examples().find((item) => {
      return item.role === roleId && item.user.split(/[，。？?]/).some((part) => part && text.includes(part.slice(0, 4)));
    });
  }

  function roleIntro(roleId) {
    const role = roles()[roleId];
    return '【' + role.label + '】' + role.opening;
  }

  function answerAsSupport(text, topic, service, role) {
    const matchedFaq = findFaq(text);
    const base = matchedFaq ? matchedFaq.a : '你可以先在页面右侧保存预约意向，留下称呼、联系方式和想聊的问题。正式上线后，这里会接入表单、CRM 或人工微信跟进。';
    return roleIntro(role.id) + '\n\n' + base + '\n\n如果你还不确定选哪项服务，我可以继续帮你做一次简单分流：你现在更想了解价格/流程，还是想判断自己适合哪条路径？';
  }

  function answerInfoQuestion(text, role) {
    const matchedFaq = findFaq(text);
    if (matchedFaq) {
      return roleIntro(role.id) + '\n\n' + matchedFaq.a + '\n\n如果你愿意，我可以继续帮你做路线匹配，或者直接带你开始售前诊断。';
    }

    const matchedService = findServiceInfo(text);
    if (matchedService) {
      const includes = matchedService.includes?.length ? '\n包含：' + matchedService.includes.join('、') : '';
      return roleIntro(role.id) + '\n\n' +
        '「' + matchedService.name + '」适合这样的人：' + (matchedService.subtitle || matchedService.description || '需要先确认议题和服务边界的人。') + '\n' +
        '价格：' + (matchedService.price || '待确认') + '\n' +
        '有效期/周期：' + (matchedService.duration || '待确认') + '\n' +
        '你会得到：' + (matchedService.outcome || matchedService.value || '一次更清晰的服务路径判断。') +
        includes +
        '\n\n如果你不确定是否适合这个档位，可以回复“开始诊断”，我会按售前流程继续问你。';
    }
    return '';
  }

  function answerAsSales(text, topic, service, role) {
    const objection = findSalesObjection(text);
    if (objection) return roleIntro(role.id) + '\n\n' + objection.answer + '\n\n如果你愿意，我们可以继续用售前诊断，把适不适合先看清楚。';

    if (/价格|多少钱|费用/.test(text)) {
      const lines = Object.values(sales().services).map((item) => {
        return '「' + item.name + '」：' + item.price + '，' + item.duration;
      });
      return roleIntro(role.id) + '\n\n目前可以先参考：\n' + lines.join('\n') + '\n\n价格只是最后一步，前面更重要的是判断你适不适合、需要轻方案还是深方案。';
    }

    if (/服务|有哪些|介绍|产品/.test(text)) {
      const lines = Object.values(sales().services).map((item) => {
        return '「' + item.name + '」：' + item.description;
      });
      return roleIntro(role.id) + '\n\n溯光现在可以分成这几条路径：\n' + lines.join('\n') + '\n\n如果你愿意，我可以用 9 个问题帮你做一次售前诊断。';
    }

    return roleIntro(role.id) + '\n\n我会用 9 个问题帮你判断适配度：先了解你是谁、现在卡在哪里、影响有多大、你想去哪里、试过什么，以及你现在愿不愿意投入改变。\n\n' + sales().questions[0].question;
  }

  function answerAsTherapist(text, topic, service, role) {
    return roleIntro(role.id) + '\n\n' + topic.response +
      '\n\n我们先走一个简版咨询流程：\n' +
      '1. 看见情绪：这件事里最重的感受是什么？\n' +
      '2. 找到渴望：你真正想守住或长出的是什么？\n' +
      '3. 松动旧结构：你习惯性的旧反应是什么？\n' +
      '4. 落到行动：今天能做的一个最小动作是什么？\n\n' +
      '先从第一步开始：' + topic.question +
      '\n\n如果你想做练习，可以直接说「做潜意识练习」。我会先确认安全环境，再给你简版引导。';
  }

  function answer(text, profile = initialProfile(), requestedRole) {
    const safety = detectSafety(text);
    const explicitRole = /心理咨询师|心理咨询|潜意识|冥想|内在小孩|命运交还|金钱能量|理想场景|SATS|sats|肯定语/.test(text)
      ? 'therapist'
      : null;
    const roleId = explicitRole || requestedRole || detectRole(text, safety);
    const role = roles()[roleId];
    if (safety === 'crisis') {
      return {
        profile: { ...profile, role: 'therapist', intensity: '需要立即支持', suggestedPath: '联系当地紧急支持资源' },
        reply: '我很认真地接住这句话。现在最重要的不是独自分析，而是尽快联系身边可信任的人，或拨打当地紧急救助电话。如果你在美国，可以联系 988 危机热线。溯光 Agent 不能处理危机干预，但你值得立刻得到真实的人类支持。'
      };
    }
    if (safety === 'medical') {
      return {
        profile: { ...profile, role: 'therapist', topic: '身心健康', suggestedPath: '专业医疗意见 + 溯光辅助梳理' },
        reply: '涉及诊断、用药或治疗方案时，我不能替代医生判断。我们可以一起整理你要带给专业人士的信息：症状持续多久、触发因素、已尝试的方法，以及你最担心的部分。'
      };
    }
    if (safety === 'investment') {
      return {
        profile: { ...profile, role: 'sales', topic: '财富关系', suggestedPath: '风险边界梳理' },
        reply: '我不能给出具体买卖建议，也不会承诺收益。更适合先看：你现在的现金流、风险承受能力、为什么急着要一个确定答案，以及这个决策背后的安全感需求。'
      };
    }

    const topicKey = detectTopic(text);
    const topic = knowledge().topics[topicKey];
    const currentIntent = detectIntent(text);

    if (/已付款|付款了|付好了|开始服务|直接开始|开通了|我买了|买好了/.test(text)) {
      const suggested = profile.suggestedPath || '';
      const usableSuggested = /元|计划|年卡|重建|服务|协议/.test(suggested) ? suggested : '';
      const planName = profile.sales?.recommendation || usableSuggested || profile.service?.plan || '溯光 AI 陪伴服务';
      return {
        profile: {
          ...profile,
          role: 'therapist',
          topic: topic.label,
          intent: '已购服务 / 正式陪伴',
          suggestedPath: planName,
          sales: {
            ...(profile.sales || initialProfile().sales),
            active: false,
            stage: '服务中',
            playbookStep: 0,
            playbookLabel: '已开通服务'
          },
          service: {
            active: true,
            plan: planName,
            startedAt: new Date().toISOString(),
            currentFocus: text
          }
        },
        reply: answerStartPaidService(profile, text),
        role: roles().therapist
      };
    }

    if (/转人工|人工咨询|真人咨询|联系人工|人工跟进|加微信|微信/.test(text)) {
      return {
        profile: {
          ...profile,
          role: 'support',
          topic: topic.label,
          intensity: detectIntensity(text),
          intent: '转人工咨询',
          suggestedPath: '转人工咨询 / 人工确认适配',
          sales: {
            ...(profile.sales || initialProfile().sales),
            active: false
          }
        },
        reply: answerHumanHandoff(profile, topic, text),
        role: roles().support
      };
    }

    if (/选择套餐|选套餐|推荐套餐|下单|怎么下单|引导下单/.test(text) && !/已付款|付款了|付好了|开始服务|开通了/.test(text)) {
      return {
        profile: {
          ...profile,
          role: 'sales',
          topic: topic.label,
          intensity: detectIntensity(text),
          intent: '购买 / 套餐选择',
          suggestedPath: '套餐选择中'
        },
        reply: answerPackageChoice(profile, text),
        service: matchSalesService(profile.sales?.data || {}, text),
        role: roles().sales
      };
    }

    if (profile.service?.active) {
      return {
        profile: {
          ...profile,
          role: 'therapist',
          topic: topic.label,
          intent: '已购服务 / 正式陪伴',
          suggestedPath: profile.service.plan || profile.suggestedPath || '已开通服务',
          service: {
            ...profile.service,
            currentFocus: text
          }
        },
        reply: '我在。我们现在按已开通服务来处理，不走售前。\n\n' +
          topic.response + '\n\n' +
          '我先帮你把这句话落到五步法第一步：看见情绪。你现在这件事里，最重的感受更像是委屈、愤怒、害怕、无力，还是不知道该怎么办？',
        role: roles().therapist
      };
    }
    const exerciseReply = /潜意识|冥想|内在小孩|命运交还|金钱能量|理想场景|SATS|sats|肯定语|显化/.test(text)
      ? answerExerciseQuestion(text, roles().therapist)
      : '';
    if (exerciseReply) {
      return {
        profile: {
          ...profile,
          role: 'therapist',
          topic: topic.label,
          intensity: detectIntensity(text),
          intent: '潜意识练习 / 冥想引导',
          suggestedPath: '潜意识练习简版引导'
        },
        reply: exerciseReply,
        role: roles().therapist
      };
    }
    const infoReply = /档位|价格|费用|多少钱|有效期|适合谁|适合什么|区别|隐私|API Key|key|怎么开始|五步法|替代咨询|服务/.test(text)
      ? answerInfoQuestion(text, role)
      : '';
    if (infoReply && !profile.sales?.active) {
      return {
        profile: {
          ...profile,
          role: roleId,
          topic: topic.label,
          intensity: detectIntensity(text),
          intent: '了解服务 / FAQ',
          suggestedPath: '先了解服务边界'
        },
        reply: infoReply,
        role
      };
    }
    if (roleId === 'sales') {
      const currentProfile = {
        ...profile,
        role: roleId,
        topic: topic.label,
        intensity: detectIntensity(text),
        intent: currentIntent
      };
      if (/购买推荐方案|确认购买|我要购买|我要下单|付款开通|直接开通/.test(text)) {
        const service = matchService(currentProfile);
        return {
          profile: {
            ...currentProfile,
            suggestedPath: currentProfile.sales?.recommendation || service.name,
            sales: {
              ...currentProfile.sales,
              active: false,
              stage: '待付款',
              playbookStep: 12,
              playbookLabel: '付款开通'
            }
          },
          reply: answerPurchaseNextStep(currentProfile),
          service,
          role
        };
      }
      const service = matchService(currentProfile);
      if (/开始售前诊断|开始诊断|重新诊断|做诊断/.test(text)) {
        const freshProfile = {
          ...currentProfile,
          sales: {
            ...initialProfile().sales,
            active: false
          },
          service: {
            ...(currentProfile.service || initialProfile().service),
            active: false
          }
        };
        const flow = nextSalesQuestion(freshProfile, text);
        return {
          profile: {
            ...freshProfile,
            sales: flow.salesState,
            suggestedPath: '售前诊断中'
          },
          reply: flow.reply,
          service: flow.service,
          role
        };
      }
      if (/已付款|付款了|付好了|开始服务|直接开始|开通了|我买了|买好了/.test(text)) {
        const planName = currentProfile.sales?.recommendation || currentProfile.suggestedPath || service.name;
        return {
          profile: {
            ...currentProfile,
            intent: '已购服务 / 正式陪伴',
            suggestedPath: planName,
            sales: {
              ...currentProfile.sales,
              active: false,
              stage: '服务中',
              playbookStep: 0,
              playbookLabel: '已开通服务'
            },
            service: {
              active: true,
              plan: planName,
              startedAt: new Date().toISOString(),
              currentFocus: text
            }
          },
          reply: answerStartPaidService(currentProfile, text),
          service,
          role
        };
      }
      if (currentProfile.sales?.stage === '方案推荐' && /社群|1v1|一对一|交付|周期|多久|每天|对接|形式/.test(text)) {
        return {
          profile: {
            ...currentProfile,
            suggestedPath: currentProfile.sales.recommendation || '人工确认适配'
          },
          reply: answerSalesDelivery(currentProfile),
          service,
          role
        };
      }
      if (currentProfile.sales?.stage === '方案推荐' && /好|嗯|可以|预留|预约|联系|报名|下一步|愿意|就这个|购买|买|付款|付费|开通/.test(text)) {
        return {
          profile: {
            ...currentProfile,
            suggestedPath: currentProfile.sales.recommendation || '人工确认适配',
            sales: {
              ...currentProfile.sales,
              active: false,
              stage: '待付款',
              playbookStep: 12,
              playbookLabel: '付款开通'
            }
          },
          reply: answerPurchaseNextStep(currentProfile),
          service,
          role
        };
      }
      const shouldRunSalesFlow = currentProfile.sales?.active || /开始|诊断|帮我判断|适合|预约|咨询|卡|焦虑|问题|想解决/.test(text);
      if (!shouldRunSalesFlow) {
        const reply = answerAsSales(text, topic, service, role);
        return {
          profile: {
            ...currentProfile,
            suggestedPath: '售前答疑'
          },
          reply,
          service,
          role
        };
      }

      const flow = nextSalesQuestion(currentProfile, text);
      const suggestedPath = flow.service ? flow.service.name : '售前诊断中';
      return {
        profile: {
          ...currentProfile,
          sales: flow.salesState,
          suggestedPath
        },
        reply: flow.reply,
        service: flow.service,
        role
      };
    }

    const nextProfile = {
      role: roleId,
      topic: topic.label,
      intensity: detectIntensity(text),
      intent: detectIntent(text),
      suggestedPath: ''
    };
    const service = matchService(nextProfile);
    if (roleId === 'support') {
      nextProfile.suggestedPath = '客服答疑 / 预约入口';
    } else if (roleId === 'therapist') {
      nextProfile.suggestedPath = '心理咨询 / 五步法陪伴';
    } else {
      nextProfile.suggestedPath = service.name;
    }

    const matchedExample = findExample(roleId, text);
    let reply = '';
    if (roleId === 'support') reply = answerAsSupport(text, topic, service, role);
    if (roleId === 'sales') reply = answerAsSales(text, topic, service, role);
    if (roleId === 'therapist') reply = answerAsTherapist(text, topic, service, role);
    if (matchedExample) {
      reply += '\n\n参考类似情况，我会避免：' + matchedExample.avoid;
    }
    return { profile: nextProfile, reply, service, role };
  }

  function assess(formValues) {
    const service = brand().services.find((item) => {
      return item.bestFor.includes(formValues.need) || item.bestFor.includes(formValues.duration) || item.bestFor.includes(formValues.pain);
    }) || brand().services[0];
    const painMap = {
      energy: '身心能量正在被持续消耗',
      money: '财富关系和安全感正在互相牵动',
      relation: '关系边界需要被重新看见',
      direction: '人生方向需要一次诚实盘点'
    };
    return '你的初步状态是：' + painMap[formValues.pain] + '。建议先进入「' + service.name + '」。' + service.outcome;
  }

  return { initialProfile, answer, assess, detectRole };
})();
