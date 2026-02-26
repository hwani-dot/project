"use client";

/**
 * 생년월일 전용 DatePicker
 * - react-day-picker + shadcn Calendar + Popover 조합
 * - 연도/월 드롭다운으로 즉시 이동 (1950~현재)
 * - Tab/Enter 키보드 접근성 지원
 */
import * as React from "react";
import { format, parse } from "date-fns";
import { ko } from "date-fns/locale";
import { ko as dayPickerKo } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const START_YEAR = 1950;

function defaultBirth(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return d;
}

export interface BirthDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  max?: Date;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function BirthDatePicker({
  value,
  onChange,
  max = new Date(),
  disabled,
  className,
  placeholder = "2001-12-27",
}: BirthDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  const startMonth = new Date(START_YEAR, 0);
  const endMonth = new Date(max.getFullYear(), max.getMonth(), max.getDate());

  const handleSelect = (d: Date | undefined) => {
    if (!d) return;
    onChange(format(d, "yyyy-MM-dd"));
    setOpen(false);
  };

  const displayText = date
    ? format(date, "yyyy년 M월 d일", { locale: ko })
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm",
            "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !date && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-base" aria-hidden>🎂</span>
            {displayText ?? (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date ?? defaultBirth()}
          startMonth={startMonth}
          endMonth={endMonth}
          captionLayout="dropdown"
          reverseYears
          locale={dayPickerKo}
          disabled={{ after: max }}
          formatters={{
            formatMonthDropdown: (d) =>
              d.toLocaleString("ko-KR", { month: "long" }),
            formatYearDropdown: (d) => `${d.getFullYear()}년`,
          }}
          className="rounded-md border-0"
        />
      </PopoverContent>
    </Popover>
  );
}
