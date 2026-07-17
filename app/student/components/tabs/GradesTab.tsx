import { ClipboardList } from "lucide-react";
import { type DBGrade, type DBSubject, type CombinedActivityResult, getGradeInfo } from "../types";

interface GradesTabProps {
  activeTermStr: string;
  settingsList: any[];
  activeSettingId: number | null;
  onChangeSetting: (setting: any) => void;
  filteredGrades: DBGrade[];
  gpaValue: string;
  gpaCredits: number;
  gpaNum: number;
  gpaColor: string;
  useCombinedActivity: boolean;
  getCombinedActivityResult: () => CombinedActivityResult | null;
  scoredActivitySubjects: DBSubject[];
  subjectsList: DBSubject[];
  midtermMax: number;
  finalMax: number;
}

export default function GradesTab({
  activeTermStr,
  settingsList,
  activeSettingId,
  onChangeSetting,
  filteredGrades,
  gpaValue,
  gpaCredits,
  gpaNum,
  gpaColor,
  useCombinedActivity,
  getCombinedActivityResult,
  scoredActivitySubjects,
  subjectsList,
  midtermMax,
  finalMax,
}: GradesTabProps) {
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Term selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-foreground">ผลการเรียน</h3>
          <p className="text-xs text-muted-foreground mt-0.5">เทอม {activeTermStr}</p>
        </div>
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
            <option key={s.id} value={s.id}>ปี {s.academic_year} เทอม {s.term}{s.is_active ? " · ปัจจุบัน" : ""}</option>
          ))}
        </select>
      </div>

      {/* GPA Summary bar */}
      {filteredGrades.length > 0 && (
        <div className="ui-card px-6 py-5 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          <div className={`text-3xl font-extrabold ${gpaColor}`}>{gpaValue}</div>
          <div className="flex-1">
            <div className="text-xs font-bold text-muted-foreground mb-1.5">เกรดเฉลี่ยสะสม (GPA) · {gpaCredits} หน่วยกิต</div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${(gpaNum / 4) * 100}%` }} />
            </div>
          </div>
          <div className="text-xs font-bold text-subtle-foreground">/ 4.00</div>
        </div>
      )}

      {filteredGrades.length === 0 ? (
        <div className="ui-card p-14 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-soft rounded-2xl flex items-center justify-center" style={{ background: "var(--primary-soft)" }}>
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-bold text-foreground mb-1 text-base">ยังไม่มีผลการเรียน</h3>
          <p className="text-sm text-muted-foreground">กรุณารอคุณครูบันทึกคะแนนในเทอมนี้</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {useCombinedActivity && (() => {
            const combined = getCombinedActivityResult();
            if (!combined) return null;
            return (
              <div className={`rounded-2xl border p-5 flex items-center gap-4 ${combined.pass ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"}`}>
                <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${combined.color}`}>
                  <span className="text-base font-extrabold leading-tight">{combined.label}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground text-sm">ผลกิจกรรมรวม</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    คะแนน {combined.totalScore}/{combined.totalMax} · {Math.round(combined.percent)}%
                  </div>
                  <div className="h-2 rounded-full bg-card mt-2 overflow-hidden border border-border">
                    <div className={`h-full rounded-full transition-all duration-500 ${combined.bar}`} style={{ width: `${Math.min(100, combined.percent)}%` }} />
                  </div>
                  <div className="text-[10px] text-subtle-foreground mt-1">
                    รวมจาก: {scoredActivitySubjects.map(s => s.name).join(", ")}
                  </div>
                </div>
              </div>
            );
          })()}
          {filteredGrades.map(grade => {
            const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === grade.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
            const mMax = Number(subject?.midterm_max_score) || midtermMax;
            const fMax = Number(subject?.final_max_score) || finalMax;
            const totalScore = (grade.midterm_score ?? 0) + (grade.final_score ?? 0);
            const percent = mMax + fMax > 0 ? (totalScore / (mMax + fMax)) * 100 : 0;
            const isActivity = subject?.subject_type === "activity";
            const isCombined = isActivity && subject?.score_display_mode === "combined";
            const combinedActResult = isActivity && useCombinedActivity ? getCombinedActivityResult() : null;
            const info = isActivity
              ? (combinedActResult
                  ? { letter: combinedActResult.label, point: combinedActResult.label, color: combinedActResult.color, bar: combinedActResult.bar }
                  : (percent >= 50 ? { letter: "ผ่าน", point: "ผ่าน", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30", bar: "bg-emerald-500" } : { letter: "ไม่ผ่าน", point: "ไม่ผ่าน", color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30", bar: "bg-rose-500" }))
              : getGradeInfo(percent);

            return (
              <div key={grade.id} className="ui-card overflow-hidden relative">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isActivity ? "bg-gradient-to-b from-amber-400 to-orange-400" : "bg-gradient-to-b from-violet-400 to-fuchsia-400"}`} />
                <div className="p-5 pl-6 flex items-center gap-4">
                  {/* Grade Badge */}
                  <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${info.color}`}>
                    <span className="text-lg font-extrabold leading-tight">{info.letter}</span>
                    {!isActivity && <span className="text-[10px] font-semibold opacity-70">{info.point}</span>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-bold text-foreground text-sm truncate">{grade.subject}</span>
                      {isActivity ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">กิจกรรม</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30">
                          {Number(subject?.credit_hours) || 1} หน่วยกิต
                        </span>
                      )}
                    </div>

                    {/* Score bar */}
                    <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                      <div className={`h-full rounded-full transition-all duration-500 ${info.bar}`} style={{ width: `${Math.min(100, percent)}%` }} />
                    </div>

                    {/* Score breakdown */}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                      {isCombined ? (
                        <span>รวม {totalScore}/{mMax + fMax}</span>
                      ) : (
                        <>
                          <span>เก็บ {grade.midterm_score ?? 0}/{mMax}</span>
                          <span className="text-subtle-foreground">·</span>
                          <span>สอบ {grade.final_score ?? 0}/{fMax}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Total score */}
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-extrabold text-foreground">{totalScore}</div>
                    <div className="text-xs text-subtle-foreground font-medium">/{mMax + fMax}</div>
                    <div className={`text-[11px] font-bold mt-0.5 ${info.color.split(" ")[1]}`}>{Math.round(percent)}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
