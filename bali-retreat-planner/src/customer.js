import { createPlan, HOTEL_TIERS, QUARTERS, REGION_LABELS } from "./planner.js";

const customerForm = document.querySelector("#customerPlannerForm");
const customerProgramName = document.querySelector("#customerProgramName");
const customerProgramPromise = document.querySelector("#customerProgramPromise");
const customerPrice = document.querySelector("#customerPrice");
const customerRouteOutput = document.querySelector("#customerRouteOutput");
const customerItinerary = document.querySelector("#customerItinerary");

function getCustomerInput() {
  const formData = new FormData(customerForm);
  return {
    programType: formData.get("programType"),
    durationDays: Number(formData.get("durationDays")),
    hotelTier: formData.get("hotelTier"),
    quarter: formData.get("quarter"),
    travelers: 2,
  };
}

function renderCustomerPlan() {
  const plan = createPlan(getCustomerInput());
  customerProgramName.textContent = plan.commercial.packageName;
  customerProgramPromise.textContent = plan.commercial.positioning;
  customerPrice.textContent = plan.commercial.suggestedPrice;
  customerRouteOutput.innerHTML = renderCustomerRoute(plan);
  customerItinerary.innerHTML = renderCustomerItinerary(plan);
}

function renderCustomerRoute(plan) {
  const routePlaces = getRoutePlaces(plan);
  return `
    <div class="customer-route-summary">
      <article>
        <span>天数</span>
        <strong>${plan.durationDays}天${plan.durationDays - 1}晚</strong>
        <p>${HOTEL_TIERS[plan.hotelTier].name} · ${QUARTERS[plan.quarter].name}</p>
      </article>
      <article>
        <span>路线</span>
        <strong>${plan.route.map((step) => step.label).join(" → ")}</strong>
        <p>核心地点：${routePlaces.map((place) => place.name).join("、")}</p>
      </article>
      <article>
        <span>节奏</span>
        <strong>${getCustomerPace(plan)}</strong>
        <p>保留酒店恢复、自由整合和低刺激晚间安排。</p>
      </article>
    </div>
    <div class="customer-route-chain">
      ${plan.route
        .map(
          (step, index) => `
            <article>
              <b>${index + 1}</b>
              <strong>${step.label}</strong>
              <span>${step.nights}晚 · ${getRegionRole(step.region)}</span>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCustomerItinerary(plan) {
  return plan.days
    .map(
      (day) => `
        <article class="customer-day-card">
          <header>
            <span>Day ${day.day}</span>
            <strong>${escapeHtml(day.region)}</strong>
          </header>
          <h3>${escapeHtml(day.theme)}</h3>
          <p>${escapeHtml(day.detail)}</p>
          <div>
            <span>${getCustomerDayTag(day)}</span>
            <span>${getCustomerTransferNote(day)}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function getRoutePlaces(plan) {
  const routeRegions = new Set(plan.route.map((step) => step.region));
  const seen = new Set();
  return plan.selected
    .filter((place) => routeRegions.has(place.region))
    .filter((place) => {
      if (seen.has(place.id)) return false;
      seen.add(place.id);
      return true;
    })
    .slice(0, 8);
}

function getCustomerPace(plan) {
  if (plan.programType === "deep-healing" || plan.programType === "subconscious-healing") return "深度疗愈节奏";
  if (plan.programType === "sport-reset") return "轻运动恢复节奏";
  return "疗愈度假平衡节奏";
}

function getCustomerDayTag(day) {
  if (day.region === "返程") return "旅后整合";
  if (day.region === "选配") return "弹性安排";
  if (day.detail.includes("转场")) return "转场日";
  if (day.detail.includes("水疗") || day.detail.includes("SPA") || day.detail.includes("护理")) return "身体恢复";
  if (day.detail.includes("声音") || day.detail.includes("冥想") || day.detail.includes("潜意识")) return "向内探索";
  return "低负担体验";
}

function getCustomerTransferNote(day) {
  if (day.day === 1) return "含接机安排";
  if (day.region === "返程") return "含送机安排";
  if (day.region === "选配") return "按选配确认";
  return "专车/短接驳";
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
  return roles[region] || REGION_LABELS[region] || "定制体验";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

customerForm.addEventListener("input", renderCustomerPlan);
customerForm.addEventListener("change", renderCustomerPlan);

renderCustomerPlan();
