"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useCalendarData } from "@/components/calendar/useCalendarData";
import { useTraining } from "@/components/training/useTraining";
import { DayView } from "@/components/calendar/DayView";
import { WeekView } from "@/components/calendar/WeekView";
import { MonthView } from "@/components/calendar/MonthView";
import { PlanTomorrow } from "@/components/calendar/PlanTomorrow";
import { EmptyState, ErrorState, LoadingBlock, SegControl } from "@/components/ui";
import { addDays, addMonthsClamped, isToday, todayKey, validDayKey } from "@/lib/dates";
import { useSearchParams } from "next/navigation";
import { ChallengeCalendar } from "@/components/challenge/ChallengeCalendar";
import { engine } from "@/lib/sync/engine";
import { GoogleCalendarProvider } from "@/lib/calendar-providers/google";
import { triggerGoogleSync } from "@/lib/calendar-providers/googleSyncClient";
import { readMetaCache } from "@/lib/calendar-providers/googleMeta";
import Link from "next/link";

type View = "day" | "week" | "month";

/** Re-sync at most this often when the calendar page opens. */
const AUTO_SYNC_STALE_MS = 15 * 60 * 1000;

function rangeFor(view: View, dateKey: string): [string, string] {
  if (view === "day") return [addDays(dateKey, -1), addDays(dateKey, 2)];
  if (view === "week") return [addDays(dateKey, -7), addDays(dateKey, 7)];
  return [dateKey.slice(0, 8) + "01", addDays(dateKey.slice(0, 8) + "01", 45)];
}

export default function CalendarPage() {
  return <Suspense fallback={<LoadingBlock />}><CalendarEntry /></Suspense>;
}

function CalendarEntry() {
  const date = useSearchParams().get("date");
  const initialDate = validDayKey(date) ? date : todayKey();
  return <Calendar key={date ?? "today"} initialDate={initialDate} />;
}

function Calendar({ initialDate }: { initialDate: string }) {
  const [view, setView] = useState<View>("day");
  const [dateKey, setDateKey] = useState(initialDate);
  const [planning, setPlanning] = useState(false);

  const [startKey, endKey] = useMemo(
    () => rangeFor(view, dateKey),
    [view, dateKey]
  );
  const data = useCalendarData(startKey, endKey);
  const training = useTraining(startKey, endKey);

  // V4.3.2: auto-sync Google events when the page opens — only when Google
  // is connected (lightweight meta-cache check), the device is online, and
  // the last sync is missing or older than 15 minutes. Best-effort: the
  // calendar opens fine even if this never runs.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await engine.whenReady();
        if (cancelled) return;
        const userId = engine.getSnapshot().userId;
        if (!userId) return;
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          return;
        }
        const meta = await readMetaCache(userId);
        if (cancelled || meta?.status !== "connected") return;
        const provider = new GoogleCalendarProvider(
          undefined,
          () => engine.getSnapshot().userId
        );
        const sync = await provider.getSyncStatus();
        const last = sync.lastSyncedAt ? Date.parse(sync.lastSyncedAt) : NaN;
        if (
          !sync.lastSyncedAt ||
          Number.isNaN(last) ||
          Date.now() - last > AUTO_SYNC_STALE_MS
        ) {
          await triggerGoogleSync(provider);
          // The engine pull bumps the sync tick, so useCalendarData reloads
          // (and re-tags synced events) on its own.
        }
      } catch {
        // Auto-sync is best-effort; never break the calendar over it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const challenge = data.challenge;
  function selectDay(key: string) {
    setDateKey(key);
    setView("day");
  }

  function moveDate(direction: number) {
    setDateKey((current) => view === "month" ? addMonthsClamped(current, direction)
      : addDays(current, direction * (view === "week" ? 7 : 1)));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* challenge banner */}
      {data.loading ? <LoadingBlock label="Loading your calendar…" /> : challenge ? (
        <ChallengeCalendar challenge={challenge} selected={dateKey} onSelect={selectDay} onPlan={() => setPlanning(true)} />
      ) : data.error ? null : (
          <EmptyState
            title="No active challenge"
            body="Create your 30-day challenge to anchor everything around it."
            action={
              <Link href="/settings" className="btn-primary">
                Create challenge
              </Link>
            }
          />
      )}

      {/* view controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <SegControl<View>
          ariaLabel="Calendar view"
          value={view}
          onChange={setView}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost !px-3"
            onClick={() => moveDate(-1)}
            aria-label="Previous"
          >
            ←
          </button>
          {!isToday(dateKey) && (
            <button className="btn-ghost !px-3" onClick={() => setDateKey(todayKey())}>
              Today
            </button>
          )}
          <button
            className="btn-ghost !px-3"
            onClick={() => moveDate(1)}
            aria-label="Next"
          >
            →
          </button>
        </div>
      </div>

      {data.error ? (
        <ErrorState message={data.error} onRetry={data.refresh} />
      ) : data.loading ? null : view === "day" ? (
        <DayView dateKey={dateKey} data={data} training={training} />
      ) : view === "week" ? (
        <WeekView
          dateKey={dateKey}
          data={data}
          training={training}
          onSelectDay={selectDay}
        />
      ) : (
        <MonthView
          dateKey={dateKey}
          data={data}
          training={training}
          onSelectDay={selectDay}
        />
      )}

      {planning && (
        <PlanTomorrow
          todayKey={todayKey()}
          data={data}
          onClose={() => {
            setPlanning(false);
            data.refresh();
          }}
        />
      )}
    </div>
  );
}
