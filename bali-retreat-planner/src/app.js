import { createPlan, MODULES, HOTEL_TIERS, QUARTERS, REGION_LABELS, PLACES } from "./planner.js";

const form = document.querySelector("#plannerForm");
const programName = document.querySelector("#programName");
const programPromise = document.querySelector("#programPromise");
const priceRange = document.querySelector("#priceRange");
const profitRange = document.querySelector("#profitRange");
const profitDetail = document.querySelector("#profitDetail");
const routeEfficiency = document.querySelector("#routeEfficiency");
const routeEfficiencyDetail = document.querySelector("#routeEfficiencyDetail");
const mapOutput = document.querySelector("#mapOutput");
const routeOutput = document.querySelector("#routeOutput");
const planningStandardOutput = document.querySelector("#planningStandardOutput");
const timeline = document.querySelector("#timeline");
const commercialDetailsOutput = document.querySelector("#commercialDetailsOutput");
const activePlaceLibrary = document.querySelector("#activePlaceLibrary");
const selectedPlaces = document.querySelector("#selectedPlaces");
const excludedPlaces = document.querySelector("#excludedPlaces");
const quoteForm = document.querySelector("#quoteForm");
const quoteResult = document.querySelector("#quoteResult");

let currentPlan = null;

const REGION_MAP_POINTS = {
  airport: { label: "机场", lat: -8.7467, lng: 115.1668, x: 52, y: 74 },
  ubud: { label: "乌布", lat: -8.5069, lng: 115.2625, x: 52, y: 34 },
  tabanan: { label: "Tabanan", lat: -8.5445, lng: 115.1194, x: 37, y: 38 },
  seseh: { label: "Seseh", lat: -8.6478, lng: 115.1186, x: 42, y: 58 },
  canggu: { label: "Canggu", lat: -8.65, lng: 115.1385, x: 45, y: 62 },
  "nusa-dua": { label: "Nusa Dua", lat: -8.7981, lng: 115.2283, x: 64, y: 82 },
  uluwatu: { label: "Uluwatu", lat: -8.8291, lng: 115.0849, x: 38, y: 86 },
  sanur: { label: "Sanur", lat: -8.6936, lng: 115.2644, x: 61, y: 65 },
};

const PLACE_MAP_POINTS = {
  "yoga-barn": { x: 53, y: 36 },
  "bali-botanica": { x: 50, y: 33 },
  "pyramids-of-chi": { x: 51, y: 31 },
  "bali-pulina": { x: 57, y: 28 },
  "bayan-ancient-tree": { x: 34, y: 36 },
  udara: { x: 42, y: 57 },
  bynd: { x: 45, y: 62 },
  "grand-hyatt": { x: 64, y: 82 },
  "la-nusa-spa": { x: 63, y: 80 },
  "the-istana": { x: 38, y: 86 },
  "uluwatu-sunset": { x: 36, y: 84 },
  "liga-tennis-nusa-dua": { x: 65, y: 80 },
  "liga-tennis-umalas": { x: 46, y: 60 },
  "finns-tennis": { x: 44, y: 62 },
  "new-kuta-golf": { x: 39, y: 83 },
  "bukit-pandawa-golf": { x: 48, y: 86 },
};

const REGION_KEY_BY_LABEL = Object.fromEntries(Object.entries(REGION_LABELS).map(([key, label]) => [label, key]));

function getFormInput() {
  const formData = new FormData(form);
  const quoteData = quoteForm ? new FormData(quoteForm) : new FormData();
  return {
    modules: formData.getAll("modules"),
    hotelTier: formData.get("hotelTier"),
    quarter: formData.get("quarter"),
    durationDays: Number(formData.get("durationDays")),
    travelers: Number(quoteData.get("travelers") || 2),
  };
}

function renderPlan() {
  const plan = createPlan(getFormInput());
  currentPlan = plan;

  programName.textContent = plan.commercial.packageName;
  programPromise.textContent = plan.commercial.positioning;
  priceRange.textContent = plan.commercial.suggestedPrice;
  profitRange.textContent = `${formatMoney(plan.profitModel.perPersonProfit.low)}-${formatMoney(plan.profitModel.perPersonProfit.high)} /人`;
  profitDetail.textContent = `预计成本 ${formatMoney(plan.profitModel.perPersonCost)} /人，毛利率 ${plan.profitModel.margin.low}%-${plan.profitModel.margin.high}%。${plan.profitModel.warning}`;
  routeEfficiency.textContent = `${formatHours(plan.routeStats.totalMinutes)} 车程`;
  routeEfficiencyDetail.textContent = `${plan.commercial.seasonalNote}。AI 优化分：${plan.routeStats.optimizedScore}。`;

  planningStandardOutput.innerHTML = renderPlanningStandard(plan);
  mapOutput.innerHTML = renderMap(plan);

  routeOutput.innerHTML = plan.route
    .map(
      (step, index) => `
        <article class="route-step">
          <span>第 ${index + 1} 段</span>
          <strong>${step.label}</strong>
          <p>${step.nights} 晚 · ${getRegionRole(step.region)}</p>
          <small>${getRegionPlaces(plan, step.region).map((place) => place.name).join(" → ")}</small>
        </article>
      `,
    )
    .join("");

  timeline.innerHTML = plan.days
    .map(
      (day) => `
        <article class="day-card detail-day-card">
          <div class="day-meta">
            <span>Day ${day.day}</span>
            <strong>${day.region}</strong>
          </div>
          <h3>${day.theme}</h3>
          <div class="day-operation-row">
            <span>${getDayPace(day)}</span>
            <span>${getDayBookingStatus(day)}</span>
          </div>
          <p class="day-summary">${getDaySummary(day, plan)}</p>
          <div class="day-time-plan">
            ${renderDayTimePlan(day)}
          </div>
          <dl class="day-detail">
            <div><dt>上午</dt><dd>${getMorningPlan(day)}</dd></div>
            <div><dt>主体验</dt><dd>${day.detail}</dd></div>
            <div><dt>地点</dt><dd>${renderDayPlaces(day, plan)}</dd></div>
            <div><dt>接驳</dt><dd>${getTransferNote(day)}</dd></div>
            <div><dt>预约</dt><dd>${getAppointmentRule(day)}</dd></div>
            <div><dt>弹性</dt><dd>${getFlexRule(day)}</dd></div>
          </dl>
        </article>
      `,
    )
    .join("");

  commercialDetailsOutput.innerHTML = renderCommercialDetails(plan);
  activePlaceLibrary.innerHTML = renderActivePlaceLibrary(plan);

  selectedPlaces.innerHTML = plan.selected
    .slice(0, 8)
    .map(
      (place) => `
        <article class="place-card">
          <header>
            <strong>${place.name}</strong>
            <span class="tag">${place.status}</span>
          </header>
          <p>${REGION_LABELS[place.region] || place.region} · ${place.role}</p>
          <small>建议占用：${place.duration}</small>
        </article>
      `,
    )
    .join("");

  excludedPlaces.innerHTML = plan.excluded.length
    ? plan.excluded
        .map(
          (place) => `
            <article class="place-card">
              <header>
                <strong>${place.name}</strong>
                <span class="tag">选配</span>
              </header>
              <p>${place.reason}</p>
              <small>${REGION_LABELS[place.region] || place.region} · ${place.role}</small>
            </article>
          `,
        )
        .join("")
    : `<article class="place-card"><p>当前路线没有强制删除项。</p></article>`;
}

function renderCommercialDetails(plan) {
  const included = [
    `${plan.durationDays - 1} 晚${HOTEL_TIERS[plan.hotelTier].name}住宿参考预算`,
    "路线设计、每日节奏安排和车程控制",
    "核心疗愈/身体恢复/酒店活动的预约建议",
    "专车接送和跨区转场预算测算",
    "旅前偏好确认、酒店活动表复核和报价摘要",
  ];
  const excluded = [
    "国际机票、签证、个人购物和自由餐酒水",
    "酒店临时加购、房型升级、旺季强制晚餐",
    "客户临时私自新增地点产生的车辆和预约成本",
    "报价前未确认房态的酒店差价",
    "旅行保险：建议客户自行购买覆盖巴厘岛当地医疗、意外、延误和高风险活动的保险",
  ];
  const bookingNotes = [
    "酒店房态、免费课程、SPA 和车辆报价需要在付款前二次确认。",
    "免费课程只写入可利用窗口，不承诺每天固定有课。",
    "必要转场和预约时间由定制师锁定，其余时间保留弹性。",
    "停业、维修、天气、交通管制会触发同等级替代方案。",
  ];

  return `
    <div class="commercial-grid">
      <article class="commercial-card">
        <span>适合人群</span>
        <h3>高压恢复、疗愈体验和轻奢度假客群</h3>
        <p>适合希望有人控节奏、控酒店安全、控车程的人；不适合每天临时改目的地、追求打卡密度极高的游客。</p>
      </article>
      <article class="commercial-card">
        <span>费用包含</span>
        <ul>${included.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>
      <article class="commercial-card">
        <span>费用不含</span>
        <ul>${excluded.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>
      <article class="commercial-card">
        <span>预订须知</span>
        <ul>${bookingNotes.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>
    </div>
    <div class="price-composition">
      <div>
        <p class="eyebrow dark">价格构成</p>
        <h3>${plan.commercial.suggestedPrice}</h3>
        <p>以下为 MVP 估算，用于判断产品可售价格和毛利空间；正式报价以酒店、课程、车辆实时确认为准。</p>
      </div>
      <div class="cost-bars">
        ${renderCostBar("酒店住宿", plan.profitModel.breakdown.hotelTotal, plan.profitModel.perPersonCost)}
        ${renderCostBar("体验课程", plan.profitModel.breakdown.experiences, plan.profitModel.perPersonCost)}
        ${renderCostBar("车辆分摊", plan.profitModel.breakdown.vehicleShare, plan.profitModel.perPersonCost)}
        ${renderCostBar("定制服务", plan.profitModel.breakdown.conciergeShare, plan.profitModel.perPersonCost)}
        ${renderCostBar("保险", plan.profitModel.breakdown.insurance, plan.profitModel.perPersonCost, "客户自购")}
      </div>
      <aside>
        <strong>${formatMoney(plan.profitModel.perPersonCost)} /人</strong>
        <span>预计成本</span>
        <strong>${formatMoney(plan.profitModel.perPersonProfit.low)}-${formatMoney(plan.profitModel.perPersonProfit.high)} /人</strong>
        <span>预计毛利</span>
      </aside>
    </div>
    ${renderAdminCostDetails(plan)}
  `;
}

function renderCostBar(label, value, total, note = "") {
  const percent = Math.max(5, Math.min(100, Math.round((value / total) * 100)));
  return `
    <div class="cost-bar">
      <div>
        <span>${label}</span>
        <strong>${note || formatMoney(value)}</strong>
      </div>
      <i style="--bar-width: ${percent}%"></i>
    </div>
  `;
}

function renderActivePlaceLibrary(plan) {
  const routeRegions = plan.route.map((step) => step.region);
  const orderedRegions = [...routeRegions, ...Object.keys(REGION_LABELS).filter((region) => !routeRegions.includes(region))];
  const placesByRegion = orderedRegions
    .map((region) => ({
      region,
      places: PLACES.filter((place) => place.region === region),
    }))
    .filter((group) => group.places.length);

  return `
    <div class="active-place-summary">
      <article>
        <span>有效地点</span>
        <strong>${PLACES.length} 个</strong>
        <p>均为当前数据库内可用于排线、替换或报价复核的地点。</p>
      </article>
      <article>
        <span>当前动线区域</span>
        <strong>${routeRegions.map((region) => getRegionName(region)).join(" → ")}</strong>
        <p>优先沿这些区域内做同区替换，车程和体验节奏更稳定。</p>
      </article>
      <article>
        <span>调整方式</span>
        <strong>同区替换 / 跨区加点</strong>
        <p>同区调整优先；跨区调整需要重算车辆、预约和客户体力。</p>
      </article>
    </div>
    <div class="active-place-groups">
      ${placesByRegion.map((group) => renderPlaceRegionGroup(group, plan, routeRegions)).join("")}
    </div>
  `;
}

function renderPlaceRegionGroup(group, plan, routeRegions) {
  const isRouteRegion = routeRegions.includes(group.region);
  return `
    <article class="active-place-region">
      <header>
        <div>
          <span>${isRouteRegion ? "当前动线内" : "备选区域"}</span>
          <h3>${getRegionName(group.region)}</h3>
        </div>
        <strong>${group.places.length} 个地点</strong>
      </header>
      <div class="active-place-grid">
        ${group.places.map((place) => renderActivePlaceCard(place, plan, routeRegions)).join("")}
      </div>
    </article>
  `;
}

function renderActivePlaceCard(place, plan, routeRegions) {
  const status = getActivePlaceStatus(place, plan, routeRegions);
  return `
    <article class="active-place-card">
      <header>
        <strong>${escapeHtml(place.name)}</strong>
        <span class="place-status-pill ${status.className}">${status.label}</span>
      </header>
      <p>${REGION_LABELS[place.region] || place.region} · ${getPlaceTypeLabel(place.type)} · ${escapeHtml(place.duration)}</p>
      <small>${escapeHtml(place.role)}</small>
      <div>
        <b>调整建议</b>
        <span>${getPlaceAdjustmentAdvice(place, plan, routeRegions)}</span>
      </div>
      <a href="${getGoogleMapsSearchUrl(place.name, REGION_LABELS[place.region] || place.region)}" target="_blank" rel="noopener">查看地图</a>
    </article>
  `;
}

function getActivePlaceStatus(place, plan, routeRegions) {
  if (plan.excluded.some((item) => item.id === place.id)) return { label: "本线不建议", className: "is-excluded" };
  if (plan.selected.some((item) => item.id === place.id && item.status === "必去")) return { label: "主线必去", className: "is-core" };
  if (routeRegions.includes(place.region)) return { label: "动线内可调", className: "is-route" };
  return { label: "客户需求可加", className: "is-optional" };
}

function getPlaceAdjustmentAdvice(place, plan, routeRegions) {
  if (plan.excluded.some((item) => item.id === place.id)) return "当前产品主线不建议加入；除非客户明确提出，否则优先放入另一条产品线。";
  if (plan.selected.some((item) => item.id === place.id && item.status === "必去")) return "当前主线核心地点，调整前要确认是否会影响产品承诺和客户购买理由。";
  if (routeRegions.includes(place.region)) return "同区内可替换或追加，优先放在对应区域住宿日，通常不显著增加跨区车程。";
  return "可按客户兴趣加点，但属于跨区调整，需要重新确认车程、车辆费用、预约时间和体力负担。";
}

function getPlaceTypeLabel(type) {
  const labels = {
    yoga: "瑜伽",
    spa: "SPA",
    sound: "音疗",
    nature: "自然体验",
    detox: "排毒恢复",
    fitness: "健身",
    resort: "度假酒店",
    wellness: "水疗康养",
    sunset: "日落",
    tennis: "网球",
    golf: "高尔夫",
  };
  return labels[type] || "体验";
}

function renderAdminCostDetails(plan) {
  const travelers = Math.max(1, plan.travelers);
  const nights = plan.durationDays - 1;
  const hotelNames = plan.hotelMaterials?.length ? plan.hotelMaterials.map((hotel) => hotel.name).join(" / ") : "按路线区域二次匹配同级酒店";
  const vehicleGroupCost = plan.profitModel.breakdown.vehicleShare * travelers;
  const conciergeGroupCost = plan.profitModel.breakdown.conciergeShare * travelers;
  const vehicleDaily = Math.round(vehicleGroupCost / plan.durationDays);
  const selectedExperiences = getRoutePlaces(plan, plan.route.map((step) => step.region)).slice(0, 8);

  return `
    <section class="admin-cost-detail">
      <div class="section-heading compact">
        <p class="eyebrow dark">Internal Cost Desk</p>
        <h2>内部成本明细</h2>
        <p>以下用于主理人和老板端核价。正式报价前必须用酒店、课程、车辆供应商实时报价复核。</p>
      </div>
      <div class="admin-cost-grid">
        <article class="admin-cost-card">
          <span>酒店住宿</span>
          <h3>${escapeHtml(hotelNames)}</h3>
          <dl>
            <div><dt>参考预订价</dt><dd>${formatMoney(plan.profitModel.breakdown.hotelPerNight)} /晚/人预算</dd></div>
            <div><dt>${nights}晚合计</dt><dd>${formatMoney(plan.profitModel.breakdown.hotelTotal)} /人</dd></div>
            <div><dt>预订要求</dt><dd>${getHotelBookingWindow(plan)}，付款前复核房态、早餐、取消政策和旺季附加条款。</dd></div>
          </dl>
        </article>
        <article class="admin-cost-card">
          <span>体验课程</span>
          <h3>${formatMoney(plan.profitModel.breakdown.experiences)} /人预算</h3>
          <div class="experience-cost-list">
            ${selectedExperiences.map((place) => renderExperienceCostRow(place, plan)).join("")}
          </div>
        </article>
        <article class="admin-cost-card">
          <span>车辆费用</span>
          <h3>${formatMoney(vehicleDaily)} /天/团参考</h3>
          <dl>
            <div><dt>团组车辆预算</dt><dd>${formatMoney(vehicleGroupCost)}，已按 ${travelers} 人分摊。</dd></div>
            <div><dt>包含项目</dt><dd>司机、油费、基础停车等待、跨区转场沟通。</dd></div>
            <div><dt>报价要求</dt><dd>每日用车小时、跨区补差、夜间等待和临时加点必须提前确认。</dd></div>
          </dl>
        </article>
        <article class="admin-cost-card">
          <span>定制服务费</span>
          <h3>${formatMoney(conciergeGroupCost)} /团</h3>
          <dl>
            <div><dt>分摊方式</dt><dd>${formatMoney(plan.profitModel.breakdown.conciergeShare)} /人，计入服务与车辆调度成本。</dd></div>
            <div><dt>覆盖内容</dt><dd>路线设计、供应商确认、每日提醒、突发替代方案、旅后建议。</dd></div>
            <div><dt>保险处理</dt><dd>${escapeHtml(plan.profitModel.breakdown.insuranceNote)}</dd></div>
          </dl>
        </article>
      </div>
    </section>
  `;
}

function renderExperienceCostRow(place, plan) {
  return `
    <div>
      <strong>${escapeHtml(place.name)}</strong>
      <span>${formatMoney(getExperiencePriceEstimate(place, plan))} /人参考 · ${getExperienceBookingRule(place)}</span>
      <small>${getExperienceArrivalRule(place)}</small>
    </div>
  `;
}

function getHotelBookingWindow(plan) {
  if (plan.hotelTier === "cliffLuxury" || plan.quarter === "q3" || plan.quarter === "q4") return "建议提前 45-60 天锁房";
  return "建议提前 21-30 天锁房";
}

function getExperiencePriceEstimate(place, plan) {
  const baseByType = {
    yoga: 180,
    spa: 650,
    sound: 420,
    nature: 260,
    detox: 780,
    fitness: 220,
    resort: 0,
    wellness: 950,
    sunset: 120,
    tennis: 450,
    golf: 1200,
  };
  const base = baseByType[place.type] ?? 350;
  const multiplier = plan.quarter === "q3" || plan.quarter === "q4" ? 1.12 : 1;
  return Math.round((base * multiplier) / 10) * 10;
}

function getExperienceBookingRule(place) {
  if (place.type === "resort" || place.type === "sunset" || place.type === "nature") return "可随行程确认";
  if (place.type === "golf" || place.type === "tennis") return "提前 7-14 天预约场地";
  if (place.type === "spa" || place.type === "wellness" || place.type === "detox") return "提前 3-7 天预约档期";
  return "提前 2-5 天确认课程表";
}

function getExperienceArrivalRule(place) {
  if (place.type === "golf") return "建议提前 45 分钟到场，预留装备和换装时间。";
  if (place.type === "tennis") return "建议提前 20 分钟到场，确认球场和教练。";
  if (place.type === "spa" || place.type === "wellness" || place.type === "detox") return "建议提前 20-30 分钟到场，完成登记、换装和禁忌确认。";
  if (place.type === "sound" || place.type === "yoga") return "建议提前 15-20 分钟到场，避免迟到影响课程。";
  return "建议提前 10-15 分钟到场，按当天交通预留缓冲。";
}

function renderPlanningStandard(plan) {
  const routeRegions = plan.route.map((step) => step.region);
  const routePlaces = getRoutePlaces(plan, routeRegions);
  const activityCount = routePlaces.length;
  const hotelCount = plan.hotelMaterials?.length || 0;
  const serviceSteps = [
    ["01", "需求确认", "确认人数、预算、身心状态、不可接受项目和航班窗口。"],
    ["02", "方案生成", "输出地图动线、每日节奏、核心地点、接驳和报价区间。"],
    ["03", "资源复核", "复核酒店房态、活动表、SPA/课程档期、车辆报价和取消政策。"],
    ["04", "出行执行", "锁定预约清单、司机接送节点、每日提醒和旅后整合建议。"],
  ];
  const qualityItems = [
    { label: "动线完整度", value: `${routePlaces.length} 个主线地点`, note: "每个小地点已进入地图与 Google Maps 链路。" },
    { label: "转场强度", value: formatHours(plan.routeStats.totalMinutes), note: getRouteLoadNote(plan.routeStats.totalMinutes, plan.durationDays) },
    { label: "住宿资源", value: hotelCount ? `${hotelCount} 个酒店锚点` : "待人工匹配", note: HOTEL_TIERS[plan.hotelTier].name },
    { label: "体验资源", value: `${activityCount} 个体验点`, note: getPlanningStyle(plan) },
  ];
  const confirmItems = [
    "航班抵离时间与首末日接送窗口",
    "酒店房态、房型、早餐、取消政策和旺季附加条款",
    "酒店免费课程/活动表、SPA 档期和外部体验预约时间",
    "司机报价、跨区车程、雨季/旺季拥堵和当天替代路线",
  ];

  return `
    <div class="planning-dashboard">
      <article class="planning-brief">
        <div>
          <span>定制方案</span>
          <h3>${escapeHtml(plan.commercial.packageName)}</h3>
          <p>${escapeHtml(plan.commercial.positioning)}</p>
        </div>
        <div class="planning-tags">
          <span>${plan.durationDays}天${plan.durationDays - 1}晚</span>
          <span>${HOTEL_TIERS[plan.hotelTier].name}</span>
          <span>${QUARTERS[plan.quarter].name}</span>
          <span>${getPlanningStyle(plan)}</span>
        </div>
      </article>
      <div class="planning-quality-grid">
        ${qualityItems
          .map(
            (item) => `
              <article>
                <span>${item.label}</span>
                <strong>${item.value}</strong>
                <p>${item.note}</p>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="planning-route-strip">
        <div>
          <span>推荐动线</span>
          <strong>${routePlaces.map((place) => place.name).join(" → ") || routeRegions.map((region) => getRegionName(region)).join(" → ")}</strong>
        </div>
        <a href="${getGoogleMapsUrl(routeRegions, routePlaces)}" target="_blank" rel="noopener">打开地图</a>
      </div>
      <div class="service-board">
        <article>
          <span>服务流程</span>
          <div class="service-steps">
            ${serviceSteps
              .map(
                ([number, title, text]) => `
                  <div>
                    <b>${number}</b>
                    <strong>${title}</strong>
                    <p>${text}</p>
                  </div>
                `,
              )
              .join("")}
          </div>
        </article>
        <article>
          <span>报价前复核清单</span>
          <ul>${confirmItems.map((item) => `<li>${item}</li>`).join("")}</ul>
        </article>
      </div>
    </div>
  `;
}

function renderMap(plan) {
  const routeRegions = plan.route.map((step) => step.region);
  const routePlaces = getRoutePlaces(plan, routeRegions);
  const googleMapsUrl = getGoogleMapsUrl(routeRegions, routePlaces);
  const routePath = getRoutePath(routeRegions, routePlaces);

  return `
    <div class="map-card">
      <div class="bali-map" aria-label="巴厘岛路线示意图">
        <svg class="base-map" viewBox="0 0 100 100" aria-hidden="true">
          <rect class="sea" x="0" y="0" width="100" height="100" />
          <path class="land-main" d="M5,5 L82,5 C91,12 95,24 93,37 C91,52 78,61 77,73 C76,87 62,95 44,95 C25,94 11,86 7,72 C2,55 7,41 4,27 C2,17 2,9 5,5 Z" />
          <path class="land-peninsula" d="M48,68 C58,65 70,67 75,75 C82,85 74,94 61,97 C50,99 40,96 37,88 C34,80 40,72 48,68 Z" />
          <path class="land-east" d="M80,54 C88,53 96,57 100,66 L100,100 L80,100 C87,86 90,72 80,54 Z" />
          <path class="water-channel" d="M79,56 C85,69 85,84 78,97" />
          <path class="park" d="M42,9 C57,8 70,17 72,31 C61,29 50,27 39,31 C33,25 34,14 42,9 Z" />
          <path class="park" d="M19,48 C28,40 39,42 45,52 C37,57 26,59 19,48 Z" />
          <path class="road major" d="M52,34 C51,45 56,56 61,68 C64,78 63,88 57,95" />
          <path class="road major" d="M52,34 C43,42 39,50 41,62 C44,73 45,82 38,88" />
          <path class="road major" d="M61,68 C66,71 70,77 71,84" />
          <path class="road minor" d="M18,37 C29,35 38,37 52,34 C65,31 75,29 88,33" />
          <path class="road minor" d="M19,62 C31,59 45,62 61,68 C72,72 84,70 96,75" />
          <path class="road minor" d="M36,18 C42,26 48,29 52,34" />
          <path class="road minor" d="M46,73 C52,75 57,78 61,84" />
          <text class="map-label city" x="45" y="28">Ubud</text>
          <text class="map-label city subtle" x="45" y="63">Denpasar</text>
          <text class="map-label city" x="66" y="80">Nusa Dua</text>
          <text class="map-label city" x="27" y="91">Uluwatu</text>
          <text class="map-label small" x="32" y="57">Canggu</text>
          <text class="map-label small" x="69" y="60">Sanur</text>
          <text class="map-label small" x="14" y="35">Tabanan</text>
        </svg>
        <svg class="route-line" viewBox="0 0 100 100" aria-hidden="true">
          <path class="route-shadow" d="${routePath}" />
          <path class="route-main" d="${routePath}" />
          ${getRoutePathPoints(routeRegions, routePlaces)
            .map((point) => {
              return `<circle class="route-dot" cx="${point.x}" cy="${point.y}" r="1.2" />`;
            })
            .join("")}
        </svg>
        ${routeRegions
          .map((region, index) => {
            const point = REGION_MAP_POINTS[region];
            return `
              <button class="map-marker route-marker" type="button" data-region="${region}" style="left: ${point.x}%; top: ${point.y}%;">
                <span>${index + 1}</span>
                <strong>${point.label}</strong>
              </button>
            `;
          })
          .join("")}
        ${routePlaces
          .map((place, index) => {
            const point = PLACE_MAP_POINTS[place.id];
            return point
              ? `
                <a class="map-marker place-marker" href="${getGoogleMapsSearchUrl(place.name, REGION_LABELS[place.region] || place.region)}" target="_blank" rel="noopener" title="${escapeHtml(place.name)}" style="left: ${point.x}%; top: ${point.y}%;">
                  <span>${index + 1}</span>
                  <strong>${escapeHtml(place.name)}</strong>
                </a>
              `
              : "";
          })
          .join("")}
        <div class="map-trip-badge">
          <strong>${formatHours(plan.routeStats.totalMinutes)}</strong>
          <span>${routePlaces.map((place) => place.name).join(" → ") || routeRegions.map((region) => getRegionName(region)).join(" → ")}</span>
        </div>
        <div class="map-zoom-control" aria-hidden="true">
          <span>+</span>
          <span>-</span>
        </div>
      </div>
      <aside class="map-panel">
        <div>
          <p class="eyebrow dark">Google Maps Preview</p>
          <h3>${plan.commercial.packageName}</h3>
          <p>${routePlaces.map((place) => place.name).join(" → ") || routeRegions.map((region) => getRegionName(region)).join(" → ")}，总转场约 ${formatHours(plan.routeStats.totalMinutes)}。</p>
        </div>
        <a class="map-action" href="${googleMapsUrl}" target="_blank" rel="noopener">在 Google Maps 打开动线</a>
        <div class="map-region-detail" id="mapRegionDetail">
          ${renderMapOverview(plan, routePlaces)}
        </div>
      </aside>
    </div>
  `;
}

mapOutput.addEventListener("click", (event) => {
  const marker = event.target.closest("[data-region]");
  if (!marker || !currentPlan) return;
  const region = marker.dataset.region;
  mapOutput.querySelectorAll(".route-marker").forEach((item) => item.classList.toggle("is-active", item === marker));
  const target = mapOutput.querySelector("#mapRegionDetail");
  if (target) target.innerHTML = renderRegionDetail(currentPlan, region);
});

function renderMapOverview(plan, routePlaces) {
  const routeRegions = plan.route.map((step) => step.region);
  return `
    <div class="route-detail-overview">
      <div class="map-hint">
        <strong>动线明细</strong>
        <p>点击地图区域可查看单一区域详情；下方默认展示完整客户行程动线和转场时间。</p>
      </div>
      <div class="route-segment-list">
        ${routeRegions.map((region, index) => renderRouteSegment(plan, region, index, routeRegions)).join("")}
      </div>
      <div class="transfer-chain">
        <strong>转场时间</strong>
        ${plan.routeStats.legs.map((leg) => renderTransferLeg(leg)).join("")}
      </div>
    </div>
  `;
}

function renderRouteSegment(plan, region, index, routeRegions) {
  const days = plan.days.filter((day) => getDayRegionKey(day.region) === region);
  const places = getRegionPlaces(plan, region);
  const nextRegion = routeRegions[index + 1];
  const transfer = nextRegion ? getDisplayTravelMinutes(region, nextRegion) : null;

  return `
    <article class="route-segment-card">
      <header>
        <span>${index + 1}</span>
        <div>
          <strong>${getRegionName(region)}</strong>
          <small>${days.length ? days.map((day) => `Day ${day.day}`).join(" / ") : "选配"}${transfer ? ` · 下一站约 ${formatHours(transfer)}` : " · 收束段"}</small>
        </div>
      </header>
      <div class="segment-day-flow">
        ${
          days.length
            ? days
                .map(
                  (day) => `
                    <div>
                      <b>Day ${day.day}</b>
                      <span>${escapeHtml(day.theme)}</span>
                    </div>
                  `,
                )
                .join("")
            : `<div><b>选配</b><span>不作为主线住宿段</span></div>`
        }
      </div>
      <div class="segment-place-flow">
        ${places.map((place, placeIndex) => renderSegmentPlace(place, placeIndex, places)).join("")}
      </div>
    </article>
  `;
}

function renderSegmentPlace(place, index, places) {
  const next = places[index + 1];
  const nextMinutes = next ? getDisplayTravelMinutes(place.region, next.region) || 15 : null;
  return `
    <div class="segment-place-row">
      <div>
        <strong>${escapeHtml(place.name)}</strong>
        <span>${escapeHtml(place.duration)} · ${escapeHtml(place.role)}</span>
      </div>
      <a href="${getGoogleMapsSearchUrl(place.name, REGION_LABELS[place.region] || place.region)}" target="_blank" rel="noopener">浏览</a>
      ${next ? `<small>${nextMinutes ? formatHours(nextMinutes) : "同区短接驳"} 到下一点</small>` : `<small>本区域收束</small>`}
    </div>
  `;
}

function renderTransferLeg(leg) {
  return `
    <div class="transfer-leg-row">
      <span>${getRegionName(leg.from)} → ${getRegionName(leg.to)}</span>
      <strong>${formatHours(leg.minutes)}</strong>
    </div>
  `;
}

function renderRegionDetail(plan, region) {
  const days = plan.days.filter((day) => getDayRegionKey(day.region) === region);
  const places = getRegionPlaces(plan, region);
  const hotels = getRegionHotels(plan, region);
  return `
    <div class="region-detail">
      <span>${getRegionName(region)}</span>
      <h3>${getRegionName(region)} · ${days.length ? days.map((day) => `Day ${day.day}`).join(" / ") : "选配日"}</h3>
      <div class="region-day-list">
        ${
          days.length
            ? days
                .map(
                  (day) => `
                    <article>
                      <strong>Day ${day.day}｜${escapeHtml(day.theme)}</strong>
                      <p>${escapeHtml(day.detail)}</p>
                      <small>${getTransferNote(day)}</small>
                    </article>
                  `,
                )
                .join("")
            : `<article><strong>当前路线未安排住宿日</strong><p>可作为加购或替换点，不建议临时绕路。</p></article>`
        }
      </div>
      <div class="vehicle-rule-card">
        <strong>用车规则</strong>
        <p>必要转场和预约时间由定制师统一锁定；其余空档可弹性安排休息、酒店、散步或自由用餐。客户不可临时私自指定新增目的地，避免破坏预约、车程和疗愈节奏。</p>
      </div>
      <div class="map-place-list">
        ${places.length ? places.map((place) => renderMapPlaceCard(place)).join("") : `<article><strong>暂无主线地点</strong><p>该区域仅作为转场或住宿锚点。</p></article>`}
        ${hotels.map((hotel) => renderHotelPlaceCard(hotel)).join("")}
      </div>
    </div>
  `;
}

function renderMapPlaceCard(place) {
  return `
    <article>
      <strong>${escapeHtml(place.name)}</strong>
      <span>${REGION_LABELS[place.region] || place.region} · ${escapeHtml(place.duration)}</span>
      <p>${escapeHtml(place.role)}</p>
      <a href="${getGoogleMapsSearchUrl(place.name, REGION_LABELS[place.region] || place.region)}" target="_blank" rel="noopener">打开浏览</a>
    </article>
  `;
}

function renderHotelPlaceCard(hotel) {
  return `
    <article class="hotel-place-card">
      <strong>${escapeHtml(hotel.name)}</strong>
      <span>${REGION_LABELS[hotel.region] || hotel.region} · 住宿配套</span>
      <p>${escapeHtml(hotel.positioning)}</p>
      <div>
        <b>酒店配套</b>
        <small>${hotel.facilities.map((item) => escapeHtml(item)).join(" / ")}</small>
      </div>
      <div>
        <b>免费课程/活动</b>
        <small>${hotel.complimentary.map((item) => escapeHtml(item)).join(" ")}</small>
      </div>
      <p class="hotel-caveat">${escapeHtml(hotel.caveat)}</p>
      <a href="${hotel.source}" target="_blank" rel="noopener">查看酒店资料来源</a>
    </article>
  `;
}

function getRegionPlaces(plan, region) {
  const seen = new Set();
  return plan.selected
    .filter((place) => place.region === region)
    .filter((place) => {
      if (seen.has(place.id)) return false;
      seen.add(place.id);
      return true;
    });
}

function getRegionHotels(plan, region) {
  return (plan.hotelMaterials || []).filter((hotel) => hotel.region === region);
}

function getDisplayTravelMinutes(from, to) {
  if (from === to) return 15;
  return currentPlan?.routeStats?.legs?.find((leg) => leg.from === from && leg.to === to)?.minutes || null;
}

function getRoutePlaces(plan, routeRegions) {
  const seen = new Set();
  return routeRegions
    .flatMap((region) => getRegionPlaces(plan, region))
    .filter((place) => PLACE_MAP_POINTS[place.id])
    .filter((place) => {
      if (seen.has(place.id)) return false;
      seen.add(place.id);
      return true;
    });
}

function getRoutePolyline(routeRegions) {
  return routeRegions
    .map((region) => REGION_MAP_POINTS[region])
    .filter(Boolean)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

function getRoutePath(routeRegions, routePlaces = []) {
  const points = getRoutePathPoints(routeRegions, routePlaces);
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    const controlY = (previous.y + point.y) / 2 + (index % 2 === 0 ? -5 : 5);
    return `${path} Q ${controlX} ${controlY} ${point.x} ${point.y}`;
  }, "");
}

function getRoutePathPoints(routeRegions, routePlaces = []) {
  const placePoints = routePlaces.map((place) => PLACE_MAP_POINTS[place.id]).filter(Boolean);
  if (placePoints.length) return [REGION_MAP_POINTS.airport, ...placePoints, REGION_MAP_POINTS.airport];
  return routeRegions.map((region) => REGION_MAP_POINTS[region]).filter(Boolean);
}

function getGoogleMapsUrl(routeRegions, routePlaces = []) {
  const originPoint = REGION_MAP_POINTS.airport;
  const origin = `${originPoint.lat},${originPoint.lng}`;
  const destination = `${originPoint.lat},${originPoint.lng}`;
  const waypointValues = routePlaces.length
    ? routePlaces.map((place) => `${place.name} ${REGION_LABELS[place.region] || place.region} Bali`)
    : routeRegions.map((region) => {
        const point = REGION_MAP_POINTS[region];
        return `${point.lat},${point.lng}`;
      });
  const waypoints = waypointValues.join("|");
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function getGoogleMapsSearchUrl(name, region) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${region} Bali`)}`;
}

function formatHours(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} 分钟`;
  return rest ? `${hours}小时${rest}分钟` : `${hours}小时`;
}

function getRegionName(region) {
  if (region === "airport") return "机场";
  return REGION_LABELS[region] || region;
}

function getQuoteRouteText(plan) {
  const routeRegions = plan.route.map((step) => step.region);
  const routePlaces = getRoutePlaces(plan, routeRegions);
  return routePlaces.length ? routePlaces.map((place) => place.name).join(" → ") : plan.route.map((step) => step.label).join(" → ");
}

function getPlanningStyle(plan) {
  const moduleNames = plan.modules.length ? plan.modules.map((module) => MODULES[module].name) : [plan.program.name];
  if (moduleNames.length <= 2) return moduleNames.join(" + ");
  return `${moduleNames.slice(0, 2).join(" + ")}等`;
}

function getRouteLoadNote(totalMinutes, durationDays) {
  const average = totalMinutes / Math.max(1, durationDays);
  if (average <= 45) return "整体低负担，适合疗愈和度假恢复。";
  if (average <= 70) return "中等转场强度，需要保留每日缓冲。";
  return "转场偏重，报价前建议二次优化或增加住宿夜数。";
}

function getDayRegionKey(regionLabel) {
  return REGION_KEY_BY_LABEL[regionLabel] || regionLabel;
}

function getRegionRole(region) {
  const roles = {
    ubud: "雨林、瑜伽、音疗和身体修复",
    seseh: "海边排毒、声音和身体打开",
    canggu: "轻运动、社交和身体能量",
    "nusa-dua": "稳定、舒适、沙滩和度假恢复",
    uluwatu: "悬崖、日落、水疗和旅修收束",
    tabanan: "自然仪式和古树冥想",
  };
  return roles[region] || "定制体验";
}

function getDayPace(day) {
  if (day.region === "返程") return "送机缓冲";
  if (day.region === "选配") return "弹性选配";
  if (day.detail.includes("转场")) return "转场日";
  if (day.detail.includes("水疗") || day.detail.includes("SPA") || day.detail.includes("护理")) return "恢复日";
  if (day.detail.includes("声音") || day.detail.includes("冥想") || day.detail.includes("潜意识")) return "深度体验";
  return "轻节奏";
}

function getDayBookingStatus(day) {
  if (day.region === "返程") return "按航班倒推";
  if (day.region === "选配") return "确认后预约";
  if (day.detail.includes("自由")) return "半自由安排";
  return "需预约确认";
}

function renderDayTimePlan(day) {
  const slots = getDayTimeSlots(day);
  return slots
    .map(
      (slot) => `
        <div>
          <time>${slot.time}</time>
          <strong>${slot.title}</strong>
          <span>${slot.note}</span>
        </div>
      `,
    )
    .join("");
}

function getDayTimeSlots(day) {
  if (day.region === "返程") {
    return [
      { time: "08:00", title: "早餐与整理", note: "确认行李、护照、随身物品。" },
      { time: "10:30", title: "旅后整合", note: "输出 7 天练习和生活落地建议。" },
      { time: "按航班", title: "送机", note: "至少预留交通和机场缓冲。" },
    ];
  }
  if (day.region === "选配") {
    return [
      { time: "上午", title: "自由恢复", note: "不安排硬性早起。" },
      { time: "下午", title: "选配体验", note: "摄影、咨询、静默或酒店自由日。" },
      { time: "晚间", title: "休息", note: "避免追加高强度转场。" },
    ];
  }
  if (day.day === 1) {
    return [
      { time: "按航班", title: "机场接机", note: "司机举牌或定点集合。" },
      { time: "15:00", title: "入住与降速", note: "入住酒店，留出身体适应时间。" },
      { time: "18:30", title: "欢迎晚餐", note: "确认状态、禁忌和接下来节奏。" },
    ];
  }
  if (day.detail.includes("转场")) {
    return [
      { time: "09:00", title: "早餐退房", note: "行李交给司机，保留水和防晒。" },
      { time: "11:00", title: "跨区转场", note: "中途根据交通和体力安排休息。" },
      { time: "15:30", title: "入住/核心体验", note: "只锁定一个核心预约，避免过载。" },
    ];
  }
  return [
    { time: "08:30", title: "慢早餐", note: "不压缩晨间恢复窗口。" },
    { time: "10:30", title: "核心体验", note: "课程、SPA、音疗或自然体验。" },
    { time: "16:30", title: "自由整合", note: "酒店休息、散步、写作或低刺激晚餐。" },
  ];
}

form.addEventListener("input", renderPlan);
form.addEventListener("change", renderPlan);
quoteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const quoteData = new FormData(quoteForm);
  const name = quoteData.get("name") || "未填写";
  const contact = quoteData.get("contact") || "未填写";
  const travelers = quoteData.get("travelers");
  const travelMonth = quoteData.get("travelMonth") || "待定";
  const modules = currentPlan.modules.length ? currentPlan.modules.map((module) => MODULES[module].name).join("、") : "未选择";

  quoteResult.innerHTML = `
    <h3>报价摘要</h3>
    <dl>
      <div><dt>客户</dt><dd>${escapeHtml(name)}</dd></div>
      <div><dt>联系方式</dt><dd>${escapeHtml(contact)}</dd></div>
      <div><dt>人数</dt><dd>${travelers} 人</dd></div>
      <div><dt>出行时间</dt><dd>${escapeHtml(travelMonth)}</dd></div>
      <div><dt>定制模块</dt><dd>${modules}</dd></div>
      <div><dt>推荐路线</dt><dd>${currentPlan.commercial.packageName}</dd></div>
      <div><dt>天数</dt><dd>${currentPlan.durationDays} 天 ${currentPlan.durationDays - 1} 晚</dd></div>
      <div><dt>酒店档位</dt><dd>${HOTEL_TIERS[currentPlan.hotelTier].name}</dd></div>
      <div><dt>季度</dt><dd>${QUARTERS[currentPlan.quarter].name}</dd></div>
      <div><dt>动线</dt><dd>${getQuoteRouteText(currentPlan)}</dd></div>
      <div><dt>预计车程</dt><dd>${formatHours(currentPlan.routeStats.totalMinutes)}</dd></div>
      <div><dt>建议价格</dt><dd>${currentPlan.commercial.suggestedPrice}</dd></div>
      <div><dt>预计成本</dt><dd>${formatMoney(currentPlan.profitModel.perPersonCost)} /人，团组成本 ${formatMoney(currentPlan.profitModel.groupCost)}</dd></div>
      <div><dt>预计毛利</dt><dd>${formatMoney(currentPlan.profitModel.groupProfit.low)}-${formatMoney(currentPlan.profitModel.groupProfit.high)} /团</dd></div>
      <div><dt>毛利率</dt><dd>${currentPlan.profitModel.margin.low}%-${currentPlan.profitModel.margin.high}%</dd></div>
    </dl>
    <p class="quote-note">下一步需要人工确认酒店房态、课程时间、车辆报价和取消政策。</p>
  `;
});
quoteForm.addEventListener("input", renderPlan);
quoteForm.addEventListener("change", renderPlan);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getMorningPlan(day) {
  if (day.region === "返程") return "早餐、行李整理、旅后建议确认。";
  if (day.region === "选配") return "根据客户体力和航班时间安排。";
  if (day.day === 1) return "抵达巴厘岛，专车接机。";
  return "酒店早餐，预留慢启动时间。";
}

function getTransferNote(day) {
  if (day.day === 1) return "机场 → 首站酒店。";
  if (day.region === "返程") return "酒店 → 机场送机。";
  if (day.region === "选配") return "按最终加购项目确认车辆。";
  return "同区短接驳或跨区专车，实际以当天交通为准。";
}

function getDaySummary(day, plan) {
  const region = getDayRegionKey(day.region);
  const routeStep = plan.route.find((step) => step.region === region);
  if (day.region === "返程") return "完成旅后整合，保留充足送机缓冲。";
  if (day.region === "选配") return "用于延展体验或自由休息，不建议塞入高强度转场。";
  return `${day.region}住宿锚点${routeStep ? ` · ${routeStep.nights}晚段落` : ""}。当天以预约体验和低负担恢复为主。`;
}

function renderDayPlaces(day, plan) {
  const region = getDayRegionKey(day.region);
  const places = getRegionPlaces(plan, region).slice(0, 4);
  const hotels = getRegionHotels(plan, region);
  if (!places.length && !hotels.length) return "不安排额外固定地点，保留恢复和自由时间。";
  return `
    <ul class="day-place-list">
      ${places
        .map(
          (place) => `
            <li>
              <a href="${getGoogleMapsSearchUrl(place.name, REGION_LABELS[place.region] || place.region)}" target="_blank" rel="noopener">${escapeHtml(place.name)}</a>
              <small>${escapeHtml(place.role)} · ${escapeHtml(place.duration)}</small>
            </li>
          `,
        )
        .join("")}
      ${hotels
        .map(
          (hotel) => `
            <li class="day-hotel-detail">
              <a href="${hotel.source}" target="_blank" rel="noopener">${escapeHtml(hotel.name)} 住宿配套</a>
              <small>酒店配套：${hotel.facilities.map((item) => escapeHtml(item)).join(" / ")}</small>
              <small>免费课程/活动：${hotel.complimentary.map((item) => escapeHtml(item)).join(" ")}</small>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function getAppointmentRule(day) {
  if (day.region === "返程") return "送机时间按航班倒推，至少预留交通和机场缓冲。";
  if (day.region === "选配") return "选配项确认后再锁定预约时间。";
  if (day.detail.includes("转场")) return "跨区转场日只锁定退房、接车、入住和核心体验预约。";
  return "课程、SPA、音疗等需要准时到达；其余时间不做硬排。";
}

function getFlexRule(day) {
  if (day.region === "返程") return "不再新增远距离地点，避免影响航班。";
  return "除必要车程和预约时间外，可弹性安排酒店休息、自由餐、散步和低强度探索；不可临时私自指定新增目的地。";
}

function formatMoney(value) {
  return `¥${Number(value).toLocaleString("zh-CN")}`;
}

renderPlan();
