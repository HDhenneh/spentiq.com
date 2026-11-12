/*
 * SpentIQ engine: every calculation, in one place, with no network and no guessing.
 * Rates come from data/uk-rates-<year>.json and are passed in, so April's update is one file.
 * Works in the browser (window.SpentIQ) and in Node (require), so tests run on the same code the pages use.
 *
 * Method rule: simplify the presentation, never the maths silently. Every simplification is listed in `assumptions`.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SpentIQ = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const VERSION = "0.1.0";
  const r2 = (n) => Math.round(n * 100) / 100;

  // ---------- Income tax ----------
  // Personal allowance shrinks by £1 for every £2 of income over £100,000.
  function personalAllowance(income, R) {
    const { personalAllowance: pa, taperThreshold } = R.incomeTax;
    return Math.max(0, pa - Math.max(0, income - taperThreshold) / 2);
  }

  // Tax on a whole year's income, band by band.
  function incomeTax(income, R) {
    const pa = personalAllowance(income, R);
    const [basic, higher, additional] = R.incomeTax.bands;
    const taxable = Math.max(0, income - pa);
    const basicPart = Math.min(taxable, basic.width);
    // The higher band ends at a fixed total income (£125,140), where the allowance has fully tapered away.
    const higherTop = Math.max(0, higher.upTo - pa - basic.width);
    const higherPart = Math.min(Math.max(0, taxable - basic.width), higherTop);
    const additionalPart = Math.max(0, taxable - basic.width - higherTop);
    const byBand = [
      { band: basic.name, rate: basic.rate, amount: basicPart, tax: basicPart * basic.rate },
      { band: higher.name, rate: higher.rate, amount: higherPart, tax: higherPart * higher.rate },
      { band: additional.name, rate: additional.rate, amount: additionalPart, tax: additionalPart * additional.rate },
    ].filter((b) => b.amount > 0);
    return { personalAllowance: pa, taxable, total: r2(byBand.reduce((s, b) => s + b.tax, 0)), byBand };
  }

  // Extra income tax caused by self-employed profit on top of other income (a job uses the allowance first).
  function taxOnTop(profit, otherIncome, R) {
    return r2(incomeTax(otherIncome + profit, R).total - incomeTax(otherIncome, R).total);
  }

  // ---------- National Insurance for the self-employed ----------
  function class4NI(profit, R) {
    const { lowerProfitsLimit: lo, upperProfitsLimit: hi, mainRate, upperRate } = R.class4NI;
    const main = Math.max(0, Math.min(profit, hi) - lo);
    const upper = Math.max(0, profit - hi);
    return r2(main * mainRate + upper * upperRate);
  }

  // ---------- Vehicles ----------
  // HMRC's simplified mileage rate: meant to cover fuel, wear and tear, servicing and insurance.
  function mileageAllowance(milesPerYear, vehicle, R) {
    const m = R.mileage;
    if (vehicle === "car") return r2(Math.min(milesPerYear, 10000) * m.carOrVan.first10000 + Math.max(0, milesPerYear - 10000) * m.carOrVan.after);
    if (vehicle === "motorcycle") return r2(milesPerYear * m.motorcycle);
    if (vehicle === "bicycle") return r2(milesPerYear * m.bicycle);
    return 0;
  }

  // ---------- True Hourly Rate (gig and delivery) ----------
  /*
   * input (one typical week):
   *   earnings      total paid out by all apps, including tips (£)
   *   hours         hours logged in, INCLUDING waiting between jobs
   *   miles         business miles
   *   vehicle       "car" | "motorcycle" | "bicycle" | "none"
   *   costMethod    "mileage" (HMRC rate per mile) | "actual" (fuel you paid)
   *   fuel          weekly fuel (£), used when costMethod is "actual"
   *   otherCosts    other weekly costs: phone share, bag, parking, insurance top-up (£)
   *   weeksPerYear  weeks you work like this (default 48)
   *   otherIncome   yearly pay from a job, if any (£)
   */
  function trueHourly(input, R) {
    const W = input.weeksPerYear || 48;
    const earnings = +input.earnings || 0, hours = +input.hours || 0, miles = +input.miles || 0;
    const other = +input.otherCosts || 0, otherIncome = +input.otherIncome || 0;
    const usesMileage = input.costMethod !== "actual" && input.vehicle !== "none";

    const grossYear = earnings * W;
    const onFoot = input.vehicle === "none";
    const vehicleYear = onFoot ? 0 : usesMileage ? mileageAllowance(miles * W, input.vehicle, R) : (+input.fuel || 0) * W;
    const costsYear = vehicleYear + other * W;
    // If costs are tiny, the £1,000 trading allowance can be claimed instead (never both).
    const useTradingAllowance = costsYear < R.tradingAllowance && grossYear > 0;
    const deductYear = useTradingAllowance ? Math.min(R.tradingAllowance, grossYear) : costsYear;
    const profitYear = Math.max(0, grossYear - deductYear);

    const taxYear = taxOnTop(profitYear, otherIncome, R);
    const niYear = class4NI(profitYear, R);

    // Weekly view. The cost line is the cost actually used up, not what HMRC lets you deduct.
    const costsWeek = r2(costsYear / W);
    const taxWeek = r2(taxYear / W), niWeek = r2(niYear / W);
    const keepWeek = r2(earnings - costsWeek - taxWeek - niWeek);
    const per = (x) => (hours > 0 ? r2(x / hours) : null);

    const steps = [
      { label: "The apps paid you", amount: r2(earnings), note: `£${r2(earnings)} for ${hours} hours` },
      ...(onFoot ? [] : [{ label: usesMileage ? `Vehicle cost (${miles} miles at HMRC's rate)` : "Fuel", amount: -r2(vehicleYear / W), note: usesMileage ? "HMRC's mileage rate covers fuel, wear and tear, servicing and insurance" : "What you paid for fuel this week" }]),
      ...(other ? [{ label: "Other costs", amount: -r2(other), note: "Phone, bag, parking and similar" }] : []),
      { label: "Income tax to put aside", amount: -taxWeek, note: otherIncome ? "On top of your job, which uses your tax-free allowance first" : "After your £12,570 tax-free allowance" },
      { label: "National Insurance to put aside", amount: -niWeek, note: "Self-employed (Class 4) NI" },
      { label: "What you really keep", amount: keepWeek, total: true },
    ];

    const assumptions = [
      `You work like this for ${W} weeks a year. Tax depends on your whole year, so a quieter or busier year changes it.`,
      otherIncome ? `Your job pays £${otherIncome} a year and uses your tax-free allowance first.` : "This is your only income.",
      onFoot ? "You work on foot, so there are no vehicle costs." : usesMileage ? "Vehicle costs use HMRC's mileage rate (45p a mile for a car, 25p after 10,000 miles). Your real costs may be higher or lower." : "Vehicle costs are your fuel only. Wear and tear, servicing and insurance aren't included, so the real cost is higher.",
      useTradingAllowance ? "Your costs are under £1,000 a year, so we used the £1,000 trading allowance instead, which saves you more tax." : null,
      "Tax is shown as money to put aside each week. You actually pay it in one go through Self Assessment, possibly with payments on account.",
      "Not included: student loan repayments, VAT, pension contributions, Scotland's different income tax bands.",
    ].filter(Boolean);

    return {
      version: VERSION, taxYear: R.taxYear,
      perHour: { apps: per(earnings), true: per(keepWeek), livingWage: R.nationalLivingWage.hourly },
      week: { earnings: r2(earnings), costs: costsWeek, tax: taxWeek, ni: niWeek, keep: keepWeek, setAside: r2(taxWeek + niWeek) },
      year: { gross: r2(grossYear), costs: r2(costsYear), deducted: r2(deductYear), profit: r2(profitYear), tax: taxYear, ni: niYear },
      method: { usesMileage, useTradingAllowance },
      steps, assumptions,
    };
  }

  return { VERSION, personalAllowance, incomeTax, taxOnTop, class4NI, mileageAllowance, trueHourly };
});
