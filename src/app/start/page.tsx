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
import { X } from "lucide-react";
import { FORTUNE_PROFILE_KEY } from "@/lib/profile";

const RELATION_OPTIONS = [
  { value: "본인", label: "본인" },
  { value: "가족", label: "가족" },
  { value: "친구", label: "친구" },
  { value: "연인", label: "연인" },
  { value: "기타", label: "기타" },
];

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
}

const defaultForm: StartFormState = {
  name: "",
  relation: "본인",
  birth: defaultBirth(),
  timeKnown: "no",
  birthTime: "",
  calendarType: "solar",
  gender: "",
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
      interests: [],
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

  return (
    <main className="min-h-screen flex flex-col bg-gray-100">
      {/* 상단 초록 헤더 52~60px */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 bg-[#2e7d32] text-white">
        <span className="text-base font-medium">정보 입력</span>
        <Link
          href="/"
          className="p-2 -m-2 rounded hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="홈으로 닫기"
        >
          <X className="w-5 h-5" />
        </Link>
      </header>

      <div className="flex-1 overflow-auto py-6 px-4">
        <div className="max-w-lg mx-auto bg-white border border-gray-300 rounded-sm shadow-sm">
          {step === "form" && (
            <form
              className="p-6 space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                goToConfirm();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-800">
                  이름
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="이름"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-10 border-gray-300 rounded-sm bg-white"
                />
              </div>

              <hr className="border-gray-200" />

              <div className="space-y-2">
                <Label htmlFor="relation" className="text-sm font-medium text-gray-800">
                  관계
                </Label>
                <Select
                  value={form.relation}
                  onValueChange={(v) => setForm((f) => ({ ...f, relation: v }))}
                >
                  <SelectTrigger id="relation" className="h-10 border-gray-300 rounded-sm bg-white">
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

              <hr className="border-gray-200" />

              <div className="space-y-2">
                <Label htmlFor="birth" className="text-sm font-medium text-gray-800">
                  생년월일
                </Label>
                <Input
                  id="birth"
                  type="date"
                  value={form.birth}
                  onChange={(e) => setForm((f) => ({ ...f, birth: e.target.value || defaultBirth() }))}
                  max={new Date().toISOString().slice(0, 10)}
                  className="h-10 border-gray-300 rounded-sm bg-white"
                />
              </div>

              <hr className="border-gray-200" />

              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-800 block">태어난 시간 아시나요?</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeKnown"
                      checked={form.timeKnown === "yes"}
                      onChange={() => setForm((f) => ({ ...f, timeKnown: "yes", birthTime: f.birthTime || "00:00" }))}
                      className="border-gray-400 text-green-700 focus:ring-green-600"
                    />
                    <span className="text-sm text-gray-700">예</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeKnown"
                      checked={form.timeKnown === "no"}
                      onChange={() => setForm((f) => ({ ...f, timeKnown: "no", birthTime: "" }))}
                      className="border-gray-400 text-green-700 focus:ring-green-600"
                    />
                    <span className="text-sm text-gray-700">아니요</span>
                  </label>
                </div>
                {form.timeKnown === "yes" && (
                  <div className="pt-1">
                    <Input
                      type="time"
                      value={form.birthTime}
                      onChange={(e) => setForm((f) => ({ ...f, birthTime: e.target.value }))}
                      className="h-10 w-36 border-gray-300 rounded-sm bg-white"
                    />
                  </div>
                )}
                {form.timeKnown === "no" && (
                  <div className="py-2 px-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
                    시간 모름으로 저장됩니다.
                  </div>
                )}
              </div>

              <hr className="border-gray-200" />

              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-800 block">달력 종류</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="calendarType"
                      checked={form.calendarType === "solar"}
                      onChange={() => setForm((f) => ({ ...f, calendarType: "solar" }))}
                      className="border-gray-400 text-green-700 focus:ring-green-600"
                    />
                    <span className="text-sm text-gray-700">양력</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="calendarType"
                      checked={form.calendarType === "lunar"}
                      onChange={() => setForm((f) => ({ ...f, calendarType: "lunar" }))}
                      className="border-gray-400 text-green-700 focus:ring-green-600"
                    />
                    <span className="text-sm text-gray-700">음력</span>
                  </label>
                </div>
              </div>

              <hr className="border-gray-200" />

              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-800 block">성별</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={form.gender === "male"}
                      onChange={() => setForm((f) => ({ ...f, gender: "male" }))}
                      className="border-gray-400 text-green-700 focus:ring-green-600"
                    />
                    <span className="text-sm text-gray-700">남자</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={form.gender === "female"}
                      onChange={() => setForm((f) => ({ ...f, gender: "female" }))}
                      className="border-gray-400 text-green-700 focus:ring-green-600"
                    />
                    <span className="text-sm text-gray-700">여자</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 bg-white border-gray-800 text-gray-900 hover:bg-gray-50 rounded-sm"
                  onClick={() => router.push("/")}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-[#fdd835] text-gray-900 hover:bg-[#fbc02d] font-medium rounded-sm border-0"
                >
                  저장하기
                </Button>
              </div>
            </form>
          )}

          {step === "confirm" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">입력하신 내용이 맞나요?</h2>
              <p className="text-sm text-gray-600 mt-1">한번 저장하면 수정이 어려워요!</p>

              <div className="mt-6 border border-gray-200 rounded-sm overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2.5 px-3 w-28 font-medium text-gray-700">이름</th>
                      <td className="py-2.5 px-3 text-gray-900">{form.name?.trim() || "-"}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 px-3 font-medium text-gray-700">관계</th>
                      <td className="py-2.5 px-3 text-gray-900">{form.relation}</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2.5 px-3 font-medium text-gray-700">생년월일</th>
                      <td className="py-2.5 px-3 text-gray-900">
                        {formatBirthDisplay(form.birth, form.calendarType)}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 px-3 font-medium text-gray-700">태어난 시간</th>
                      <td className="py-2.5 px-3 text-gray-900">
                        {form.timeKnown === "yes" && form.birthTime ? form.birthTime : "모름"}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <th className="text-left py-2.5 px-3 font-medium text-gray-700">성별</th>
                      <td className="py-2.5 px-3 text-gray-900">
                        {form.gender === "male" ? "남자" : form.gender === "female" ? "여자" : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 bg-white border-gray-800 text-gray-900 hover:bg-gray-50 rounded-sm"
                  onClick={goBackToForm}
                >
                  수정하기
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-11 bg-[#fdd835] text-gray-900 hover:bg-[#fbc02d] font-medium rounded-sm border-0"
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
        <main className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="animate-pulse text-gray-500 text-sm">로딩 중...</div>
        </main>
      }
    >
      <StartContent />
    </Suspense>
  );
}
