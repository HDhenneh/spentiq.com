// Known answers, worked by hand from GOV.UK rates for 2026/27. Run: node test/engine.test.js
const S = require("../engine/spentiq.js");
const R = require("../data/uk-rates-2026-27.json");
let fails = 0;
const eq = (label, got, want) => { const ok = Math.abs(got - want) < 0.01; if (!ok) fails++; console.log(`${ok ? "✓" : "✗"} ${label}: ${got}${ok ? "" : ` (want ${want})`}`); };

// Income tax
eq("tax on £12,570 (all tax-free)", S.incomeTax(12570, R).total, 0);
eq("tax on £20,000: (20,000-12,570)×20%", S.incomeTax(20000, R).total, 1486);
eq("tax on £55,000: 37,700×20% + 4,730×40%", S.incomeTax(55000, R).total, 9432);
eq("allowance at £110,000 tapers to £7,570", S.personalAllowance(110000, R), 7570);
eq("tax on £110,000: 37,700×20% + 64,730×40%", S.incomeTax(110000, R).total, 33432);
eq("allowance gone at £125,140", S.personalAllowance(125140, R), 0);
eq("tax on £150,000: 7,540 + 87,440×40% + 24,860×45%", S.incomeTax(150000, R).total, 7540 + 34976 + 11187);
// A job uses the allowance first
eq("£20k profit with no job: tax", S.taxOnTop(20000, 0, R), 1486);
eq("£10k profit on top of a £45k job: 5,270×20% + 4,730×40%", S.taxOnTop(10000, 45000, R), 1054 + 1892);
// Class 4 NI
eq("Class 4 on £12,000 (below the limit)", S.class4NI(12000, R), 0);
eq("Class 4 on £20,000: 7,430×6%", S.class4NI(20000, R), 445.8);
eq("Class 4 on £60,000: 37,700×6% + 9,730×2%", S.class4NI(60000, R), 2262 + 194.6);
// Mileage
eq("car 12,000 miles: 10,000×45p + 2,000×25p", S.mileageAllowance(12000, "car", R), 5000);
eq("motorcycle 5,000 miles ×24p", S.mileageAllowance(5000, "motorcycle", R), 1200);
eq("bicycle 3,000 miles ×20p", S.mileageAllowance(3000, "bicycle", R), 600);

// True Hourly: courier, £600/week, 45 hours, 250 miles by car, £10 other costs, 48 weeks, no job
// year: gross 28,800; miles 12,000 → £5,000; other £480; costs 5,480; profit 23,320
// tax (23,320-12,570)×20% = 2,150; Class 4 10,750×6% = 645
// week: costs 114.17, tax 44.79, NI 13.44 → keep 427.60 → £9.50/hr (apps say £13.33/hr)
const c = S.trueHourly({ earnings: 600, hours: 45, miles: 250, vehicle: "car", costMethod: "mileage", otherCosts: 10, weeksPerYear: 48 }, R);
eq("courier: yearly profit", c.year.profit, 23320);
eq("courier: yearly tax", c.year.tax, 2150);
eq("courier: yearly Class 4", c.year.ni, 645);
eq("courier: kept per week", c.week.keep, 427.6);
eq("courier: apps per hour", c.perHour.apps, 13.33);
eq("courier: true per hour", c.perHour.true, 9.5);
eq("courier: receipt adds up", c.steps.filter((s) => !s.total).reduce((a, s) => a + s.amount, 0), c.week.keep);

// Trading allowance: cyclist with tiny costs uses the £1,000 allowance instead
const b = S.trueHourly({ earnings: 300, hours: 25, miles: 0, vehicle: "bicycle", costMethod: "mileage", otherCosts: 5, weeksPerYear: 40 }, R);
eq("cyclist: trading allowance used", b.method.useTradingAllowance ? 1 : 0, 1);
eq("cyclist: deducted £1,000 not £200", b.year.deducted, 1000);

// On foot: no vehicle cost even if a fuel figure was left in the form. Costs £480/yr < £1,000 → trading allowance.
// profit 28,800-1,000 = 27,800; tax 15,230×20% = 3,046; Class 4 15,230×6% = 913.80; week: 600-10-63.46-19.04 = 507.50
const f = S.trueHourly({ earnings: 600, hours: 45, miles: 250, vehicle: "none", costMethod: "actual", fuel: 45, otherCosts: 10, weeksPerYear: 48 }, R);
eq("on foot: no vehicle cost", f.year.costs, 480);
eq("on foot: kept per week", f.week.keep, 507.5);
eq("on foot: receipt adds up", f.steps.filter((s) => !s.total).reduce((a, s) => a + s.amount, 0), f.week.keep);

// Checksistence: London renter. Daily = amount × per-year ÷ 365.
// hard: rent 1,200/mo 39.452 + council tax 150/mo 4.932 + energy 120/mo 3.945 + phone 40/mo 1.315 + insurance 25/mo 0.822
//       + minimum debt 100/mo 3.288 = 53.753; soft: food 60/wk 8.548; excluded: gym (ignored)
// baseline 62.301/day; take-home 2,400/mo = 78.904/day; hourly 28,800 ÷ (37.5 × 52) = 14.769; hours = 4.22; share 79%
const x = S.checksistence({ takeHomeMonthly: 2400, hoursPerWeek: 37.5, items: [
  { name: "Rent", amount: 1200, period: "month", kind: "hard" }, { name: "Council tax", amount: 150, period: "month", kind: "hard" },
  { name: "Energy", amount: 120, period: "month", kind: "hard" }, { name: "Phone", amount: 40, period: "month", kind: "hard" },
  { name: "Insurance", amount: 25, period: "month", kind: "hard" }, { name: "Minimum debt", amount: 100, period: "month", kind: "hard" },
  { name: "Basic food", amount: 60, period: "week", kind: "soft" }, { name: "Gym", amount: 35, period: "month", kind: "excluded" } ] });
eq("checksistence: rent per day", x.items[0].daily, 39.45);
eq("checksistence: hard per day", x.perDay.hard, 53.75);
eq("checksistence: soft per day", x.perDay.soft, 8.55);
eq("checksistence: baseline per day", x.perDay.baseline, 62.3);
eq("checksistence: hourly take-home", x.hourly, 14.77);
eq("checksistence: hours a day to exist", x.hoursToExist, 4.22);
eq("checksistence: share of income", x.shareOfIncome, 0.79);
eq("checksistence: left per day", x.perDay.left, 16.6);
eq("checksistence: no income given → no hours", S.checksistence({ items: [{ amount: 365, period: "year" }] }).hoursToExist == null ? 1 : 0, 1);
eq("checksistence: £365 a year = £1 a day", S.checksistence({ items: [{ amount: 365, period: "year" }] }).perDay.baseline, 1);

console.log(fails ? `\n${fails} failed` : "\nAll engine tests pass");
process.exit(fails ? 1 : 0);
