import { type DBGrade, type DBSubject, type ScheduleEntry, type Tab, getGradeInfo } from "../types";

interface OverviewTabProps {
  studentName: string;
  studentCode: string;
  classroomName: string;
  settingsList: any[];
  activeSettingId: number | null;
  onChangeSetting: (setting: any) => void;
  gpaValue: string;
  gpaCredits: number;
  gpaColor: string;
  gpaRingColor: string;
  filteredGrades: DBGrade[];
  subjectsList: DBSubject[];
  midtermMax: number;
  finalMax: number;
  myScheduleToday: ScheduleEntry[];
  setActiveTab: (tab: Tab) => void;
}

export default function OverviewTab({
  studentName,
  studentCode,
  classroomName,
  settingsList,
  activeSettingId,
  onChangeSetting,
  gpaValue,
  gpaCredits,
  gpaColor,
  gpaRingColor,
  filteredGrades,
  subjectsList,
  midtermMax,
  finalMax,
  myScheduleToday,
  setActiveTab,
}: OverviewTabProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Profile Hero Card */}
      <div className="aurora-panel relative rounded-2xl p-7 text-white overflow-hidden shadow-lg">
        <div className="relative z-10 flex items-center gap-5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 border border-white/40 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <span className="text-3xl sm:text-4xl font-extrabold drop-shadow-sm">{studentName.charAt(0)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-extrabold leading-tight truncate drop-shadow-sm">{studentName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold border border-white/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                {studentCode}
              </span>
              <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold border border-white/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                ห้อง {classroomName || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Term Selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-bold text-foreground text-sm">สรุปผลการเรียน</h3>
        <select
          className="ui-input !w-auto py-2 text-sm font-semibold text-primary"
          value={activeSettingId || ""}
          onChange={(e) => {
            const val = e.target.value;
            const s = settingsList.find((x: any) => String(x.id) === val);
            if (s) onChangeSetting(s);
          }}
        >
          {settingsList.map(s => (
            <option key={s.id} value={s.id}>
              ปี {s.academic_year} เทอม {s.term}{s.is_active ? " · ปัจจุบัน" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 stagger-children">
        {/* GPA */}
        <div className="col-span-3 sm:col-span-1 ui-card-interactive p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          <div className={`w-22 h-22 rounded-full border-4 ${gpaRingColor} flex items-center justify-center mb-3 relative bg-muted`}>
            <span className={`relative text-2xl font-extrabold ${gpaColor}`}>{gpaValue}</span>
          </div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">เกรดเฉลี่ย (GPA)</div>
          <div className="text-[11px] text-subtle-foreground mt-0.5">{gpaCredits} หน่วยกิต</div>
        </div>

        {/* Right stats */}
        <div className="col-span-3 sm:col-span-2 grid grid-cols-2 gap-4">
          <div className="ui-card-interactive p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-indigo-500" />
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center mb-2">
              <svg className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 mb-1">{filteredGrades.length}</div>
            <div className="text-xs font-semibold text-muted-foreground">วิชาที่มีคะแนน</div>
            <div className="text-[11px] text-subtle-foreground">เทอมนี้</div>
          </div>
          <div className="ui-card-interactive p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-rose-500" />
            <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-500/15 flex items-center justify-center mb-2">
              <svg className="w-4.5 h-4.5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </div>
            <div className="text-3xl font-extrabold text-pink-500 dark:text-pink-400 mb-1">
              {filteredGrades.filter(g => {
                const sub = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
                const mMax = Number(sub?.midterm_max_score) || midtermMax;
                const fMax = Number(sub?.final_max_score) || finalMax;
                const total = (g.midterm_score ?? 0) + (g.final_score ?? 0);
                return mMax + fMax > 0 && (total / (mMax + fMax)) * 100 >= 80;
              }).length}
            </div>
            <div className="text-xs font-semibold text-muted-foreground">เกรด A</div>
            <div className="text-[11px] text-subtle-foreground">คะแนน ≥ 80%</div>
          </div>
          <div className="ui-card-interactive p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mb-2">
              <svg className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">
              {filteredGrades.filter(g => {
                const sub = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
                const mMax = Number(sub?.midterm_max_score) || midtermMax;
                const fMax = Number(sub?.final_max_score) || finalMax;
                const total = (g.midterm_score ?? 0) + (g.final_score ?? 0);
                return mMax + fMax > 0 && (total / (mMax + fMax)) * 100 >= 50;
              }).length}
            </div>
            <div className="text-xs font-semibold text-muted-foreground">ผ่านทั้งหมด</div>
            <div className="text-[11px] text-subtle-foreground">คะแนน ≥ 50%</div>
          </div>
          <div className="ui-card-interactive p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-red-500" />
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center mb-2">
              <svg className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="text-3xl font-extrabold text-rose-500 dark:text-rose-400 mb-1">
              {filteredGrades.filter(g => {
                const sub = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
                const mMax = Number(sub?.midterm_max_score) || midtermMax;
                const fMax = Number(sub?.final_max_score) || finalMax;
                const total = (g.midterm_score ?? 0) + (g.final_score ?? 0);
                return mMax + fMax > 0 && (total / (mMax + fMax)) * 100 < 50;
              }).length}
            </div>
            <div className="text-xs font-semibold text-muted-foreground">ต้องปรับปรุง</div>
            <div className="text-[11px] text-subtle-foreground">คะแนน &lt; 50%</div>
          </div>
        </div>
      </div>

      {/* Today's schedule quick view */}
      {myScheduleToday.length > 0 && (
        <div className="ui-card overflow-hidden animate-fade-in-up">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="font-bold text-foreground text-sm">คาบเรียนวันนี้</span>
            </div>
            <button onClick={() => setActiveTab("schedule")} className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity">ดูทั้งหมด →</button>
          </div>
          <div className="divide-y divide-border stagger-children">
            {myScheduleToday.sort((a, b) => Number(a.period_no) - Number(b.period_no)).map(e => {
              return (
                <div key={e.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-muted transition-colors">
                  <div className="text-center shrink-0 w-10">
                    <div className="text-[11px] font-bold text-muted-foreground">คาบ {e.period_no}</div>
                    <div className="text-[10px] text-subtle-foreground">{e.start_time}</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{e.subject_name}</div>
                    {(() => { const t = e.teacher_name || (e.teacher_names?.length ? e.teacher_names.join(", ") : null); return t ? <div className="text-xs text-muted-foreground">อ.{t}</div> : null; })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Grades Preview */}
      {filteredGrades.length > 0 && (
        <div className="ui-card overflow-hidden animate-fade-in-up">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <span className="font-bold text-foreground text-sm">คะแนนล่าสุด</span>
            <button onClick={() => setActiveTab("grades")} className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity">ดูทั้งหมด →</button>
          </div>
          <div className="divide-y divide-border stagger-children">
            {filteredGrades.slice(0, 4).map(grade => {
              const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === grade.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
              const mMax = Number(subject?.midterm_max_score) || midtermMax;
              const fMax = Number(subject?.final_max_score) || finalMax;
              const totalScore = (grade.midterm_score ?? 0) + (grade.final_score ?? 0);
              const percent = mMax + fMax > 0 ? (totalScore / (mMax + fMax)) * 100 : 0;
              const isActivity = subject?.subject_type === "activity";
              const info = isActivity
                ? (percent >= 50 ? { letter: "ผ่าน", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30", bar: "bg-emerald-500" } : { letter: "ไม่ผ่าน", color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30", bar: "bg-rose-500" })
                : getGradeInfo(percent);
              return (
                <div key={grade.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-muted transition-colors">
                  <span className={`w-10 text-center py-1.5 rounded-xl border text-xs font-extrabold shrink-0 ${info.color}`}>{info.letter}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{grade.subject}</div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${info.bar}`} style={{ width: `${Math.min(100, percent)}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm text-foreground">{totalScore}</div>
                    <div className="text-[11px] text-subtle-foreground">/{mMax + fMax}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
