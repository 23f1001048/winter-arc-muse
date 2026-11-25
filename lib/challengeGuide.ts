import { phaseForDayNumber } from "./phases";

interface Practice {
  title: string;
  action: string;
}

const practices: Practice[] = [
  { title: "Give one habit a starting point", action: "Pick a habit you want in your ordinary day. Finish this sentence below: “After I ___, I will ___.” Try it once. Reading one page after breakfast counts." },
  { title: "Put the first step in sight", action: "Leave what you need where the habit starts. Put the book beside your breakfast bowl, for example. At your cue, do the small version." },
  { title: "Notice the moment you start", action: "When your cue happens, pause and name it. Start your small version before moving on to the next thing." },
  { title: "Remove one extra step", action: "Look at what you had to find, open or decide yesterday. Take care of one of those steps before your cue today." },
  { title: "Try your smallest version", action: "On purpose, do only the version you wrote in your plan. If it still feels hard to start, edit it down to one visible action." },
  { title: "Catch the usual interruption", action: "Notice what you usually do just after your cue. Put your habit before that activity once today." },
  { title: "Keep the cue that worked", action: "Look back at this week’s logs. Recall one start that felt easy. Keep that cue for next week, or change it to the moment you actually used." },
  { title: "Repeat your easiest start", action: "Use the cue and small version that worked best last week. Do them once in the same place today." },
  { title: "Prepare the next repeat", action: "As soon as you finish, leave one thing ready for tomorrow. Bookmark the next page or open the notebook to a blank sheet." },
  { title: "Try a little more once", action: "Finish the small version first. If you have room today, add one page, one question or one more minute. Keep the original minimum." },
  { title: "Use a clear finish line", action: "Before starting, say what will count as finished today. Stop there once and record the habit while you remember." },
  { title: "Protect a place for it", action: "Choose where you will do the habit today. Move one distracting object away from that spot before you begin." },
  { title: "Start before the easy distraction", action: "Choose an activity you often drift into after your cue. Do the small version before opening that app or starting that activity." },
  { title: "Test yesterday’s setup", action: "Repeat yesterday’s setup once. Notice which part you could leave ready overnight." },
  { title: "Choose your ordinary version", action: "Look at your logs since day 8. Pick the amount you could repeat on an ordinary weekday. Keep the smaller version for busy days." },
  { title: "Choose a backup cue", action: "Decide what you will do if your usual cue disappears. Say it concretely, such as “If I eat out, I’ll read one page when I get home.”" },
  { title: "Try the backup once", action: "Use yesterday’s backup cue for one repeat today. Notice whether it gives you a clear moment to begin." },
  { title: "Practice a short day", action: "Use the smallest version even if you have time for more. Put the materials away and log that single repeat." },
  { title: "Find a second place", action: "Try a version you can do away from your usual spot. Bring one item you need or choose an action you can do without it." },
  { title: "Answer one predictable obstacle", action: "Pick the interruption most likely to happen today. Finish “If that happens, I will…” with something you can actually do." },
  { title: "Leave yourself a restart cue", action: "Set out a reminder for the next time you forget. Put it where you will see it at your next ordinary cue." },
  { title: "Rehearse coming back", action: "Think of the last time you missed a repeat. At the next available cue, do one small version. One repeat is enough for today." },
  { title: "Keep one backup that fits", action: "Look back over days 16–23. Pick the backup that was easiest to use and write down when you would use it again." },
  { title: "Find a change you can point to", action: "Recall an ordinary moment that went differently because of this habit. Write one sentence about what you actually did." },
  { title: "Choose what earns its place", action: "Compare the small and longer versions you tried. Choose the one you want to keep doing even when the challenge ends." },
  { title: "Make the setup last", action: "Give the materials a regular home. After today’s repeat, leave them there for the next one." },
  { title: "Try a day without an app prompt", action: "Pick tomorrow’s cue now. Let that real-world event remind you to act, then come here afterward to record it." },
  { title: "Notice what reminded you", action: "When you open the tracker, recall what reminded you to begin. Keep that cue, or adjust it if you needed a different reminder." },
  { title: "Schedule your first repeat after day 30", action: "Choose the time or cue for day 31. Put it in your calendar or leave the materials where that moment will happen." },
  { title: "Write your day 31 plan", action: "Do your habit once. In your 30-day review, finish “After ___, I will ___. On a hard day, I will ___.” Choose a date to check how it is going." },
];

export function guideForDay(day: number) {
  const phase = phaseForDayNumber(day);
  if (!phase) return null;
  return { phase, practice: practices[day - 1], checkpoint: day === phase.endDay };
}
