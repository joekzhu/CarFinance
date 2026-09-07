'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  CarFront,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CopyPlus,
  FileText,
  FolderOpen,
  GraduationCap,
  Info,
  Landmark,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  calculate,
  DEFAULT_INPUTS,
  estimatedVehicleGstPassedThrough,
  FUEL_EFFICIENT_LCT_THRESHOLD,
  formatCurrency,
  formatNumber,
  MAX_VEHICLE_GST_CREDIT_2026_27,
  minimumResidualPercent,
  REGISTRATION_FEE_BY_REGION,
  TAC_CHARGE_BY_REGION,
  VEHICLE_PRICES,
  type CalculatorInputs,
  type RegistrationRegion,
  type VehicleVariant,
} from '@/lib/calculator';

const REFERENCE_CHECKED_AT = '2026年9月5日 · 墨尔本时间';
const SAVED_PROFILES_KEY = 'car-finance.saved-configurations.v1';

type PriceStatus = 'reference' | 'manual' | 'verified';
type VehicleGstMode = 'estimate' | 'manual';

type SavedProfile = {
  id: string;
  name: string;
  savedAt: string;
  inputs: CalculatorInputs;
  variant: VehicleVariant;
  priceStatus: PriceStatus;
  checkedAt: string;
  vehicleGstMode: VehicleGstMode;
  includeEndValue: boolean;
  spreadFinalPayments: boolean;
};

type SavedProfilesStore = {
  version: 1;
  activeId: string;
  profiles: SavedProfile[];
};

type Comparison = {
  id: 'lease' | 'cash' | 'loan';
  name: string;
  shortName: string;
  cost: number;
  valid: boolean;
};

function normalizeSavedProfile(value: unknown): SavedProfile | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    !candidate.id ||
    !candidate.name
  ) {
    return null;
  }

  const inputs = { ...DEFAULT_INPUTS };
  if (candidate.inputs && typeof candidate.inputs === 'object') {
    const storedInputs = candidate.inputs as Record<string, unknown>;
    const target = inputs as unknown as Record<string, unknown>;
    for (const key of Object.keys(DEFAULT_INPUTS)) {
      if (typeof storedInputs[key] === typeof target[key]) {
        target[key] = storedInputs[key];
      }
    }
  }

  const variant =
    typeof candidate.variant === 'string' && candidate.variant in VEHICLE_PRICES
      ? (candidate.variant as VehicleVariant)
      : 'rwd';
  const priceStatus: PriceStatus =
    candidate.priceStatus === 'manual' || candidate.priceStatus === 'verified'
      ? candidate.priceStatus
      : 'reference';
  const vehicleGstMode: VehicleGstMode =
    candidate.vehicleGstMode === 'manual' ? 'manual' : 'estimate';

  return {
    id: candidate.id,
    name: candidate.name,
    savedAt:
      typeof candidate.savedAt === 'string'
        ? candidate.savedAt
        : new Date(0).toISOString(),
    inputs,
    variant,
    priceStatus,
    checkedAt:
      typeof candidate.checkedAt === 'string'
        ? candidate.checkedAt
        : REFERENCE_CHECKED_AT,
    vehicleGstMode,
    includeEndValue: candidate.includeEndValue === true,
    spreadFinalPayments: candidate.spreadFinalPayments === true,
  };
}

function nextAvailableProfileName(
  requestedName: string,
  profiles: SavedProfile[],
) {
  const existingNames = new Set(profiles.map((profile) => profile.name));
  if (!existingNames.has(requestedName)) return requestedName;

  let copyNumber = 2;
  while (existingNames.has(`${requestedName} (${copyNumber})`)) {
    copyNumber += 1;
  }
  return `${requestedName} (${copyNumber})`;
}

export default function Home() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [variant, setVariant] = useState<VehicleVariant>('rwd');
  const [priceStatus, setPriceStatus] = useState<PriceStatus>('reference');
  const [checkedAt, setCheckedAt] = useState(REFERENCE_CHECKED_AT);
  const [vehicleGstMode, setVehicleGstMode] =
    useState<VehicleGstMode>('estimate');
  const [includeEndValue, setIncludeEndValue] = useState(false);
  const [spreadFinalPayments, setSpreadFinalPayments] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [profileName, setProfileName] = useState<string>(
    VEHICLE_PRICES.rwd.label,
  );
  const [storageMessage, setStorageMessage] = useState('');

  const result = useMemo(() => calculate(inputs), [inputs]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const rawStore = window.localStorage.getItem(SAVED_PROFILES_KEY);
        if (!rawStore) return;
        const parsedStore = JSON.parse(rawStore) as Partial<SavedProfilesStore>;
        if (!Array.isArray(parsedStore.profiles)) return;

        const profiles = parsedStore.profiles
          .map(normalizeSavedProfile)
          .filter((profile): profile is SavedProfile => profile !== null);
        setSavedProfiles(profiles);

        const activeProfile = profiles.find(
          (profile) => profile.id === parsedStore.activeId,
        );
        if (activeProfile) {
          setInputs(activeProfile.inputs);
          setVariant(activeProfile.variant);
          setPriceStatus(activeProfile.priceStatus);
          setCheckedAt(activeProfile.checkedAt);
          setVehicleGstMode(activeProfile.vehicleGstMode);
          setIncludeEndValue(activeProfile.includeEndValue);
          setSpreadFinalPayments(activeProfile.spreadFinalPayments);
          setSelectedProfileId(activeProfile.id);
          setProfileName(activeProfile.name);
        }
      } catch {
        setStorageMessage('以前保存的方案无法读取；当前计算仍可正常使用。');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof CalculatorInputs>(
    key: K,
    value: CalculatorInputs[K],
  ) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function updateVariant(nextVariant: VehicleVariant) {
    const price = VEHICLE_PRICES[nextVariant].price;
    setVariant(nextVariant);
    setInputs((current) => ({
      ...current,
      basePrice: price,
      lctValue: price + current.vehicleExtras,
      vehicleGstPassedThrough: estimatedVehicleGstPassedThrough(
        price + current.vehicleExtras,
      ),
    }));
    setVehicleGstMode('estimate');
    setCheckedAt(REFERENCE_CHECKED_AT);
    setPriceStatus('reference');
    if (
      !selectedProfileId &&
      Object.values(VEHICLE_PRICES).some(
        (vehicle) => vehicle.label === profileName,
      )
    ) {
      setProfileName(VEHICLE_PRICES[nextVariant].label);
    }
  }

  function updateTerm(months: number) {
    setInputs((current) => ({
      ...current,
      termMonths: months,
      leaseResidualPercent: Number(minimumResidualPercent(months).toFixed(2)),
    }));
  }

  function updateRegion(region: RegistrationRegion) {
    setInputs((current) => ({
      ...current,
      registrationRegion: region,
      registrationFeeAnnual: REGISTRATION_FEE_BY_REGION[region],
      tacChargeAnnual: TAC_CHARGE_BY_REGION[region],
    }));
  }

  function loadReferencePrice() {
    updateVariant(variant);
  }

  function markPriceVerified() {
    const now = new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Australia/Melbourne',
    }).format(new Date());
    setCheckedAt(`${now} · 墨尔本时间`);
    setPriceStatus('verified');
  }

  function persistProfiles(profiles: SavedProfile[], activeId: string) {
    const store: SavedProfilesStore = { version: 1, activeId, profiles };
    window.localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(store));
  }

  function currentProfileSnapshot(id: string, name: string): SavedProfile {
    return {
      id,
      name,
      savedAt: new Date().toISOString(),
      inputs,
      variant,
      priceStatus,
      checkedAt,
      vehicleGstMode,
      includeEndValue,
      spreadFinalPayments,
    };
  }

  function saveCurrentProfile(asNew = false) {
    const requestedName =
      profileName.trim() ||
      `${VEHICLE_PRICES[variant].label} · ${formatCurrency(inputs.basePrice)}`;
    const existingId = asNew ? '' : selectedProfileId;
    const name = existingId
      ? requestedName
      : nextAvailableProfileName(requestedName, savedProfiles);
    const id =
      existingId ||
      (typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const profile = currentProfileSnapshot(id, name);
    const nextProfiles = existingId
      ? savedProfiles.map((savedProfile) =>
          savedProfile.id === existingId ? profile : savedProfile,
        )
      : [...savedProfiles, profile];

    try {
      persistProfiles(nextProfiles, id);
      setSavedProfiles(nextProfiles);
      setSelectedProfileId(id);
      setProfileName(name);
      setStorageMessage(`已保存在这台设备：${name}`);
    } catch {
      setStorageMessage('保存失败；浏览器可能禁止了本机存储。');
    }
  }

  function selectSavedProfile(id: string) {
    const profile = savedProfiles.find((item) => item.id === id);
    if (!profile) {
      setSelectedProfileId('');
      try {
        persistProfiles(savedProfiles, '');
      } catch {
        // The current form remains usable if browser storage is unavailable.
      }
      return;
    }

    setInputs(profile.inputs);
    setVariant(profile.variant);
    setPriceStatus(profile.priceStatus);
    setCheckedAt(profile.checkedAt);
    setVehicleGstMode(profile.vehicleGstMode);
    setIncludeEndValue(profile.includeEndValue);
    setSpreadFinalPayments(profile.spreadFinalPayments);
    setSelectedProfileId(profile.id);
    setProfileName(profile.name);
    try {
      persistProfiles(savedProfiles, profile.id);
      setStorageMessage(`已载入：${profile.name}`);
    } catch {
      setStorageMessage('方案已载入，但浏览器没有记住当前选择。');
    }
  }

  function reset() {
    setInputs(DEFAULT_INPUTS);
    setVariant('rwd');
    setPriceStatus('reference');
    setCheckedAt(REFERENCE_CHECKED_AT);
    setVehicleGstMode('estimate');
    setIncludeEndValue(false);
    setSpreadFinalPayments(false);
    setSelectedProfileId('');
    setProfileName(VEHICLE_PRICES.rwd.label);
    setStorageMessage('已恢复默认；以前保存的方案仍然保留。');
    try {
      persistProfiles(savedProfiles, '');
    } catch {
      // Resetting the active form does not depend on browser storage.
    }
  }

  const selectedProfile = savedProfiles.find(
    (profile) => profile.id === selectedProfileId,
  );
  const currentProfileState = JSON.stringify({
    inputs,
    variant,
    priceStatus,
    checkedAt,
    vehicleGstMode,
    includeEndValue,
    spreadFinalPayments,
    name: profileName.trim(),
  });
  const savedProfileState = selectedProfile
    ? JSON.stringify({
        inputs: selectedProfile.inputs,
        variant: selectedProfile.variant,
        priceStatus: selectedProfile.priceStatus,
        checkedAt: selectedProfile.checkedAt,
        vehicleGstMode: selectedProfile.vehicleGstMode,
        includeEndValue: selectedProfile.includeEndValue,
        spreadFinalPayments: selectedProfile.spreadFinalPayments,
        name: selectedProfile.name,
      })
    : '';
  const hasUnsavedChanges = currentProfileState !== savedProfileState;

  const comparisons: Comparison[] = [
    {
      id: 'lease',
      name: 'Novated lease',
      shortName: 'Novated lease',
      cost: includeEndValue
        ? result.leaseEconomicCost
        : result.leaseCostBeforeResale,
      valid: result.fbtEligible,
    },
    {
      id: 'cash',
      name: '全款购买',
      shortName: '全款',
      cost: includeEndValue ? result.cashEconomicCost : result.cashOutflow,
      valid: true,
    },
    {
      id: 'loan',
      name: '个人车贷',
      shortName: '车贷',
      cost: includeEndValue ? result.loanEconomicCost : result.loanOutflow,
      valid: true,
    },
  ];
  const ranked = [...comparisons].sort((a, b) => {
    if (a.valid !== b.valid) return a.valid ? -1 : 1;
    return a.cost - b.cost;
  });
  const lowest = ranked[0];
  const nextLowest = ranked.find((item) => item.id !== lowest.id && item.valid);
  const maxCost = Math.max(
    ...comparisons.filter((item) => item.valid).map((item) => item.cost),
  );
  const profileIncomplete =
    inputs.helpStatus === 'unknown' ||
    inputs.hospitalStatus === 'unknown' ||
    inputs.householdStatus === 'unknown';
  const residualBelowMinimum =
    inputs.leaseResidualPercent + 0.01 < result.minimumResidualPercent;
  const endValueRows: [string, number][] = includeEndValue
    ? [['期末车辆价值', -result.marketValue]]
    : [];
  const termLabel =
    inputs.termMonths % 12 === 0
      ? `${inputs.termMonths / 12}年`
      : `${inputs.termMonths}个月`;
  const upfrontItems = [
    {
      label: '全款',
      value: result.upfrontCashRequired.cash,
      note: '完整 drive-away price',
    },
    {
      label: '个人车贷',
      value: result.upfrontCashRequired.loan,
      note: '首付 + 一次性贷款费用',
    },
    {
      label: 'Novated lease',
      value: result.upfrontCashRequired.lease,
      note: '按 provider 要求的自付金额',
    },
  ];
  const finalItems = [
    { label: '全款', value: result.finalLumpSum.cash, note: '没有融资尾款' },
    {
      label: '个人车贷',
      value: result.finalLumpSum.loan,
      note: spreadFinalPayments
        ? 'Balloon：年度预算已预留，期末仍需实际支付'
        : 'Balloon（如有）',
    },
    {
      label: 'Novated lease',
      value: result.finalLumpSum.lease,
      note: spreadFinalPayments
        ? '买断残值：年度预算已预留，期末仍需实际支付'
        : '期末买断残值（含 GST）',
    },
  ];

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground lg:pb-14">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <CarFront aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-semibold tracking-tight">落地价</p>
              <p className="text-xs text-muted-foreground">
                Victoria · 2026–27
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            className="min-h-10 px-3 text-muted-foreground"
          >
            <RotateCcw aria-hidden="true" />
            恢复默认
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <section className="mb-6 max-w-2xl">
          <p className="mb-2 text-sm font-medium text-primary">
            现金 · 个人车贷 · Novated lease
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            特斯拉 Model Y 花费比较
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            比较相同持有期内的税后现金流、期末车辆价值、税务影响与 super 变化。
          </p>
        </section>

        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <AssumptionPill>
            {formatCurrency(result.baseSalary)} 年薪
          </AssumptionPill>
          <AssumptionPill>
            {formatNumber(inputs.monthlyKm)} km/月
          </AssumptionPill>
          <AssumptionPill>
            {formatNumber(inputs.superRate, 1)}% protected super
          </AssumptionPill>
          <AssumptionPill>{inputs.termMonths} 个月</AssumptionPill>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById('assumptions')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            className="min-h-9 rounded-full px-3 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            修改条件
          </button>
        </div>

        <Card className="mb-5">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                <Save className="size-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>保存和切换方案</CardTitle>
                <CardDescription className="mt-1">
                  方案只保存在这台设备的当前浏览器；刷新后会自动恢复最后载入的方案
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="profile-name" className="text-sm font-medium">
                  方案名称
                </Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  placeholder="例如：Model Y RWD 白色"
                  className="mt-2 min-h-11"
                />
              </div>
              <div>
                <Label htmlFor="saved-profile" className="text-sm font-medium">
                  已保存方案（{savedProfiles.length}）
                </Label>
                <NativeSelect
                  id="saved-profile"
                  value={selectedProfileId}
                  onChange={(event) => selectSavedProfile(event.target.value)}
                  disabled={savedProfiles.length === 0}
                  className="mt-2 min-h-11"
                >
                  <NativeSelectOption value="">
                    {savedProfiles.length === 0
                      ? '还没有保存的方案'
                      : '选择一个方案载入'}
                  </NativeSelectOption>
                  {savedProfiles.map((profile) => (
                    <NativeSelectOption key={profile.id} value={profile.id}>
                      {profile.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                type="button"
                onClick={() => saveCurrentProfile(false)}
                className="min-h-11"
              >
                <Save aria-hidden="true" />
                {selectedProfile ? '更新已选方案' : '保存当前方案'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => saveCurrentProfile(true)}
                className="min-h-11"
              >
                <CopyPlus aria-hidden="true" />
                另存为新方案
              </Button>
            </div>
            <output
              className="flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground"
              aria-live="polite"
            >
              <FolderOpen className="size-3.5 shrink-0" aria-hidden="true" />
              {selectedProfile && hasUnsavedChanges
                ? '当前内容有未保存修改'
                : storageMessage ||
                  (selectedProfile
                    ? `当前方案已保存：${selectedProfile.name}`
                    : '保存后即可在不同选车方案之间切换')}
            </output>
          </CardContent>
        </Card>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.82fr)]">
          <section
            aria-labelledby="result-title"
            className="space-y-4 lg:order-2 lg:sticky lg:top-20"
          >
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                    <Clock3 className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle>三段现金流</CardTitle>
                    <CardDescription className="mt-1">
                      提车时 · 每个合同年 · 合同结束时
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <CashMoment
                  step="01"
                  title="提车时要拿出的现金"
                  items={upfrontItems}
                />

                <div>
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                        02
                      </p>
                      <p className="mt-1 font-medium">
                        {spreadFinalPayments
                          ? '每年预算影响（含尾款预留）'
                          : '每年税后现金影响'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {spreadFinalPayments
                        ? '尾款仍在期末实际支付'
                        : '不含期末一次性尾款'}
                    </span>
                  </div>
                  <label
                    htmlFor="spread-final-payments"
                    className="mb-3 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/35 p-3"
                  >
                    <Checkbox
                      id="spread-final-payments"
                      checked={spreadFinalPayments}
                      onCheckedChange={(checked) =>
                        setSpreadFinalPayments(Boolean(checked))
                      }
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        将融资尾款平均摊入年度预算
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        把车贷 balloon 和 Lease
                        残值按合同月份预留，便于比较真实资金压力；这不会改变总成本或实际付款日期
                      </span>
                    </span>
                  </label>
                  <AnnualCashflowChart
                    rows={result.annualCashflows}
                    fbtEligible={result.fbtEligible}
                    spreadFinalPayments={spreadFinalPayments}
                    loanBalloon={result.finalLumpSum.loan}
                    leaseResidual={result.finalLumpSum.lease}
                  />
                </div>

                <CashMoment
                  step="03"
                  title={`第 ${result.annualCashflows.length} 年末额外一次性付款`}
                  items={finalItems}
                />
                <p className="rounded-xl bg-muted/55 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                  Lease 提车自付为 $0
                  只是默认估算；若报价包含订金、首期租金或设立费，请在 Novated
                  lease 条件中填写。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lease 运行费如何节省</CardTitle>
                <CardDescription>
                  运行费用没有消失；符合条件并被套餐覆盖的部分改由税前工资支付
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaseRunningCostChart rows={result.annualCashflows} />
                {spreadFinalPayments ? (
                  <p className="mt-4 rounded-xl bg-muted/55 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                    Lease
                    残值预留显示在上方“每年预算影响”中；它不是运行费，也不享受运行费的税前节省。
                  </p>
                ) : null}
                <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
                  家用充电器、停车及过路费通常不属于同一项 EV
                  关联费用豁免；页面默认把它们留在税后，除非你按实际 provider
                  报价调整。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>多付或省下的钱去了哪里</CardTitle>
                <CardDescription>
                  以全款在相同持有期的全部成本为基准；左侧绿色是节省，右侧红色是新增成本
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <DifferenceSummary
                  title="个人车贷 vs 全款"
                  difference={result.loanVsCashDifference}
                  rows={[
                    {
                      label: '贷款利息及费用',
                      value: result.loanVsCashDifference,
                    },
                  ]}
                />
                <DifferenceSummary
                  title="Novated lease vs 全款"
                  difference={result.leaseVsCashDifference}
                  rows={result.leaseVsCashBridge}
                />
                {inputs.helpStatus === 'yes' ? (
                  <p className="rounded-xl bg-muted/55 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                    HELP
                    还款变化属于债务偿还时点，不属于车辆本身的经济成本，因此没有进入这张长期差额桥接图；它已进入上方年度现金影响。
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground ring-0">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium">
                    当前最低估算
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/70">
                    <Info className="size-3.5" /> 不是正式报价
                  </span>
                </div>
                <CardTitle id="result-title" className="pt-5 text-white/78">
                  {lowest.name}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {inputs.termMonths} 个月预计
                  {includeEndValue ? '净经济成本' : '全部成本'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold tracking-[-0.045em] tabular-nums sm:text-5xl">
                  {formatCurrency(lowest.cost)}
                </p>
                {nextLowest ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-white/78">
                    <CheckCircle2 className="size-4" />
                    比下一方案预计少{' '}
                    {formatCurrency(nextLowest.cost - lowest.cost)}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <label
                  htmlFor="include-end-value"
                  className="flex cursor-pointer items-start gap-3"
                >
                  <Checkbox
                    id="include-end-value"
                    checked={includeEndValue}
                    onCheckedChange={(checked) =>
                      setIncludeEndValue(Boolean(checked))
                    }
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      抵扣期末车辆价值
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      默认不勾选，显示整个持有期实际承担的全部成本；勾选后才从三种方案中减去相同的预计车值
                    </span>
                  </span>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>三种方式</CardTitle>
                <CardDescription>
                  车辆与使用条件保持一致 ·{' '}
                  {includeEndValue ? '已抵扣期末车值' : '未抵扣期末车值'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ranked.map((item, index) => {
                  const difference = item.valid ? item.cost - lowest.cost : 0;
                  const width = item.valid
                    ? Math.max(12, (item.cost / maxCost) * 100)
                    : 12;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border bg-card p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                            index === 0
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {!item.valid
                              ? 'LCT / FBT 条件需先核实'
                              : difference <= 1
                                ? '当前最低'
                                : `比最低多 ${formatCurrency(difference)}`}
                          </p>
                        </div>
                        <p className="font-semibold tabular-nums">
                          {item.valid ? formatCurrency(item.cost) : '需核实'}
                        </p>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${index === 0 ? 'bg-primary' : 'bg-chart-2'}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={<WalletCards />}
                label="Lease 月均税后影响"
                value={formatCurrency(result.leaseMonthlyTakeHome)}
              />
              <MetricCard
                icon={<CircleDollarSign />}
                label="Lease 期末买断"
                value={formatCurrency(result.residualPayable)}
              />
              <MetricCard
                icon={<Sparkles />}
                label="所得税及 Medicare 节省"
                value={formatCurrency(
                  result.incomeTaxSaved + result.medicareSaved,
                )}
              />
              <MetricCard
                icon={<CarFront />}
                label={
                  includeEndValue ? '已抵扣期末车值' : '预计期末车值（未抵扣）'
                }
                value={formatCurrency(result.marketValue)}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>结果说明</CardTitle>
                <CardDescription>
                  把容易被报价隐藏的项目单独列出
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow
                  label="预计维州落地价"
                  value={formatCurrency(result.driveAway)}
                />
                <DetailRow
                  label={`${inputs.termMonths}个月运行成本`}
                  value={formatCurrency(result.runningTotal)}
                />
                <DetailRow
                  label={`其中后续 rego / TAC（覆盖 ${formatNumber(result.registrationRenewalCoverageMonths)} 个月）`}
                  value={formatCurrency(result.registrations)}
                />
                {result.shortTermRegistrationServiceFees > 0 ? (
                  <DetailRow
                    label="其中短期续费服务费"
                    value={formatCurrency(
                      result.shortTermRegistrationServiceFees,
                      2,
                    )}
                  />
                ) : null}
                <DetailRow
                  label="Lease 包外税后运行费"
                  value={formatCurrency(result.outsidePackageRunning)}
                  good={result.outsidePackageRunning === 0}
                />
                <DetailRow
                  label="Lease 税前扣款 / 月"
                  value={formatCurrency(result.preTaxMonthly)}
                />
                <DetailRow
                  label="Lease 估算融资利息（已计入）"
                  value={formatCurrency(result.leaseFinanceCharge)}
                />
                <DetailRow
                  label="Lease 管理费合计（已计入）"
                  value={formatCurrency(result.leaseAdminTotal)}
                />
                <DetailRow
                  label="RFBA / 年"
                  value={formatCurrency(result.rfbaAnnual)}
                />
                <DetailRow
                  label="HELP 还款现金流变化"
                  value={
                    inputs.helpStatus === 'unknown'
                      ? '未计算'
                      : formatSignedCurrency(result.helpDelta)
                  }
                  muted={inputs.helpStatus === 'unknown'}
                />
                <DetailRow
                  label={
                    inputs.householdStatus === 'family'
                      ? 'MLS 家庭合计变化'
                      : 'MLS 变化'
                  }
                  value={
                    result.mlsCalculable
                      ? formatSignedCurrency(result.mlsDelta)
                      : '未计算'
                  }
                  muted={!result.mlsCalculable}
                />
                <DetailRow
                  label="Super 净损失"
                  value={formatCurrency(result.netSuperLoss)}
                  good={result.netSuperLoss === 0}
                />
              </CardContent>
            </Card>
          </section>

          <section
            id="assumptions"
            aria-labelledby="assumptions-title"
            className="space-y-4 scroll-mt-20 lg:order-1"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="assumptions-title"
                  className="text-xl font-semibold tracking-tight"
                >
                  计算条件
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  修改后结果会立即更新
                </p>
              </div>
              <SlidersHorizontal
                className="size-5 text-primary"
                aria-hidden="true"
              />
            </div>

            <Card>
              <Accordion
                multiple
                defaultValue={['profile', 'vehicle']}
                className="px-4"
              >
                <AccordionItem value="profile">
                  <AccordionTrigger className="min-h-14 py-4 hover:no-underline">
                    <SectionTitle
                      icon={<GraduationCap />}
                      title="薪资与雇主"
                      subtitle="La Trobe 默认情景"
                    />
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <NumberField
                        id="salary"
                        label="年薪"
                        value={inputs.salary}
                        onChange={(value) => update('salary', value)}
                        prefix="$"
                        step={1000}
                        hint="默认按税前 base salary 计算"
                      />
                      <SelectField
                        id="salary-basis"
                        label="这笔年薪是"
                        value={inputs.salaryBasis}
                        onChange={(value) =>
                          update(
                            'salaryBasis',
                            value as CalculatorInputs['salaryBasis'],
                          )
                        }
                        options={[
                          { value: 'base', label: '不含 employer super' },
                          {
                            value: 'package',
                            label: '含 employer super 的总包',
                          },
                        ]}
                      />
                      <NumberField
                        id="super-rate"
                        label="雇主 super 比例"
                        value={inputs.superRate}
                        onChange={(value) => update('superRate', value)}
                        suffix="%"
                        step={0.1}
                      />
                      <SelectField
                        id="super-mode"
                        label="Super 计算基数"
                        value={inputs.superMode}
                        onChange={(value) =>
                          update(
                            'superMode',
                            value as CalculatorInputs['superMode'],
                          )
                        }
                        options={[
                          {
                            value: 'protected',
                            label: '税前原薪资（默认，无损失）',
                          },
                          {
                            value: 'reduced',
                            label: '按 packaging 后工资减少',
                          },
                          { value: 'manual', label: '手动输入年度损失' },
                        ]}
                        hint="La Trobe EA 默认按原工资基数；仍建议向 payroll 核实"
                      />
                      {inputs.superMode === 'manual' ? (
                        <NumberField
                          id="manual-super-loss"
                          label="每年少缴的 employer super"
                          value={inputs.manualSuperLossAnnual}
                          onChange={(value) =>
                            update('manualSuperLossAnnual', value)
                          }
                          prefix="$"
                        />
                      ) : null}
                      <SelectField
                        id="help-status"
                        label="是否有 HELP / HECS 债务"
                        value={inputs.helpStatus}
                        onChange={(value) =>
                          update(
                            'helpStatus',
                            value as CalculatorInputs['helpStatus'],
                          )
                        }
                        options={[
                          { value: 'unknown', label: '尚未填写' },
                          { value: 'none', label: '没有' },
                          { value: 'yes', label: '有' },
                        ]}
                      />
                      <SelectField
                        id="household-status"
                        label="MLS 家庭状态"
                        value={inputs.householdStatus}
                        onChange={(value) =>
                          update(
                            'householdStatus',
                            value as CalculatorInputs['householdStatus'],
                          )
                        }
                        options={[
                          { value: 'unknown', label: '尚未填写' },
                          { value: 'single', label: '单身 / 按个人门槛' },
                          { value: 'family', label: '家庭 / 需完整资料' },
                        ]}
                        hint="只在没有合规私人住院保险时产生 MLS；家庭模式按合计 MLS income 定档"
                      />
                      {inputs.householdStatus === 'family' ? (
                        <>
                          <NumberField
                            id="spouse-mls-income"
                            label="配偶 MLS income（家庭档位）"
                            value={inputs.spouseIncomeForMls}
                            onChange={(value) =>
                              setInputs((current) => ({
                                ...current,
                                spouseIncomeForMls: value,
                                spouseMlsSurchargeBase: value,
                              }))
                            }
                            prefix="$"
                            step={1000}
                            hint="填 taxable income、RFBA、reportable super 等的合计估算"
                          />
                          <NumberField
                            id="spouse-mls-base"
                            label="配偶 MLS 金额基数"
                            value={inputs.spouseMlsSurchargeBase}
                            onChange={(value) =>
                              update('spouseMlsSurchargeBase', value)
                            }
                            prefix="$"
                            step={1000}
                            hint="通常是 taxable income + RFBA；用于估算配偶本人的 surcharge"
                          />
                          <NumberField
                            id="dependant-children"
                            label="受抚养子女数"
                            value={inputs.dependantChildren}
                            onChange={(value) =>
                              update(
                                'dependantChildren',
                                Math.max(0, Math.floor(value)),
                              )
                            }
                            step={1}
                            hint="从第二个孩子起，家庭门槛每人增加 $1,500"
                          />
                        </>
                      ) : null}
                      <SelectField
                        id="hospital-status"
                        label={
                          inputs.householdStatus === 'family'
                            ? '本人及所有家属均有合规住院保险'
                            : '合规私人住院保险'
                        }
                        value={inputs.hospitalStatus}
                        onChange={(value) =>
                          update(
                            'hospitalStatus',
                            value as CalculatorInputs['hospitalStatus'],
                          )
                        }
                        options={[
                          { value: 'unknown', label: '尚未填写' },
                          { value: 'covered', label: '有' },
                          { value: 'not-covered', label: '没有' },
                        ]}
                        hint="家庭模式会用你与配偶的合计 MLS income 决定档位"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vehicle">
                  <AccordionTrigger className="min-h-14 py-4 hover:no-underline">
                    <SectionTitle
                      icon={<CarFront />}
                      title="车辆与里程"
                      subtitle="Model Y · Victoria"
                    />
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        id="vehicle-variant"
                        label="车型"
                        value={variant}
                        onChange={(value) =>
                          updateVariant(value as VehicleVariant)
                        }
                        options={Object.entries(VEHICLE_PRICES).map(
                          ([value, vehicle]) => ({
                            value,
                            label: vehicle.label,
                          }),
                        )}
                        className="sm:col-span-2"
                      />
                      <NumberField
                        id="base-price"
                        label="基础车价（可修改）"
                        value={inputs.basePrice}
                        onChange={(value) => {
                          setInputs((current) => {
                            return {
                              ...current,
                              basePrice: value,
                              lctValue: value + current.vehicleExtras,
                              vehicleGstPassedThrough:
                                vehicleGstMode === 'estimate'
                                  ? estimatedVehicleGstPassedThrough(
                                      value + current.vehicleExtras,
                                    )
                                  : current.vehicleGstPassedThrough,
                            };
                          });
                          setPriceStatus('manual');
                        }}
                        prefix="$"
                        step={100}
                      />
                      <NumberField
                        id="vehicle-extras"
                        label="选装费用"
                        value={inputs.vehicleExtras}
                        onChange={(value) => {
                          setInputs((current) => {
                            const difference = value - current.vehicleExtras;
                            return {
                              ...current,
                              vehicleExtras: value,
                              lctValue: Math.max(
                                0,
                                current.lctValue + difference,
                              ),
                              vehicleGstPassedThrough:
                                vehicleGstMode === 'estimate'
                                  ? estimatedVehicleGstPassedThrough(
                                      current.basePrice + value,
                                    )
                                  : current.vehicleGstPassedThrough,
                            };
                          });
                        }}
                        prefix="$"
                        step={100}
                        hint="颜色、轮毂、内饰等选装的合计"
                      />
                      <NumberField
                        id="lct-value"
                        label="LCT value"
                        value={inputs.lctValue}
                        onChange={(value) => update('lctValue', value)}
                        prefix="$"
                        step={100}
                        hint={`默认含选装；EV 门槛：${formatCurrency(FUEL_EFFICIENT_LCT_THRESHOLD)}`}
                        className="sm:col-span-2"
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-border bg-muted/45 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <BadgeDollarSign className="size-4 text-primary" />
                            <p className="text-sm font-medium">
                              Tesla 参考价格
                            </p>
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-primary">
                              {priceStatus === 'reference'
                                ? '参考快照'
                                : priceStatus === 'verified'
                                  ? '你已核实'
                                  : '手动值'}
                            </span>
                          </div>
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock3 className="size-3.5" /> {checkedAt}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={loadReferencePrice}
                          className="min-h-10"
                        >
                          <RefreshCw /> 载入参考价
                        </Button>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <a
                          href="https://www.tesla.com/en_au/modely/design"
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-11 items-center justify-between rounded-xl border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          打开 Tesla 官网核实
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                        </a>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={markPriceVerified}
                          className="min-h-11 justify-between px-3"
                        >
                          我已核实当前数值
                          <CheckCircle2 />
                        </Button>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        Tesla
                        没有稳定公开的实时价格接口。本工具保留最近核实值，不会在读取失败时静默覆盖手动价格。
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <NumberField
                        id="monthly-km"
                        label="预计每月里程"
                        value={inputs.monthlyKm}
                        onChange={(value) => update('monthlyKm', value)}
                        suffix="km"
                        step={50}
                      />
                      <SelectField
                        id="term-months"
                        label="比较期限"
                        value={String(inputs.termMonths)}
                        onChange={(value) => updateTerm(Number(value))}
                        options={[12, 24, 32, 36, 48, 60].map((months) => ({
                          value: String(months),
                          label: `${months} 个月`,
                        }))}
                      />
                      <SelectField
                        id="registration-region"
                        label="车辆注册区域"
                        value={inputs.registrationRegion}
                        onChange={(value) =>
                          updateRegion(value as RegistrationRegion)
                        }
                        options={[
                          { value: 'metro', label: 'Metro / high risk' },
                          {
                            value: 'outer',
                            label: 'Outer metro / medium risk',
                          },
                          { value: 'rural', label: 'Rural / low risk' },
                        ]}
                        hint="区域会改变 TAC / CTP；当前费率会静态用于整个比较期。ZLEV 优惠暂停至 2027 年 8 月 31 日，之后需重新核实"
                        className="sm:col-span-2"
                      />
                      <NumberField
                        id="registration-fee"
                        label="Registration fee / 年"
                        value={inputs.registrationFeeAnnual}
                        onChange={(value) =>
                          update('registrationFeeAnnual', value)
                        }
                        prefix="$"
                        hint="全州统一参考 $352.70。Outer 官方合计页与 TAC 分项相差 $0.10，最终以 VicRoads 通知为准"
                      />
                      <NumberField
                        id="tac-charge"
                        label="TAC / CTP / 年"
                        value={inputs.tacChargeAnnual}
                        onChange={(value) => update('tacChargeAnnual', value)}
                        prefix="$"
                        hint="维州强制第三方人身保障；参考额已含 GST 与 insurance duty"
                      />
                      <NumberField
                        id="plate-fee"
                        label="Standard plate fee（一次性）"
                        value={inputs.plateFee}
                        onChange={(value) => update('plateFee', value)}
                        prefix="$"
                      />
                      <NumberField
                        id="delivery-other"
                        label="Delivery 及其他计 duty 费用"
                        value={inputs.deliveryAndOther}
                        onChange={(value) => update('deliveryAndOther', value)}
                        prefix="$"
                        hint="交付费及注册前已安装的配件通常计入 dutiable value；不包括 registration、TAC、保险或融资费"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-accent p-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          车辆及选装
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(result.vehicleValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          维州 motor duty
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(result.motorDuty, 2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Registration fee
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(result.registrationFeeAnnual, 2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          TAC / CTP
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(result.tacChargeAnnual, 2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Standard plate fee
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(result.plateFee, 2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Delivery 及其他计 duty 费用
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(inputs.deliveryAndOther, 2)}
                        </p>
                      </div>
                      <div className="col-span-2 mt-1 flex items-end justify-between gap-4 border-t border-primary/15 pt-3">
                        <div>
                          <p className="text-xs font-medium text-primary">
                            预计总 drive-away price
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            以上项目合计
                          </p>
                        </div>
                        <p className="text-xl font-semibold tracking-tight">
                          {formatCurrency(result.driveAway, 2)}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="loan">
                  <AccordionTrigger className="min-h-14 py-4 hover:no-underline">
                    <SectionTitle
                      icon={<Landmark />}
                      title="个人车贷"
                      subtitle="默认 7% · 可替换为实际报价"
                    />
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <NumberField
                        id="loan-deposit"
                        label="首付比例"
                        value={inputs.loanDepositPercent}
                        onChange={(value) =>
                          update('loanDepositPercent', value)
                        }
                        suffix="%"
                        step={1}
                      />
                      <NumberField
                        id="loan-rate"
                        label="年利率"
                        value={inputs.loanRate}
                        onChange={(value) => update('loanRate', value)}
                        suffix="%"
                        step={0.1}
                      />
                      <NumberField
                        id="loan-upfront-fee"
                        label="一次性费用"
                        value={inputs.loanUpfrontFee}
                        onChange={(value) => update('loanUpfrontFee', value)}
                        prefix="$"
                      />
                      <NumberField
                        id="loan-monthly-fee"
                        label="每月账户费"
                        value={inputs.loanMonthlyFee}
                        onChange={(value) => update('loanMonthlyFee', value)}
                        prefix="$"
                      />
                      <NumberField
                        id="loan-balloon"
                        label="期末 balloon"
                        value={inputs.loanBalloon}
                        onChange={(value) => update('loanBalloon', value)}
                        prefix="$"
                        hint="默认为 0；如报价含 balloon 请填入"
                        className="sm:col-span-2"
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-muted/55 p-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          预计月供
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(result.loanPayment)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          预计首付
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(result.loanDeposit)}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="lease">
                  <AccordionTrigger className="min-h-14 py-4 hover:no-underline">
                    <SectionTitle
                      icon={<FileText />}
                      title="Novated lease"
                      subtitle="估算模式 · 收到报价后替换"
                    />
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-primary/15 bg-accent p-4 text-sm leading-5">
                      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium">现行法律规则</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          默认按符合条件的纯电动车 FBT 全额豁免计算。2027
                          年预算公告尚未写入现行法，本版不把它当作已生效规则。
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <NumberField
                        id="lease-rate"
                        label="估算年利率"
                        value={inputs.leaseRate}
                        onChange={(value) => update('leaseRate', value)}
                        suffix="%"
                        step={0.1}
                      />
                      <NumberField
                        id="lease-admin"
                        label="管理费 / 月"
                        value={inputs.leaseAdminMonthly}
                        onChange={(value) => update('leaseAdminMonthly', value)}
                        prefix="$"
                      />
                      <NumberField
                        id="lease-upfront"
                        label="提车前自付金额"
                        value={inputs.leaseUpfrontOutOfPocket}
                        onChange={(value) =>
                          update('leaseUpfrontOutOfPocket', value)
                        }
                        prefix="$"
                        hint="默认 $0；如 provider 要求订金、首期租金或设立费，请填实际报价"
                      />
                      <NumberField
                        id="lease-residual"
                        label="期末残值比例"
                        value={inputs.leaseResidualPercent}
                        onChange={(value) =>
                          update('leaseResidualPercent', value)
                        }
                        suffix="%"
                        step={0.01}
                        hint={`ATO 最低估算：${formatNumber(result.minimumResidualPercent, 2)}%`}
                      />
                      <NumberField
                        id="vehicle-gst"
                        label="车辆 GST 优惠（估算，可覆盖）"
                        value={inputs.vehicleGstPassedThrough}
                        onChange={(value) => {
                          update('vehicleGstPassedThrough', value);
                          setVehicleGstMode('manual');
                        }}
                        prefix="$"
                        hint={
                          vehicleGstMode === 'manual'
                            ? '当前为手动报价值；切换车型或重新载入参考价会恢复自动估算'
                            : `自动估算按 2026–27 car limit 封顶 ${formatCurrency(MAX_VEHICLE_GST_CREDIT_2026_27)}；实际以 provider 报价为准`
                        }
                      />
                      <NumberField
                        id="running-gst"
                        label="运行费用 GST 优惠 / 年"
                        value={inputs.runningGstPassedThroughAnnual}
                        onChange={(value) =>
                          update('runningGstPassedThroughAnnual', value)
                        }
                        prefix="$"
                      />
                      <NumberField
                        id="post-tax"
                        label="税后扣款 / 月"
                        value={inputs.postTaxContributionMonthly}
                        onChange={(value) =>
                          update('postTaxContributionMonthly', value)
                        }
                        prefix="$"
                        hint="合格 EV 通常为 0；实际报价优先"
                      />
                    </div>
                    <div className="mt-4 rounded-2xl bg-muted/55 p-4">
                      <p className="text-sm font-medium">Lease 额外费用明细</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        以下金额已经进入比较结果，不会再次相加；实际 provider
                        报价优先于本页估算
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            车辆融资扣款 / 月
                          </p>
                          <p className="mt-1 font-semibold">
                            {formatCurrency(result.leasePayment)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            估算融资利息 / 全期
                          </p>
                          <p className="mt-1 font-semibold">
                            {formatCurrency(result.leaseFinanceCharge)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            管理费 / 全期
                          </p>
                          <p className="mt-1 font-semibold">
                            {formatCurrency(result.leaseAdminTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            期末买断（含 GST）
                          </p>
                          <p className="mt-1 font-semibold">
                            {formatCurrency(result.residualPayable)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="running">
                  <AccordionTrigger className="min-h-14 py-4 hover:no-underline">
                    <SectionTitle
                      icon={<Zap />}
                      title="运行成本与期末价值"
                      subtitle="电费、保险、轮胎与转售"
                    />
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <NumberField
                        id="efficiency"
                        label="耗电量"
                        value={inputs.electricityEfficiency}
                        onChange={(value) =>
                          update('electricityEfficiency', value)
                        }
                        suffix="kWh/100km"
                        step={0.1}
                      />
                      <NumberField
                        id="electricity-price"
                        label="综合电价"
                        value={inputs.electricityPrice}
                        onChange={(value) => update('electricityPrice', value)}
                        prefix="$"
                        suffix="/kWh"
                        step={0.01}
                      />
                      <NumberField
                        id="free-charging"
                        label="免费充电比例"
                        value={inputs.freeChargingPercent}
                        onChange={(value) =>
                          update('freeChargingPercent', value)
                        }
                        suffix="%"
                        step={5}
                        hint="La Trobe 充电是否持续免费需另行核实"
                      />
                      <NumberField
                        id="insurance"
                        label="保险 / 年"
                        value={inputs.insuranceAnnual}
                        onChange={(value) => update('insuranceAnnual', value)}
                        prefix="$"
                      />
                      <NumberField
                        id="maintenance"
                        label="保养维修 / 年"
                        value={inputs.maintenanceAnnual}
                        onChange={(value) => update('maintenanceAnnual', value)}
                        prefix="$"
                      />
                      <NumberField
                        id="tyres"
                        label="轮胎成本 / km"
                        value={inputs.tyreCostPerKm}
                        onChange={(value) => update('tyreCostPerKm', value)}
                        prefix="$"
                        step={0.005}
                      />
                      <NumberField
                        id="parking"
                        label="停车及过路费 / 年"
                        value={inputs.parkingAndTollsAnnual}
                        onChange={(value) =>
                          update('parkingAndTollsAnnual', value)
                        }
                        prefix="$"
                      />
                      <NumberField
                        id="home-charger"
                        label="家用充电器及安装（一次性）"
                        value={inputs.homeChargerUpfront}
                        onChange={(value) =>
                          update('homeChargerUpfront', value)
                        }
                        prefix="$"
                        hint="默认作为三种方案都要承担的税后成本"
                      />
                      <NumberField
                        id="other-running"
                        label="其他用车费用 / 年"
                        value={inputs.otherRunningAnnual}
                        onChange={(value) =>
                          update('otherRunningAnnual', value)
                        }
                        prefix="$"
                      />
                      <NumberField
                        id="resale"
                        label="期末车辆价值"
                        value={inputs.resalePercent}
                        onChange={(value) => update('resalePercent', value)}
                        suffix="%"
                        hint="默认按车辆及可保值选装的 55%，不让 duty、rego、TAC 或车牌费参与保值"
                      />
                    </div>

                    <div className="mt-5 rounded-2xl border border-border bg-muted/45 p-4">
                      <div className="flex items-start gap-3">
                        <WalletCards className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <p className="text-sm font-medium">
                            Novated lease 实际打包的运行费用
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            勾选只表示费用通过工资打包支付，并不是免费赠送；未勾选项目仍会作为税后支出计入
                            lease 总成本。
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <PackageToggle
                          id="package-energy"
                          label="充电电费"
                          checked={inputs.leasePackageEnergy}
                          onChange={(checked) =>
                            update('leasePackageEnergy', checked)
                          }
                        />
                        <PackageToggle
                          id="package-registration"
                          label="注册续费"
                          checked={inputs.leasePackageRegistration}
                          onChange={(checked) =>
                            update('leasePackageRegistration', checked)
                          }
                        />
                        <PackageToggle
                          id="package-insurance"
                          label="保险"
                          checked={inputs.leasePackageInsurance}
                          onChange={(checked) =>
                            update('leasePackageInsurance', checked)
                          }
                        />
                        <PackageToggle
                          id="package-maintenance"
                          label="保养维修"
                          checked={inputs.leasePackageMaintenance}
                          onChange={(checked) =>
                            update('leasePackageMaintenance', checked)
                          }
                        />
                        <PackageToggle
                          id="package-tyres"
                          label="轮胎"
                          checked={inputs.leasePackageTyres}
                          onChange={(checked) =>
                            update('leasePackageTyres', checked)
                          }
                        />
                        <PackageToggle
                          id="package-parking"
                          label="停车及过路费"
                          checked={inputs.leasePackageParkingAndTolls}
                          onChange={(checked) =>
                            update('leasePackageParkingAndTolls', checked)
                          }
                        />
                        <PackageToggle
                          id="package-other"
                          label="其他年度用车费用"
                          checked={inputs.leasePackageOtherRunning}
                          onChange={(checked) =>
                            update('leasePackageOtherRunning', checked)
                          }
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Lease 包内运行费
                          </p>
                          <p className="mt-1 font-semibold">
                            {formatCurrency(result.packagedRunningGross)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Lease 包外税后支出
                          </p>
                          <p className="mt-1 font-semibold">
                            {formatCurrency(result.outsidePackageRunning)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>

            <Warnings
              profileIncomplete={profileIncomplete}
              fbtEligible={result.fbtEligible}
              residualBelowMinimum={residualBelowMinimum}
              nearLct={inputs.lctValue > FUEL_EFFICIENT_LCT_THRESHOLD - 5_000}
            />

            <Card>
              <CardHeader>
                <CardTitle>{termLabel}成本拆分</CardTitle>
                <CardDescription>
                  {includeEndValue
                    ? '已用期末车辆价值抵减三种方案成本'
                    : '当前显示持有期内实际承担的全部成本'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <BreakdownBlock
                  title="全款购买"
                  rows={[
                    ['车辆及上路', result.driveAway],
                    [`${termLabel}运行成本`, result.runningTotal],
                    ...endValueRows,
                  ]}
                  total={
                    includeEndValue
                      ? result.cashEconomicCost
                      : result.cashOutflow
                  }
                />
                <BreakdownBlock
                  title="个人车贷"
                  rows={[
                    ['车辆及上路', result.driveAway],
                    [
                      '利息及贷款费用',
                      result.loanOutflow -
                        result.runningTotal -
                        result.driveAway,
                    ],
                    [`${termLabel}运行成本`, result.runningTotal],
                    ...endValueRows,
                  ]}
                  total={
                    includeEndValue
                      ? result.loanEconomicCost
                      : result.loanOutflow
                  }
                />
                <BreakdownBlock
                  title="Novated lease"
                  rows={[
                    ['车辆租赁扣款（税前）', result.leaseFinancePayments],
                    ['Lease 管理费（税前）', result.leaseAdminTotal],
                    [
                      `${termLabel}套餐内运行费原额`,
                      result.packagedRunningGross,
                    ],
                    ['运行费用 GST 优惠', -result.runningGstPassedThrough],
                    ['税后扣款', result.postTaxTotal],
                    [
                      '未打包、需另付的运行费（税后）',
                      result.outsidePackageRunning,
                    ],
                    ['期末买断残值（含 GST）', result.residualPayable],
                    ['所得税节省', -result.incomeTaxSaved],
                    ['Medicare Levy 节省', -result.medicareSaved],
                    ['MLS 变化', result.mlsDelta],
                    ['Super 净损失', result.netSuperLoss],
                    ...endValueRows,
                  ]}
                  total={
                    includeEndValue
                      ? result.leaseEconomicCost
                      : result.leaseCostBeforeResale
                  }
                  note={`这里比较的是税后现金影响，不是车辆发票金额：税前每支付 $1，实际减少的到手工资通常少于 $1，所以合计可能低于现金 drive-away price。车辆 GST 优惠 ${formatCurrency(result.vehicleGstPassedThrough)} 已直接降低 Lease 融资本金，不能再重复相减；负数表示减少成本。`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>已核实规则与来源</CardTitle>
                <CardDescription>
                  法律与费率按日期版本化；报价项目仍由你覆盖
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <SourceLink href="https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/cars-electric-cars-and-fbt">
                  ATO：电动车 FBT 豁免与 RFBA
                </SourceLink>
                <SourceLink href="https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/motor-vehicle-duty-current-rates">
                  Victoria SRO：2026–27 motor vehicle duty
                </SourceLink>
                <SourceLink href="https://www.sro.vic.gov.au/about-us/laws-legal-cases-and-rulings/public-rulings/dutiable-value-new-motor-vehicles">
                  Victoria SRO：新车 dutiable value 包含与排除项目
                </SourceLink>
                <SourceLink href="https://www.vicroads.vic.gov.au/registrations/fees-and-charges/vehicle-fees">
                  VicRoads：2026–27 registration 与 TAC 总额
                </SourceLink>
                <SourceLink href="https://www.tac.vic.gov.au/about-the-tac/our-organisation/transport-accident-charge/transport-accident-charge-premium-rates">
                  TAC：2026–27 强制第三方保障分区费率
                </SourceLink>
                <SourceLink href="https://www.vicroads.vic.gov.au/registrations/fees-and-charges/number-plate-fees">
                  VicRoads：standard plate 首发费用
                </SourceLink>
                <SourceLink href="https://www.gazette.vic.gov.au/gazette/Gazettes2026/GG2026S481.pdf">
                  Victoria Government Gazette：ZLEV 注册优惠暂停至 2027 年 8 月
                  31 日
                </SourceLink>
                <SourceLink href="https://www.latrobe.edu.au/jobs/working/benefits">
                  La Trobe：salary packaging 与 17% employer super
                </SourceLink>
                <SourceLink href="https://www.privatehealth.gov.au/health_insurance/surcharges_incentives/medicare_levy.htm">
                  Australian Government：2026–27 MLS 个人与家庭门槛
                </SourceLink>
                <SourceLink href="https://www.legislation.gov.au/C2004A03351/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html">
                  Federal Register：2026–27 家庭成员个人低收入 MLS 规则
                </SourceLink>
                <SourceLink href="https://moneysmart.gov.au/loans/car-loans">
                  Moneysmart：个人车贷比较要点
                </SourceLink>
                <p className="border-t border-border pt-3 text-xs leading-5">
                  本工具是规划估算，不构成税务、法律、信贷或财务建议。最终决定前，请核对
                  Tesla 订单、La Trobe / provider 报价、薪资合同和个人税务情况。
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-xl lg:hidden">
        <Button
          type="button"
          size="lg"
          className="mx-auto h-12 w-full max-w-md justify-between px-4 text-base"
          onClick={() =>
            document
              .getElementById('assumptions')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          编辑计算条件
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </main>
  );
}

type AnnualCashflowRow = ReturnType<
  typeof calculate
>['annualCashflows'][number];

function CashMoment({
  step,
  title,
  items,
}: {
  step: string;
  title: string;
  items: { label: string; value: number; note: string }[];
}) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          {step}
        </p>
        <p className="mt-1 font-medium">{title}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="min-w-0 rounded-xl border border-border bg-muted/35 p-3"
          >
            <p className="truncate text-xs font-medium text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight tabular-nums sm:text-lg">
              {formatCurrency(item.value)}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              {item.note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnualCashflowChart({
  rows,
  fbtEligible,
  spreadFinalPayments,
  loanBalloon,
  leaseResidual,
}: {
  rows: AnnualCashflowRow[];
  fbtEligible: boolean;
  spreadFinalPayments: boolean;
  loanBalloon: number;
  leaseResidual: number;
}) {
  const termMonths = Math.max(
    1,
    rows.reduce((sum, row) => sum + row.months, 0),
  );

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const loanBalloonReserve = spreadFinalPayments
          ? (loanBalloon * row.months) / termMonths
          : 0;
        const leaseResidualReserve = spreadFinalPayments
          ? (leaseResidual * row.months) / termMonths
          : 0;
        const methods = [
          { label: '全款', value: row.cashCashImpact, color: 'bg-slate-500' },
          {
            label: '车贷',
            value: row.loanCashImpact + loanBalloonReserve,
            color: 'bg-amber-500',
          },
          {
            label: 'Lease',
            value: row.leaseCashImpact + leaseResidualReserve,
            color: 'bg-primary',
          },
        ];
        const maximum = Math.max(1, ...methods.map((method) => method.value));
        return (
          <div
            key={row.year}
            className="rounded-xl border border-border bg-muted/25 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                第 {row.year} 年
                {row.months < 12 ? `（${row.months} 个月）` : ''}
              </p>
              {row.year === rows.length ? (
                <span className="text-[11px] text-muted-foreground">
                  尾款见下一段
                </span>
              ) : null}
            </div>
            <div className="space-y-2.5">
              {methods.map((method) => (
                <div
                  key={method.label}
                  className="grid grid-cols-[3.1rem_minmax(0,1fr)_4.9rem] items-center gap-2"
                >
                  <span className="text-xs text-muted-foreground">
                    {method.label}
                  </span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${method.color}`}
                      style={{
                        width: `${Math.max(3, (method.value / maximum) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-right text-xs font-semibold tabular-nums">
                    {method.label === 'Lease' && !fbtEligible
                      ? '需核实'
                      : formatCurrency(method.value)}
                  </span>
                </div>
              ))}
            </div>
            {spreadFinalPayments ? (
              <p className="mt-3 rounded-lg bg-background/70 px-2.5 py-2 text-[11px] leading-4 text-muted-foreground">
                本年尾款预留：车贷 balloon{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(loanBalloonReserve)}
                </span>{' '}
                · Lease 残值{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(leaseResidualReserve)}
                </span>
              </p>
            ) : null}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span>全款：运行费</span>
        <span>
          车贷：还款 + 费用 + 运行费
          {spreadFinalPayments ? ' + balloon 预留' : ''}
        </span>
        <span>
          Lease：税后工资影响 + 包外运行费
          {spreadFinalPayments ? ' + 残值预留' : ''}
        </span>
      </div>
    </div>
  );
}

function LeaseRunningCostChart({ rows }: { rows: AnnualCashflowRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const gross = Math.max(1, row.runningTotal);
        const saved = Math.max(
          0,
          row.runningTotal - row.leaseRunningAfterTaxEquivalent,
        );
        const equivalentWidth = Math.max(
          2,
          (row.leaseRunningAfterTaxEquivalent / gross) * 100,
        );
        return (
          <div
            key={row.year}
            className="rounded-xl border border-border bg-muted/25 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">第 {row.year} 年运行费</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatCurrency(row.leaseRunningAfterTaxEquivalent)}
                <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                  税后等效
                </span>
              </p>
            </div>
            <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                style={{ width: `${Math.min(100, equivalentWidth)}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">现金 / 车贷运行费</p>
                <p className="mt-0.5 font-semibold tabular-nums">
                  {formatCurrency(row.runningTotal)}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
              <div className="text-right">
                <p className="text-muted-foreground">Lease 税后等效</p>
                <p className="mt-0.5 font-semibold tabular-nums text-primary">
                  {formatCurrency(row.leaseRunningAfterTaxEquivalent)}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs leading-5 text-emerald-900 dark:bg-emerald-950/45 dark:text-emerald-200">
              预计节省 {formatCurrency(saved)}：税前打包{' '}
              {formatCurrency(row.leasePackagedRunningPreTax)}，其中税务节省{' '}
              {formatCurrency(row.leaseRunningTaxSaved)}
              {row.leaseRunningGstPassedThrough > 0
                ? `，另有 GST 优惠 ${formatCurrency(row.leaseRunningGstPassedThrough)}`
                : ''}
              {row.leaseOutsidePackageRunning > 0
                ? `；套餐外仍需税后支付 ${formatCurrency(row.leaseOutsidePackageRunning)}`
                : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DifferenceSummary({
  title,
  difference,
  rows,
}: {
  title: string;
  difference: number;
  rows: { label: string; value: number }[];
}) {
  const visibleRows = rows.filter((row) => Math.abs(row.value) >= 1);
  const maximum = Math.max(1, ...visibleRows.map((row) => Math.abs(row.value)));
  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            相同车辆、里程及持有期
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            difference > 1
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              : difference < -1
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground'
          }`}
        >
          {difference > 1
            ? `净多付 ${formatCurrency(difference)}`
            : difference < -1
              ? `净节省 ${formatCurrency(Math.abs(difference))}`
              : '基本持平'}
        </span>
      </div>
      <div className="space-y-2.5 rounded-xl bg-muted/35 p-3">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{row.label}</span>
                <span
                  className={`font-semibold tabular-nums ${
                    row.value < 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {formatSignedCurrency(row.value)}
                </span>
              </div>
              <div className="relative h-2">
                <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                <div
                  className={`absolute inset-y-0 rounded-full ${
                    row.value < 0
                      ? 'right-1/2 bg-emerald-500'
                      : 'left-1/2 bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.max(2, (Math.abs(row.value) / maximum) * 50)}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">没有额外融资成本</p>
        )}
      </div>
    </div>
  );
}

function AssumptionPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-card px-3 py-2 font-medium">
      {children}
    </span>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <span className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-primary [&_svg]:size-4">
        {icon}
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
          {subtitle}
        </span>
      </span>
    </span>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  step = 1,
  className = '',
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  step?: number;
  className?: string;
}) {
  const describedBy = hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-2">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          aria-describedby={describedBy}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`h-11 bg-card text-base md:text-base ${prefix ? 'pl-7' : ''} ${
            suffix ? 'pr-20' : ''
          }`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p
          id={describedBy}
          className="mt-1.5 text-xs leading-4 text-muted-foreground"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  hint,
  className = '',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full [&_select]:h-11 [&_select]:bg-card [&_select]:text-base"
      >
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {hint ? (
        <p className="mt-1.5 text-xs leading-4 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function PackageToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 text-sm font-medium"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(nextChecked) => onChange(Boolean(nextChecked))}
      />
      <span>{label}</span>
    </label>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="gap-2 py-3">
      <CardContent className="px-3">
        <span className="mb-3 grid size-8 place-items-center rounded-xl bg-accent text-primary [&_svg]:size-4">
          {icon}
        </span>
        <p className="text-xs leading-4 text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  muted = false,
  good = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  good?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-right text-sm font-semibold ${
          muted
            ? 'text-muted-foreground'
            : good
              ? 'text-primary'
              : 'text-foreground'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Warnings({
  profileIncomplete,
  fbtEligible,
  residualBelowMinimum,
  nearLct,
}: {
  profileIncomplete: boolean;
  fbtEligible: boolean;
  residualBelowMinimum: boolean;
  nearLct: boolean;
}) {
  const warnings = [
    profileIncomplete
      ? 'HELP、私人住院保险或家庭状态尚未完整填写；相关现金流影响未完全进入主结果。'
      : null,
    !fbtEligible
      ? '当前 LCT value 达到或超过燃油效率车辆门槛；不能按 EV FBT 全额豁免结果作决定。'
      : null,
    nearLct && fbtEligible
      ? '车辆接近 LCT 门槛；选装、交付费或改装可能改变 FBT 资格，请以供应商确认的 LCT value 为准。'
      : null,
    residualBelowMinimum
      ? '输入残值低于 ATO 公式估算的最低比例，请用 provider 的合规报价核对。'
      : null,
  ].filter(Boolean) as string[];

  if (warnings.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-accent p-4 text-sm">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium">主要资料已填写</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            仍需用 Tesla 最终订单及 salary packaging 报价替换参考值。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-[#fff4de] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-950">
        <AlertTriangle className="size-4" /> 需要留意
      </div>
      <ul className="mt-3 space-y-2 text-xs leading-5 text-amber-950/75">
        {warnings.map((warning) => (
          <li key={warning} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>{warning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BreakdownBlock({
  title,
  rows,
  total,
  note,
}: {
  title: string;
  rows: [string, number][];
  total: number;
  note?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="font-medium">{title}</p>
        <p className="font-semibold">{formatCurrency(total)}</p>
      </div>
      <div className="space-y-1.5 rounded-xl bg-muted/55 p-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className={value < 0 ? 'text-primary' : ''}>
              {formatCurrency(value)}
            </span>
          </div>
        ))}
      </div>
      {note ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border px-3 font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>{children}</span>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
    </a>
  );
}

function formatSignedCurrency(value: number) {
  if (Math.abs(value) < 1) return formatCurrency(0);
  return `${value > 0 ? '+' : '−'}${formatCurrency(Math.abs(value))}`;
}
