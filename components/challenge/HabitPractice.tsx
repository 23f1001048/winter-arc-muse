"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Field, Modal } from "@/components/ui";
import { HabitForm } from "@/components/habits/HabitForm";
import type { CalendarData } from "@/components/calendar/useCalendarData";
import { guideForDay } from "@/lib/challengeGuide";
import { addDays, todayKey } from "@/lib/dates";
import { toggleHabitDone } from "@/lib/habits";
import { getDb, getPort } from "@/lib/sync/write";
import type { Challenge, Habit, HabitLog } from "@/lib/types";

interface FocusPlan {
  habitId: string;
  cue: string;
  minimum: string;
}

function PlanForm({ habits, initial, save, addHabit, cancel }: {
  habits: Habit[];
  initial: FocusPlan | null;
  save: (plan: FocusPlan) => Promise<void>;
  addHabit: () => void;
  cancel?: () => void;
}) {
  const [habitId, setHabitId] = useState(habits.find(h => h.id === initial?.habitId)?.id ?? habits[0]?.id ?? "");
  const [cue, setCue] = useState(initial?.cue ?? "");
  const [minimum, setMinimum] = useState(initial?.minimum ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!habits.some(h => h.id === habitId) || !cue.trim() || !minimum.trim()) return;
    setBusy(true);
    try {
      await save({ habitId, cue: cue.trim(), minimum: minimum.trim() });
    } catch {
      setError("Could not save the plan on this device. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="grid gap-3" onSubmit={submit}>
      <p className="text-sm t-secondary">Choose a repeat so small you could do it on a busy day.</p>
      <div>
        <Field label="Focus habit">
          <select className="input" value={habitId} onChange={e => setHabitId(e.target.value)} required>
            {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </Field>
        <button className="btn-ghost mt-1" type="button" onClick={addHabit}>Add a new habit</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="After I…"><input className="input" value={cue} onChange={e => setCue(e.target.value)} maxLength={180} placeholder="finish breakfast" required /></Field>
        <Field label="My smallest action is to…"><input className="input" value={minimum} onChange={e => setMinimum(e.target.value)} maxLength={180} placeholder="read one page" required /></Field>
      </div>
      <p className="text-xs t-secondary">Your cue and action are saved on this device. Habit logs sync with your account.</p>
      {error && <p role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={busy || !habitId || !cue.trim() || !minimum.trim()}>Save my plan</button>
        {cancel && <button type="button" className="btn-secondary" onClick={cancel}>Cancel</button>}
      </div>
    </form>
  );
}

export function HabitPractice({ challenge, day, selected, data }: {
  challenge: Challenge;
  day: number;
  selected: string;
  data: CalendarData;
}) {
  const guide = guideForDay(day);
  const today = todayKey();
  const future = selected > today;
  const planKey = `challenge-plan:${challenge.id}`;
  const [plan, setPlan] = useState<FocusPlan | null>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [logs, setLogs] = useState<{ habitId: string; dates: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const habit = data.habits.find(h => h.id === plan?.habitId);
  const habitId = habit?.id;

  useEffect(() => {
    let active = true;
    setError("");
    getPort().get("_meta", planKey).then(row => {
      if (!active) return;
      setPlan(row?.value ?? null);
      setReady(true);
    }).catch(() => { if (active) setError("Could not load your plan on this device."); });
    return () => { active = false; };
  }, [planKey, retry]);

  useEffect(() => {
    if (!habitId) return;
    let active = true;
    getDb().list<HabitLog>("habit_logs", {
      eq: { habit_id: habitId, status: "done" },
      gte: { log_date: challenge.start_date },
      lte: { log_date: addDays(challenge.start_date, 29) },
    }).then(rows => {
      if (active) setLogs({ habitId, dates: rows.map(row => row.log_date) });
    }).catch(() => { if (active) { setLogs(null); setError("Could not load your habit logs."); } });
    return () => { active = false; };
  }, [challenge.start_date, habitId, data.habitLogs, retry]);

  async function save(planToSave: FocusPlan) {
    await getPort().put("_meta", { key: planKey, value: planToSave });
    setPlan(planToSave);
    setEditing(false);
    setError("");
  }
  if (!guide) return null;
  const dates = logs && logs.habitId === habitId ? logs.dates : null;
  const done = dates?.includes(selected) ?? false;
  const count = dates?.filter(d => d <= selected && d <= today).length;
  async function logPractice() {
    if (!habit || !dates || future || busy) return;
    setBusy(true);
    setError("");
    try {
      await toggleHabitDone(habit, selected, done);
      setLogs({ habitId: habit.id, dates: done ? dates.filter(d => d !== selected) : [...dates, selected] });
      data.refresh();
    } catch {
      setError("Could not update this habit log. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Daily challenge guide" className="card-pad grid gap-4 hairline-b">
      <div>
        <p className="text-xs t-secondary">{guide.phase.name} · Focus for days {guide.phase.startDay}–{guide.phase.endDay}</p>
        <p className="mt-1 font-medium t-primary">{guide.phase.description}</p>
      </div>
      <div className="border-l-2 border-brand pl-4">
        <p className="text-xs t-secondary">{future ? "Preview" : selected === today ? "Today’s practice" : "Past practice"} · Day {day}</p>
        <h2 className="section-title mt-1">{guide.practice.title}</h2>
        <p className="mt-1 text-sm t-secondary">{guide.practice.action}</p>
      </div>
      {error && <div role="alert" className="text-sm">{error} <button className="btn-ghost" onClick={() => setRetry(n => n + 1)}>Retry</button></div>}
      {!ready ? <p className="text-sm t-secondary">Loading your plan…</p> : plan && habit && !editing ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold t-primary">{habit.name}</h3>
            <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>Edit my plan</button>
          </div>
          <p className="text-sm t-primary break-words">After I {plan.cue}, I will {plan.minimum}.</p>
          {selected === today && day > 1 && dates && dates.some(d => d < selected) && !dates.includes(addDays(selected, -1)) && !done && (
            <p className="text-sm t-secondary">Picking this up again? Use your smallest action at the next cue today.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {!future && <button type="button" className={done ? "btn-secondary" : "btn-primary"} aria-pressed={done}
              onClick={logPractice} disabled={busy || !dates}>{done ? "✓ Habit logged · Undo" : "Log this habit"}</button>}
            {future && <p className="text-xs t-secondary">Logging opens on this day.</p>}
            {count !== undefined && <p role="status" className="text-xs t-secondary">{count} {count === 1 ? "day" : "days"} logged for this habit in the challenge{selected < today ? " through this date" : " so far"}.</p>}
          </div>
        </div>
      ) : data.habits.length ? (
        <div>
          <h3 className="section-title mb-2">{plan && !habit ? "Choose an active habit for your plan" : "Your habit plan"}</h3>
          <PlanForm habits={data.habits} initial={plan} save={save} addHabit={() => setAdding(true)}
            cancel={plan && habit ? () => setEditing(false) : undefined} />
        </div>
      ) : (
        <div><p className="mb-2 text-sm t-secondary">Start with one habit, such as reading, a short walk or a study question.</p>
          <button className="btn-primary" onClick={() => setAdding(true)}>Create my first habit</button></div>
      )}
      {guide.checkpoint && !future && dates && (
        <div>
          <p className="text-sm font-medium t-primary">{habit?.name} this phase</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {Array.from({ length: day - guide.phase.startDay + 1 }, (_, i) => {
              const n = guide.phase.startDay + i;
              const logged = dates.includes(addDays(challenge.start_date, n - 1));
              return <li key={n} className="rounded-lg border hairline px-2 py-1 text-xs t-secondary">
                Day {n} · {logged ? "Logged" : "No log"}
              </li>;
            })}
          </ul>
        </div>
      )}
      {guide.checkpoint && !future && <Link className="btn-secondary justify-self-start"
        href={`/progress?tab=reflection&date=${selected}#${day === 30 ? "challenge-review" : "daily-reflection"}`}>
        {day === 30 ? "Write my day 31 plan" : "Reflect on this phase"} →
      </Link>}
      {adding && <Modal title="New habit" onClose={() => setAdding(false)}>
        <HabitForm onSaved={() => { setAdding(false); data.refresh(); }} />
      </Modal>}
    </section>
  );
}
