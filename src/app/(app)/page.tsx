import { format } from "date-fns";

import { CountdownWidget } from "./_components/CountdownWidget";
import { TodayWidget } from "./_components/TodayWidget";
import { ThisWeekWidget } from "./_components/ThisWeekWidget";
import { BlockedWidget } from "./_components/BlockedWidget";
import { RecentActivityWidget } from "./_components/RecentActivityWidget";
import { ProjectProgressWidget } from "./_components/ProjectProgressWidget";
import { UtilityHeatmapWidget } from "./_components/UtilityHeatmapWidget";
import { DashboardRealtime } from "./_components/DashboardRealtime";
import {
  getBlockedTasks,
  getProjectsWithProgress,
  getRecentActivity,
  getTodayTasks,
  getUtilitiesForHeatmap,
  getWeekTasks,
  londonToday,
} from "@/lib/dashboard/queries";
import { getCurrentProfile } from "@/lib/profile";

// Key dates — both fall inside British Summer Time (UTC+1). Anchor each to
// 09:00 Europe/London (= 08:00Z) so the countdown shows "0 days" only on the
// actual day. Move-out is the *last* day at 43 Hogarth Hill, so we treat it
// the same way for symmetry.
const KEYS_TARGET = new Date("2026-05-29T08:00:00Z");
const MOVE_OUT_TARGET = new Date("2026-08-02T08:00:00Z");

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = londonToday();

  const [
    session,
    todayTasks,
    weekTasks,
    blockedTasks,
    activity,
    projects,
    utilities,
  ] = await Promise.all([
    getCurrentProfile(),
    getTodayTasks(today),
    getWeekTasks(today),
    getBlockedTasks(),
    getRecentActivity(10),
    getProjectsWithProgress(),
    getUtilitiesForHeatmap(),
  ]);

  const displayName =
    session?.profile?.display_name ??
    session?.email?.split("@")[0] ??
    "there";

  // Use the same Europe/London-shifted clock the data layer uses so the
  // greeting line matches the data the page renders.
  const todayHumanReadable = format(
    new Date(`${today}T12:00:00Z`),
    "EEEE d MMMM"
  );

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-5 py-6 md:px-7 md:py-7">
      <DashboardRealtime />

      {/* Greeting */}
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 md:text-[26px]">
            Good morning, {displayName}.
          </h1>
          <p className="mt-1 text-sm text-stone-500">{todayHumanReadable}</p>
        </div>
      </header>

      {/* Countdowns — two large cards side by side, stack on mobile */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <CountdownWidget
          target={KEYS_TARGET}
          label="Keys to"
          address="74 Addison Way"
          tone="clay"
          windowDays={30}
        />
        <CountdownWidget
          target={MOVE_OUT_TARGET}
          label="Last day at"
          address="43 Hogarth Hill"
          tone="slate"
          windowDays={95}
        />
      </section>

      {/* Today / This week / Blocked row */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <div className="md:col-span-5">
          <TodayWidget tasks={todayTasks} today={today} />
        </div>
        <div className="md:col-span-4">
          <ThisWeekWidget tasks={weekTasks} />
        </div>
        <div className="md:col-span-3">
          <BlockedWidget tasks={blockedTasks} />
        </div>
      </section>

      {/* Projects / Activity row */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <div className="md:col-span-7">
          <ProjectProgressWidget projects={projects} />
        </div>
        <div className="md:col-span-5">
          <RecentActivityWidget rows={activity} />
        </div>
      </section>

      {/* Utility heatmap — full width */}
      <section>
        <UtilityHeatmapWidget utilities={utilities} />
      </section>
    </div>
  );
}
