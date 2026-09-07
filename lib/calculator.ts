export type SalaryBasis = 'base' | 'package';
export type SuperMode = 'protected' | 'reduced' | 'manual';
export type HelpStatus = 'unknown' | 'none' | 'yes';
export type HospitalStatus = 'unknown' | 'covered' | 'not-covered';
export type HouseholdStatus = 'unknown' | 'single' | 'family';
export type RegistrationRegion = 'metro' | 'outer' | 'rural';

export type CalculatorInputs = {
  salary: number;
  salaryBasis: SalaryBasis;
  superRate: number;
  superMode: SuperMode;
  manualSuperLossAnnual: number;
  basePrice: number;
  vehicleExtras: number;
  lctValue: number;
  monthlyKm: number;
  termMonths: number;
  registrationRegion: RegistrationRegion;
  registrationFeeAnnual: number;
  tacChargeAnnual: number;
  plateFee: number;
  deliveryAndOther: number;
  loanDepositPercent: number;
  loanRate: number;
  loanUpfrontFee: number;
  loanMonthlyFee: number;
  loanBalloon: number;
  leaseRate: number;
  leaseAdminMonthly: number;
  leaseUpfrontOutOfPocket: number;
  leaseResidualPercent: number;
  vehicleGstPassedThrough: number;
  runningGstPassedThroughAnnual: number;
  postTaxContributionMonthly: number;
  electricityEfficiency: number;
  electricityPrice: number;
  freeChargingPercent: number;
  insuranceAnnual: number;
  maintenanceAnnual: number;
  tyreCostPerKm: number;
  parkingAndTollsAnnual: number;
  otherRunningAnnual: number;
  homeChargerUpfront: number;
  leasePackageEnergy: boolean;
  leasePackageRegistration: boolean;
  leasePackageInsurance: boolean;
  leasePackageMaintenance: boolean;
  leasePackageTyres: boolean;
  leasePackageParkingAndTolls: boolean;
  leasePackageOtherRunning: boolean;
  resalePercent: number;
  helpStatus: HelpStatus;
  hospitalStatus: HospitalStatus;
  householdStatus: HouseholdStatus;
  spouseIncomeForMls: number;
  spouseMlsSurchargeBase: number;
  dependantChildren: number;
};

export const VEHICLE_PRICES = {
  rwd: { label: 'Model Y Premium RWD', price: 58_900 },
  longRange: { label: 'Model Y Premium Long Range AWD', price: 68_900 },
  longWheelbase: { label: 'Model Y L Premium AWD', price: 74_900 },
  performance: { label: 'Model Y Performance AWD', price: 89_400 },
} as const;

export type VehicleVariant = keyof typeof VEHICLE_PRICES;

export const REGISTRATION_FEE_BY_REGION: Record<RegistrationRegion, number> = {
  metro: 352.7,
  outer: 352.7,
  rural: 352.7,
};

export const TAC_CHARGE_BY_REGION: Record<RegistrationRegion, number> = {
  metro: 606.1,
  outer: 544.5,
  rural: 471.9,
};

export const FUEL_EFFICIENT_LCT_THRESHOLD = 91_661;
export const CAR_LIMIT_2026_27 = 69_883;
export const MAX_VEHICLE_GST_CREDIT_2026_27 = CAR_LIMIT_2026_27 / 11;
export const SHORT_TERM_REGISTRATION_SERVICE_FEE = 2.7;

export function estimatedVehicleGstPassedThrough(vehicleValue: number) {
  return Math.min(
    Math.max(0, finite(vehicleValue)) / 11,
    MAX_VEHICLE_GST_CREDIT_2026_27,
  );
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  salary: 160_000,
  salaryBasis: 'base',
  superRate: 17,
  superMode: 'protected',
  manualSuperLossAnnual: 0,
  basePrice: VEHICLE_PRICES.rwd.price,
  vehicleExtras: 0,
  lctValue: VEHICLE_PRICES.rwd.price,
  monthlyKm: 1_250,
  termMonths: 36,
  registrationRegion: 'metro',
  registrationFeeAnnual: REGISTRATION_FEE_BY_REGION.metro,
  tacChargeAnnual: TAC_CHARGE_BY_REGION.metro,
  plateFee: 44.2,
  deliveryAndOther: 0,
  loanDepositPercent: 10,
  loanRate: 7,
  loanUpfrontFee: 0,
  loanMonthlyFee: 0,
  loanBalloon: 0,
  leaseRate: 8,
  leaseAdminMonthly: 30,
  leaseUpfrontOutOfPocket: 0,
  leaseResidualPercent: 46.88,
  vehicleGstPassedThrough: estimatedVehicleGstPassedThrough(
    VEHICLE_PRICES.rwd.price,
  ),
  runningGstPassedThroughAnnual: 0,
  postTaxContributionMonthly: 0,
  electricityEfficiency: 16.5,
  electricityPrice: 0.3,
  freeChargingPercent: 0,
  insuranceAnnual: 2_000,
  maintenanceAnnual: 300,
  tyreCostPerKm: 0.025,
  parkingAndTollsAnnual: 0,
  otherRunningAnnual: 0,
  homeChargerUpfront: 0,
  leasePackageEnergy: true,
  leasePackageRegistration: true,
  leasePackageInsurance: true,
  leasePackageMaintenance: true,
  leasePackageTyres: true,
  leasePackageParkingAndTolls: false,
  leasePackageOtherRunning: false,
  resalePercent: 55,
  helpStatus: 'unknown',
  hospitalStatus: 'unknown',
  householdStatus: 'unknown',
  spouseIncomeForMls: 0,
  spouseMlsSurchargeBase: 0,
  dependantChildren: 0,
};

export function minimumResidualPercent(termMonths: number) {
  return Math.max(0, 75 - 9.375 * (termMonths / 12));
}

export function incomeTax2026_27(taxableIncome: number) {
  const income = Math.max(0, taxableIncome);
  if (income <= 18_200) return 0;
  if (income <= 45_000) return (income - 18_200) * 0.15;
  if (income <= 135_000) return 4_020 + (income - 45_000) * 0.3;
  if (income <= 190_000) return 31_020 + (income - 135_000) * 0.37;
  return 51_370 + (income - 190_000) * 0.45;
}

export function helpRepayment2026_27(repaymentIncome: number) {
  const income = Math.max(0, repaymentIncome);
  if (income <= 69_528) return 0;
  if (income <= 129_716)
    return Math.min(income * 0.1, (income - 69_528) * 0.15);
  const lowerBand = (129_717 - 69_528) * 0.15;
  return Math.min(income * 0.1, lowerBand + (income - 129_717) * 0.17);
}

function singleMlsRate(incomeForSurcharge: number) {
  if (incomeForSurcharge <= 105_000) return 0;
  if (incomeForSurcharge <= 123_000) return 0.01;
  if (incomeForSurcharge <= 164_000) return 0.0125;
  return 0.015;
}

function familyMlsRate(
  combinedIncomeForSurcharge: number,
  dependantChildren: number,
) {
  const childAdjustment =
    Math.max(0, Math.floor(dependantChildren) - 1) * 1_500;
  if (combinedIncomeForSurcharge <= 210_000 + childAdjustment) return 0;
  if (combinedIncomeForSurcharge <= 246_000 + childAdjustment) return 0.01;
  if (combinedIncomeForSurcharge <= 328_000 + childAdjustment) return 0.0125;
  return 0.015;
}

const FAMILY_MLS_INDIVIDUAL_LOW_INCOME_THRESHOLD = 28_011;

function familyMlsAmount(
  incomeForSurchargePurposes: number,
  surchargeBase: number,
  rate: number,
) {
  if (
    incomeForSurchargePurposes <= FAMILY_MLS_INDIVIDUAL_LOW_INCOME_THRESHOLD
  ) {
    return 0;
  }
  return Math.max(0, surchargeBase) * rate;
}

function paymentWithBalloon(
  principal: number,
  annualRatePercent: number,
  months: number,
  balloon: number,
) {
  const n = Math.max(1, months);
  const r = Math.max(0, annualRatePercent) / 100 / 12;
  if (r === 0) return Math.max(0, principal - balloon) / n;
  const discountedBalloon = balloon / (1 + r) ** n;
  return Math.max(0, principal - discountedBalloon) * (r / (1 - (1 + r) ** -n));
}

function finite(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function calculate(inputs: CalculatorInputs) {
  const termMonths = Math.max(1, finite(inputs.termMonths, 36));
  const years = termMonths / 12;
  const basePrice = Math.max(0, finite(inputs.basePrice));
  const vehicleExtras = Math.max(0, finite(inputs.vehicleExtras));
  const vehicleValue = basePrice + vehicleExtras;
  const superRate = Math.max(0, finite(inputs.superRate)) / 100;
  const baseSalary =
    inputs.salaryBasis === 'package'
      ? Math.max(0, finite(inputs.salary)) / (1 + superRate)
      : Math.max(0, finite(inputs.salary));

  const deliveryAndOther = Math.max(0, finite(inputs.deliveryAndOther));
  const dutiableValue = vehicleValue + deliveryAndOther;
  const motorDuty = Math.ceil(dutiableValue / 200) * 8.4;
  const registrationFeeAnnual = Math.max(
    0,
    finite(inputs.registrationFeeAnnual),
  );
  const tacChargeAnnual = Math.max(0, finite(inputs.tacChargeAnnual));
  const plateFee = Math.max(0, finite(inputs.plateFee));
  const firstYearRegistrationTotal = registrationFeeAnnual + tacChargeAnnual;
  const driveAway =
    vehicleValue +
    motorDuty +
    firstYearRegistrationTotal +
    plateFee +
    deliveryAndOther;

  const totalKm = Math.max(0, finite(inputs.monthlyKm)) * termMonths;
  const chargingFraction = Math.min(
    1,
    Math.max(0, finite(inputs.freeChargingPercent) / 100),
  );
  const energy =
    totalKm *
    (Math.max(0, finite(inputs.electricityEfficiency)) / 100) *
    Math.max(0, finite(inputs.electricityPrice)) *
    (1 - chargingFraction);
  const tyres = totalKm * Math.max(0, finite(inputs.tyreCostPerKm));
  const remainingRegistrationMonths = Math.max(0, termMonths - 12);
  const fullYearRenewalCount = Math.floor(remainingRegistrationMonths / 12);
  const partialRenewalMonths =
    remainingRegistrationMonths - fullYearRenewalCount * 12;
  const shortTermRenewalMonths = Math.ceil(partialRenewalMonths / 3) * 3;
  const shortTermRenewalPeriods =
    shortTermRenewalMonths === 9
      ? 2
      : shortTermRenewalMonths === 3 || shortTermRenewalMonths === 6
        ? 1
        : 0;
  const registrationRenewalCoverageMonths =
    fullYearRenewalCount * 12 + shortTermRenewalMonths;
  const shortTermRegistrationServiceFees =
    shortTermRenewalPeriods * SHORT_TERM_REGISTRATION_SERVICE_FEE;
  const registrations =
    (registrationRenewalCoverageMonths / 12) * firstYearRegistrationTotal +
    shortTermRegistrationServiceFees;
  const insurance = years * Math.max(0, finite(inputs.insuranceAnnual));
  const maintenance = years * Math.max(0, finite(inputs.maintenanceAnnual));
  const parkingAndTolls =
    years * Math.max(0, finite(inputs.parkingAndTollsAnnual));
  const otherRunning = years * Math.max(0, finite(inputs.otherRunningAnnual));
  const homeCharger = Math.max(0, finite(inputs.homeChargerUpfront));
  const runningTotal =
    energy +
    tyres +
    registrations +
    insurance +
    maintenance +
    parkingAndTolls +
    otherRunning +
    homeCharger;
  const marketValue =
    vehicleValue * (Math.max(0, finite(inputs.resalePercent)) / 100);

  const cashOutflow = driveAway + runningTotal;
  const cashEconomicCost = cashOutflow - marketValue;

  const loanDeposit =
    driveAway *
    (Math.min(100, Math.max(0, finite(inputs.loanDepositPercent))) / 100);
  const loanPrincipal = Math.max(0, driveAway - loanDeposit);
  const loanBalloon = Math.max(0, finite(inputs.loanBalloon));
  const loanPayment = paymentWithBalloon(
    loanPrincipal,
    inputs.loanRate,
    termMonths,
    loanBalloon,
  );
  const loanOutflow =
    loanDeposit +
    Math.max(0, finite(inputs.loanUpfrontFee)) +
    termMonths * (loanPayment + Math.max(0, finite(inputs.loanMonthlyFee))) +
    loanBalloon +
    runningTotal;
  const loanEconomicCost = loanOutflow - marketValue;

  const vehicleGstPassedThrough = Math.min(
    driveAway,
    Math.max(0, finite(inputs.vehicleGstPassedThrough)),
  );
  const financeBase = Math.max(0, driveAway - vehicleGstPassedThrough);
  const residualPercent =
    Math.max(0, finite(inputs.leaseResidualPercent)) / 100;
  const residualExGst =
    Math.max(0, vehicleValue - vehicleGstPassedThrough) * residualPercent;
  const residualPayable = residualExGst * 1.1;
  const leasePayment = paymentWithBalloon(
    financeBase,
    inputs.leaseRate,
    termMonths,
    residualExGst,
  );
  const leaseFinancePayments = leasePayment * termMonths;
  const leaseFinanceCharge = Math.max(
    0,
    leaseFinancePayments + residualExGst - financeBase,
  );
  const leaseAdminTotal =
    Math.max(0, finite(inputs.leaseAdminMonthly)) * termMonths;
  const leaseUpfrontOutOfPocket = Math.max(
    0,
    finite(inputs.leaseUpfrontOutOfPocket),
  );
  const packagedRunningGross =
    (inputs.leasePackageEnergy ? energy : 0) +
    (inputs.leasePackageRegistration ? registrations : 0) +
    (inputs.leasePackageInsurance ? insurance : 0) +
    (inputs.leasePackageMaintenance ? maintenance : 0) +
    (inputs.leasePackageTyres ? tyres : 0) +
    (inputs.leasePackageParkingAndTolls ? parkingAndTolls : 0) +
    (inputs.leasePackageOtherRunning ? otherRunning : 0);
  const outsidePackageRunning = Math.max(
    0,
    runningTotal - packagedRunningGross,
  );
  const runningGstPassedThrough = Math.min(
    packagedRunningGross,
    Math.max(0, finite(inputs.runningGstPassedThroughAnnual)) * years,
  );
  const packagedRunning = Math.max(
    0,
    packagedRunningGross - runningGstPassedThrough,
  );
  const preTaxMonthly =
    leasePayment +
    Math.max(0, finite(inputs.leaseAdminMonthly)) +
    packagedRunning / termMonths;
  const preTaxTotal = preTaxMonthly * termMonths;
  const preTaxAnnual = preTaxMonthly * 12;
  const postTaxTotal =
    Math.max(0, finite(inputs.postTaxContributionMonthly)) * termMonths;

  const baselineIncomeTaxAnnual = incomeTax2026_27(baseSalary);
  const baselineMedicareAnnual = baseSalary * 0.02;
  const leaseTaxableIncome = Math.max(0, baseSalary - preTaxAnnual);
  const leaseIncomeTaxAnnual = incomeTax2026_27(leaseTaxableIncome);
  const leaseMedicareAnnual = leaseTaxableIncome * 0.02;
  const incomeTaxSaved =
    (baselineIncomeTaxAnnual - leaseIncomeTaxAnnual) * years;
  const medicareSaved = (baselineMedicareAnnual - leaseMedicareAnnual) * years;

  const fbtEligible =
    Math.max(0, finite(inputs.lctValue)) < FUEL_EFFICIENT_LCT_THRESHOLD;
  const rfbaAnnual = fbtEligible ? vehicleValue * 0.2 * 1.8868 : 0;

  const helpBaseAnnual =
    inputs.helpStatus === 'yes' ? helpRepayment2026_27(baseSalary) : 0;
  const helpLeaseAnnual =
    inputs.helpStatus === 'yes'
      ? helpRepayment2026_27(leaseTaxableIncome + rfbaAnnual)
      : 0;
  const helpDelta = (helpLeaseAnnual - helpBaseAnnual) * years;

  let mlsDelta = 0;
  let userMlsDelta = 0;
  let spouseMlsDelta = 0;
  let mlsCalculable = false;
  if (
    inputs.hospitalStatus !== 'unknown' &&
    inputs.householdStatus !== 'unknown'
  ) {
    mlsCalculable = true;
    if (inputs.hospitalStatus === 'not-covered') {
      const leaseMlsIncome = leaseTaxableIncome + rfbaAnnual;
      const spouseIncome = Math.max(0, finite(inputs.spouseIncomeForMls));
      const spouseSurchargeBase = Math.max(
        0,
        finite(inputs.spouseMlsSurchargeBase),
      );
      const dependants = Math.max(0, finite(inputs.dependantChildren));
      const baseRate =
        inputs.householdStatus === 'family'
          ? familyMlsRate(baseSalary + spouseIncome, dependants)
          : singleMlsRate(baseSalary);
      const leaseRate =
        inputs.householdStatus === 'family'
          ? familyMlsRate(leaseMlsIncome + spouseIncome, dependants)
          : singleMlsRate(leaseMlsIncome);
      const baseUserMls =
        inputs.householdStatus === 'family'
          ? familyMlsAmount(baseSalary, baseSalary, baseRate)
          : baseSalary * baseRate;
      const leaseUserMls =
        inputs.householdStatus === 'family'
          ? familyMlsAmount(leaseMlsIncome, leaseMlsIncome, leaseRate)
          : leaseMlsIncome * leaseRate;
      userMlsDelta = (leaseUserMls - baseUserMls) * years;

      if (inputs.householdStatus === 'family') {
        const baseSpouseMls = familyMlsAmount(
          spouseIncome,
          spouseSurchargeBase,
          baseRate,
        );
        const leaseSpouseMls = familyMlsAmount(
          spouseIncome,
          spouseSurchargeBase,
          leaseRate,
        );
        spouseMlsDelta = (leaseSpouseMls - baseSpouseMls) * years;
      }

      mlsDelta = userMlsDelta + spouseMlsDelta;
    }
  }

  const grossSuperLoss =
    inputs.superMode === 'protected'
      ? 0
      : inputs.superMode === 'manual'
        ? Math.max(0, finite(inputs.manualSuperLossAnnual)) * years
        : preTaxTotal * superRate;
  const netSuperLoss = grossSuperLoss * 0.85;

  const takeHomeReduction =
    preTaxTotal + postTaxTotal - incomeTaxSaved - medicareSaved + mlsDelta;
  const leaseOutflowExHelp =
    takeHomeReduction + outsidePackageRunning + residualPayable;
  const leaseCostBeforeResale = leaseOutflowExHelp + netSuperLoss;
  const leaseEconomicCost = leaseCostBeforeResale - marketValue;

  const contractYearCount = Math.ceil(termMonths / 12);
  const monthlyLoanRate = Math.max(0, finite(inputs.loanRate)) / 100 / 12;
  let remainingLoanBalance = loanPrincipal;
  const annualCashflows = Array.from(
    { length: contractYearCount },
    (_, yearIndex) => {
      const elapsedMonths = yearIndex * 12;
      const months = Math.min(12, termMonths - elapsedMonths);
      const yearFraction = months / 12;
      const yearKm = Math.max(0, finite(inputs.monthlyKm)) * months;
      const yearEnergy =
        yearKm *
        (Math.max(0, finite(inputs.electricityEfficiency)) / 100) *
        Math.max(0, finite(inputs.electricityPrice)) *
        (1 - chargingFraction);
      const yearTyres = yearKm * Math.max(0, finite(inputs.tyreCostPerKm));
      const yearRegistration =
        yearIndex === 0
          ? 0
          : yearFraction * firstYearRegistrationTotal +
            (months === 12
              ? 0
              : (months <= 6 ? 1 : 2) * SHORT_TERM_REGISTRATION_SERVICE_FEE);
      const yearInsurance =
        yearFraction * Math.max(0, finite(inputs.insuranceAnnual));
      const yearMaintenance =
        yearFraction * Math.max(0, finite(inputs.maintenanceAnnual));
      const yearParkingAndTolls =
        yearFraction * Math.max(0, finite(inputs.parkingAndTollsAnnual));
      const yearOtherRunning =
        yearFraction * Math.max(0, finite(inputs.otherRunningAnnual));
      const yearHomeCharger = yearIndex === 0 ? homeCharger : 0;
      const yearRunningTotal =
        yearEnergy +
        yearTyres +
        yearRegistration +
        yearInsurance +
        yearMaintenance +
        yearParkingAndTolls +
        yearOtherRunning +
        yearHomeCharger;

      const yearPackagedRunningGross =
        (inputs.leasePackageEnergy ? yearEnergy : 0) +
        (inputs.leasePackageRegistration ? yearRegistration : 0) +
        (inputs.leasePackageInsurance ? yearInsurance : 0) +
        (inputs.leasePackageMaintenance ? yearMaintenance : 0) +
        (inputs.leasePackageTyres ? yearTyres : 0) +
        (inputs.leasePackageParkingAndTolls ? yearParkingAndTolls : 0) +
        (inputs.leasePackageOtherRunning ? yearOtherRunning : 0);
      const yearRunningGstPassedThrough = Math.min(
        yearPackagedRunningGross,
        Math.max(0, finite(inputs.runningGstPassedThroughAnnual)) *
          yearFraction,
      );
      const yearPackagedRunningPreTax = Math.max(
        0,
        yearPackagedRunningGross - yearRunningGstPassedThrough,
      );
      const yearOutsidePackageRunning = Math.max(
        0,
        yearRunningTotal - yearPackagedRunningGross,
      );

      let yearLoanInterest = 0;
      let yearLoanPrincipal = 0;
      for (let month = 0; month < months; month += 1) {
        const interest = remainingLoanBalance * monthlyLoanRate;
        const principalPaid = Math.min(
          remainingLoanBalance,
          Math.max(0, loanPayment - interest),
        );
        yearLoanInterest += interest;
        yearLoanPrincipal += principalPaid;
        remainingLoanBalance = Math.max(
          0,
          remainingLoanBalance - principalPaid,
        );
      }
      const yearLoanPayments = loanPayment * months;
      const yearLoanFees = Math.max(0, finite(inputs.loanMonthlyFee)) * months;

      const yearFinanceAndAdminPreTax =
        (leasePayment + Math.max(0, finite(inputs.leaseAdminMonthly))) * months;
      const yearLeasePreTax =
        yearFinanceAndAdminPreTax + yearPackagedRunningPreTax;
      const yearLeasePostTax =
        Math.max(0, finite(inputs.postTaxContributionMonthly)) * months;
      const annualise = (value: number) =>
        yearFraction > 0 ? value / yearFraction : 0;
      const taxAndMedicareSavedFor = (annualPreTax: number) => {
        const taxableIncome = Math.max(0, baseSalary - annualPreTax);
        return (
          baselineIncomeTaxAnnual -
          incomeTax2026_27(taxableIncome) +
          (baselineMedicareAnnual - taxableIncome * 0.02)
        );
      };
      const yearTaxAndMedicareSaved =
        taxAndMedicareSavedFor(annualise(yearLeasePreTax)) * yearFraction;
      const taxSavedWithoutPackagedRunning =
        taxAndMedicareSavedFor(annualise(yearFinanceAndAdminPreTax)) *
        yearFraction;
      const yearRunningTaxSaved = Math.max(
        0,
        yearTaxAndMedicareSaved - taxSavedWithoutPackagedRunning,
      );
      const yearMlsDelta = years > 0 ? (mlsDelta / years) * yearFraction : 0;
      const yearHelpDelta = years > 0 ? (helpDelta / years) * yearFraction : 0;
      const yearLeaseTakeHomeImpact =
        yearLeasePreTax +
        yearLeasePostTax -
        yearTaxAndMedicareSaved +
        yearMlsDelta +
        yearHelpDelta;
      const yearLeaseCashImpact =
        yearLeaseTakeHomeImpact + yearOutsidePackageRunning;
      const yearLeaseRunningAfterTaxEquivalent =
        yearPackagedRunningPreTax -
        yearRunningTaxSaved +
        yearOutsidePackageRunning;
      const yearLeaseNetSuperLoss =
        inputs.superMode === 'protected'
          ? 0
          : inputs.superMode === 'manual'
            ? Math.max(0, finite(inputs.manualSuperLossAnnual)) *
              yearFraction *
              0.85
            : yearLeasePreTax * superRate * 0.85;

      return {
        year: yearIndex + 1,
        months,
        runningTotal: yearRunningTotal,
        cashCashImpact: yearRunningTotal,
        loanCashImpact: yearLoanPayments + yearLoanFees + yearRunningTotal,
        loanPayments: yearLoanPayments,
        loanInterest: yearLoanInterest,
        loanPrincipal: yearLoanPrincipal,
        loanFees: yearLoanFees,
        leaseCashImpact: yearLeaseCashImpact,
        leaseTakeHomeImpact: yearLeaseTakeHomeImpact,
        leaseFinanceAndAdminPreTax: yearFinanceAndAdminPreTax,
        leasePackagedRunningGross: yearPackagedRunningGross,
        leaseRunningGstPassedThrough: yearRunningGstPassedThrough,
        leasePackagedRunningPreTax: yearPackagedRunningPreTax,
        leaseRunningTaxSaved: yearRunningTaxSaved,
        leaseRunningAfterTaxEquivalent: yearLeaseRunningAfterTaxEquivalent,
        leaseOutsidePackageRunning: yearOutsidePackageRunning,
        leaseTaxAndMedicareSaved: yearTaxAndMedicareSaved,
        leaseHelpDelta: yearHelpDelta,
        leaseMlsDelta: yearMlsDelta,
        leaseNetSuperLoss: yearLeaseNetSuperLoss,
      };
    },
  );

  const upfrontCashRequired = {
    cash: driveAway,
    loan: loanDeposit + Math.max(0, finite(inputs.loanUpfrontFee)),
    lease: leaseUpfrontOutOfPocket,
  };
  const finalLumpSum = {
    cash: 0,
    loan: loanBalloon,
    lease: residualPayable,
  };
  const leaseResidualGst = residualPayable - residualExGst;
  const leaseVsCashBridge = [
    { label: '车辆 GST 优惠', value: -vehicleGstPassedThrough },
    { label: 'Lease 融资利息', value: leaseFinanceCharge },
    { label: '管理费', value: leaseAdminTotal },
    { label: '期末残值 GST', value: leaseResidualGst },
    { label: '运行费用 GST 优惠', value: -runningGstPassedThrough },
    { label: '所得税及 Medicare 节省', value: -incomeTaxSaved - medicareSaved },
    { label: '税后扣款', value: postTaxTotal },
    { label: 'MLS 变化', value: mlsDelta },
    { label: 'Super 净损失', value: netSuperLoss },
  ];
  const leaseVsCashDifference = leaseVsCashBridge.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const loanVsCashDifference = loanOutflow - cashOutflow;

  return {
    years,
    termMonths,
    baseSalary,
    vehicleExtras,
    vehicleValue,
    dutiableValue,
    motorDuty,
    registrationFeeAnnual,
    tacChargeAnnual,
    plateFee,
    firstYearRegistrationTotal,
    driveAway,
    totalKm,
    energy,
    tyres,
    registrations,
    registrationRenewalCoverageMonths,
    shortTermRegistrationServiceFees,
    insurance,
    maintenance,
    parkingAndTolls,
    otherRunning,
    homeCharger,
    runningTotal,
    marketValue,
    cashOutflow,
    cashEconomicCost,
    loanDeposit,
    loanPrincipal,
    loanPayment,
    loanOutflow,
    loanEconomicCost,
    vehicleGstPassedThrough,
    financeBase,
    residualExGst,
    residualPayable,
    leasePayment,
    leaseFinancePayments,
    leaseFinanceCharge,
    leaseAdminTotal,
    leaseUpfrontOutOfPocket,
    runningGstPassedThrough,
    packagedRunningGross,
    outsidePackageRunning,
    preTaxMonthly,
    preTaxTotal,
    preTaxAnnual,
    postTaxTotal,
    baselineIncomeTaxAnnual,
    leaseIncomeTaxAnnual,
    incomeTaxSaved,
    medicareSaved,
    leaseTaxableIncome,
    fbtEligible,
    rfbaAnnual,
    helpDelta,
    mlsDelta,
    userMlsDelta,
    spouseMlsDelta,
    mlsCalculable,
    grossSuperLoss,
    netSuperLoss,
    takeHomeReduction,
    leaseOutflowExHelp,
    leaseCostBeforeResale,
    leaseEconomicCost,
    upfrontCashRequired,
    finalLumpSum,
    annualCashflows,
    leaseResidualGst,
    leaseVsCashBridge,
    leaseVsCashDifference,
    loanVsCashDifference,
    leaseMonthlyTakeHome: takeHomeReduction / termMonths,
    minimumResidualPercent: minimumResidualPercent(termMonths),
  };
}

export function formatCurrency(value: number, maximumFractionDigits = 0) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const normalizedValue = Object.is(safeValue, -0) ? 0 : safeValue;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits,
  }).format(normalizedValue);
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('en-AU', { maximumFractionDigits }).format(
    Number.isFinite(value) ? value : 0,
  );
}
