"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BirthDatePicker } from "@/components/start/BirthDatePicker";
import { X, User } from "lucide-react";
import { FORTUNE_PROFILE_KEY } from "@/lib/profile";
import { cn } from "@/lib/utils";

const RELATION_OPTIONS = [
  { value: "본인", label: "본인" },
  { value: "가족", label: "가족" },
  { value: "친구", label: "친구" },
  { value: "연인", label: "연인" },
  { value: "기타", label: "기타" },
];

const INTEREST_EXAMPLES = ["운세", "타로", "연애", "운동", "취업", "직장", "경제"];

/** 깨진 문자열(물음표만 있는 경우 등) 제외 - 추천/선택 관심사에 노출되지 않도록 */
function isValidInterest(s: string): boolean {
  return typeof s === "string" && s.trim().length > 0 && !/^\?+$/.test(s.trim());
}

function defaultBirth(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return d.toISOString().slice(0, 10);
}

export interface StartFormState {
  name: string;
  relation: string;
  birth: string;
  timeKnown: "yes" | "no";
  birthTime: string;
  calendarType: "solar" | "lunar";
  gender: string;
  interests: string[];
}

const defaultForm: StartFormState = {
  name: "",
  relation: "본인",
  birth: defaultBirth(),
  timeKnown: "no",
  birthTime: "",
  calendarType: "solar",
  gender: "",
  interests: [],
};

function formatBirthDisplay(birth: string, calendarType: string): string {
  if (!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return "-";
  const [y, m, d] = birth.split("-");
  const cal = calendarType === "lunar" ? " (음력)" : " (양력)";
  return `${y}년 ${m}월 ${d}일${cal}`;
}

function StartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const service = searchParams.get("service") ?? "today";
  const nextPath = searchParams.get("next");

  const [step, setStep] = useState<"form" | "confirm">("form");
  const [form, setForm] = useState<StartFormState>(defaultForm);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(FORTUNE_PROFILE_KEY) : null;
      if (raw) {
        const p = JSON.parse(raw) as Record<string, unknown>;
        const name = (p.name as string) ?? (p.nickname as string) ?? "";
        const birth =
          typeof p.birth === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.birth)
            ? p.birth
            : p.birthYear != null && p.birthMonth != null && p.birthDay != null
              ? `${p.birthYear}-${String(Number(p.birthMonth)).padStart(2, "0")}-${String(Number(p.birthDay)).padStart(2, "0")}`
              : defaultBirth();
        setForm({
          name,
          relation: (p.relation as string) ?? "본인",
          birth,
          timeKnown: (p.timeUnknown as boolean) ? "no" : (p.birthTime ? "yes" : "no"),
          birthTime: (p.birthTime as string) ?? "",
          calendarType: (p.calendarType as "solar" | "lunar") ?? "solar",
          gender: (p.gender as string) ?? "",
          interests: Array.isArray(p.interests) ? p.interests.filter(isValidInterest) : [],
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const goToConfirm = () => setStep("confirm");
  const goBackToForm = () => setStep("form");

  const doSaveAndRedirect = () => {
    const birth = form.birth || defaultBirth();
    const [y, m, d] = birth.split("-").map(Number);
    const timeUnknown = form.timeKnown === "no";
    const payload: Record<string, unknown> = {
      name: form.name?.trim() || "방문자",
      nickname: form.name?.trim() || "방문자",
      relation: form.relation,
      birth,
      birthYear: y,
      birthMonth: m,
      birthDay: d,
      timeUnknown,
      calendarType: form.calendarType,
      gender: form.gender || undefined,
      interests: (form.interests || []).filter(isValidInterest),
    };
    if (!timeUnknown && form.birthTime?.trim()) {
      payload.birthTime = form.birthTime.trim();
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(FORTUNE_PROFILE_KEY, JSON.stringify(payload));
    }
    const target =
      nextPath && nextPath.startsWith("/")
        ? nextPath
        : service === "today"
          ? "/service/today"
          : service === "tarot"
            ? "/service/tarot"
            : service === "ohahasa"
              ? "/service/ohahasa"
              : "/service/today";
    router.push(target);
  };

  const cardClass =
    "max-w-lg mx-auto rounded-2xl border border-border bg-card shadow-lg shadow-black/5 dark:shadow-black/20";

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-4 py-8 overflow-auto">
        <div className={cardClass}>
          <div className="flex items-start justify-between gap-4 rounded-t-2xl border-b border-border bg-gradient-to-br from-indigo-50/80 to-violet-50/50 dark:from-indigo-950/30 dark:to-violet-950/20 px-6 py-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 dark:bg-indigo-500/30 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">정보 입력</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  한 번만 입력하면 저장돼요
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="p-2 -m-2 rounded-lg hover:bg-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0"
              aria-label="홈으로 닫기"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>

          {step === "form" && (
            <form
              className="p-6 space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                goToConfirm();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  이름
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="이름"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relation" className="text-sm font-medium">
                  관계
                </Label>
                <Select
                  value={form.relation}
                  onValueChange={(v) => setForm((f) => ({ ...f, relation: v }))}
                >
                  <SelectTrigger id="relation" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">생년월일</Label>
                <BirthDatePicker
                  value={form.birth}
                  onChange={(v) => setForm((f) => ({ ...f, birth: v || defaultBirth() }))}
                  max={new Date()}
                  placeholder="2001-12-27"
                />
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium block">태어난 시간 아시나요?</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeKnown"
                      checked={form.timeKnown === "yes"}
                      onChange={() => setForm((f) => ({ ...f, timeKnown: "yes", birthTime: f.birthTime || "00:00" }))}
                      className="border-input text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">예</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeKnown"
                      checked={form.timeKnown === "no"}
                      onChange={() => setForm((f) => ({ ...f, timeKnown: "no", birthTime: "" }))}
                      className="border-input text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">아니요</span>
                  </label>
                </div>
                {form.timeKnown === "yes" && (
                  <div className="pt-1">
                    <Input
                      type="time"
                      value={form.birthTime}
                      onChange={(e) => setForm((f) => ({ ...f, birthTime: e.target.value }))}
                      className="h-10 w-36"
                    />
                  </div>
                )}
                {form.timeKnown === "no" && (
                  <div className="py-2 px-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    시간 모름으로 저장됩니다.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium block">달력 종류</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="calendarType"
                      checked={form.calendarType === "solar"}
                      onChange={() => setForm((f) => ({ ...f, calendarType: "solar" }))}
                      className="border-input text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">양력</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="calendarType"
                      checked={form.calendarType === "lunar"}
                      onChange={() => setForm((f) => ({ ...f, calendarType: "lunar" }))}
                      className="border-input text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">음력</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium block">성별</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={form.gender === "male"}
                      onChange={() => setForm((f) => ({ ...f, gender: "male" }))}
                      className="border-input text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">남자</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={form.gender === "female"}
                      onChange={() => setForm((f) => ({ ...f, gender: "female" }))}
                      className="border-input text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">여자</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">관심사</Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_EXAMPLES.filter(isValidInterest).map((ex) => {
                    const isSelected = form.interests.includes(ex);
                    return (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            interests: isSelected
                              ? f.interests.filter((i) => i !== ex)
                              : [...f.interests, ex],
                          }));
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm transition-colors",
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        )}
                      >
                        {ex}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="직접 입력 후 Enter"
                    className="h-9 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = (e.target as HTMLInputElement).value.trim();
                        if (v && isValidInterest(v) && !form.interests.includes(v)) {
                          setForm((f) => ({ ...f, interests: [...f.interests, v] }));
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                  />
                </div>
                {form.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.interests.filter(isValidInterest).map((i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs"
                      >
                        {i}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, interests: f.interests.filter((x) => x !== i) }))
                          }
                          className="hover:text-indigo-900 dark:hover:text-indigo-100"
                          aria-label="제거"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 h-11"
                  onClick={() => router.push("/")}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className={cn(
                    "flex-1 h-11 font-medium",
                    "bg-indigo-600 hover:bg-indigo-700 text-white",
                    "dark:bg-indigo-600 dark:hover:bg-indigo-700"
                  )}
                >
                  저장하기
                </Button>
              </div>
            </form>
          )}

          {step === "confirm" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground">입력하신 내용이 맞나요?</h2>
              <p className="text-sm text-muted-foreground mt-1">한번 저장하면 수정이 어려워요!</p>

              <div className="mt-6 rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 w-28 font-medium text-muted-foreground">이름</th>
                      <td className="py-3 px-4 text-foreground">{form.name?.trim() || "-"}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">관계</th>
                      <td className="py-3 px-4 text-foreground">{form.relation}</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">생년월일</th>
                      <td className="py-3 px-4 text-foreground">
                        {formatBirthDisplay(form.birth, form.calendarType)}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">태어난 시간</th>
                      <td className="py-3 px-4 text-foreground">
                        {form.timeKnown === "yes" && form.birthTime ? form.birthTime : "모름"}
                      </td>
                    </tr>
                    <tr className="bg-muted/30">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">성별</th>
                      <td className="py-3 px-4 text-foreground">
                        {form.gender === "male" ? "남자" : form.gender === "female" ? "여자" : "-"}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">관심사</th>
                      <td className="py-3 px-4 text-foreground">
                        {form.interests?.filter(isValidInterest).length ? form.interests.filter(isValidInterest).join(", ") : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 h-11"
                  onClick={goBackToForm}
                >
                  수정하기
                </Button>
                <Button
                  type="button"
                  className={cn(
                    "flex-1 h-11 font-medium",
                    "bg-indigo-600 hover:bg-indigo-700 text-white",
                    "dark:bg-indigo-600 dark:hover:bg-indigo-700"
                  )}
                  onClick={doSaveAndRedirect}
                >
                  맞습니다
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function StartPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground text-sm">로딩 중...</div>
        </main>
      }
    >
      <StartContent />
    </Suspense>
  );
}
