"use client";

import { addDays, formatLong, formatShort, parseDayKey, todayKey } from "@/lib/dates";
import { challengeDayNumber, type Challenge } from "@/lib/types";
import { currentChallengePhase, resolveChallengePhases } from "@/lib/phases";
import { WinterLandscape } from "@/components/identity";
import { PhaseOverview } from "./PhaseOverview";

export function ChallengeCalendar({ challenge, selected, onSelect, onPlan }: {
  challenge: Challenge;
  selected: string;
  onSelect: (date: string) => void;
  onPlan: () => void;
}) {
  const now = new Date();
  const today = todayKey();
  const day = challengeDayNumber(challenge, now);
  const length = challenge.duration_days;
  const selectedDay = challengeDayNumber(challenge, parseDayKey(selected));
  const page = Math.floor((Math.max(1, Math.min(length, selectedDay)) - 1) / 7);
  const first = page * 7 + 1;
  const last = Math.min(length, first + 6);
  const dateFor = (n: number) => addDays(challenge.start_date, n - 1);
  const phase = currentChallengePhase(challenge, now);
  const phases = resolveChallengePhases(challenge, now);

  return (
    <section aria-label="Challenge" className="surface overflow-hidden">
      <div className="challenge-cover">
        <WinterLandscape />
        <div className="relative max-w-[78%]">
          <p className="challenge-caption text-[#dae8b6]">{challenge.title}</p>
          <h1 className="display-title mt-2">
            {day < 1 ? "Upcoming challenge" : day > length ? "Challenge complete" : <>Day {day}<span className="text-[.56em]"> of {length}</span></>}
          </h1>
          <p className="mt-2 text-sm text-[#e0e7d6]">
            {day < 1 ? `Starts ${formatLong(challenge.start_date)}` : day > length ? `Ended ${formatLong(dateFor(length))}` : phase ? `${phase.def.name} · ${formatShort(today)}` : formatShort(today)}
          </p>
          {challenge.subtitle && <p className="mt-1 text-sm text-[#e0e7d6]">{challenge.subtitle}</p>}
        </div>
      </div>
      <div className="card-pad">
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <h2 className="section-title">Challenge days {first}–{last}</h2>
          <div className="flex gap-1">
            <button type="button" className="btn-ghost !px-3" disabled={first === 1}
              aria-label="Previous challenge week" onClick={() => onSelect(dateFor(first - 7))}>←</button>
            <button type="button" className="btn-ghost !px-3" disabled={last === length}
              aria-label="Next challenge week" onClick={() => onSelect(dateFor(last + 1))}>→</button>
          </div>
        </div>
        <div className="day-rail" role="group" aria-label="Select a challenge day">
          {Array.from({ length: last - first + 1 }, (_, offset) => {
            const n = first + offset;
            const key = dateFor(n);
            return (
              <button key={key} type="button" className="rail-date"
                aria-label={`Day ${n}, ${formatLong(key)}`}
                aria-current={key === today ? "date" : undefined}
                aria-pressed={key === selected} onClick={() => onSelect(key)}>
                <span>{parseDayKey(key).toLocaleDateString(undefined, { weekday: "short" })}</span>
                <strong>{Number(key.slice(-2))}</strong>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          {phases && <details className="min-w-0 flex-1"><summary className="cursor-pointer py-3 text-sm font-medium t-secondary">Challenge phases</summary><PhaseOverview phases={phases} /></details>}
          <button className="btn-secondary ml-auto" onClick={onPlan}>Plan tomorrow</button>
        </div>
      </div>
    </section>
  );
}
