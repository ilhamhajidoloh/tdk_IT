import { Clock } from "lucide-react";
import { type CombinedActivityResult } from "../types";

interface YearlySubject {
  name: string;
  totalScore: number;
  totalMax: number;
  percent: number;
  credits: number;
  point: number;
  isActivity?: boolean;
}

interface CombinedGpaData {
  value: string;
  credits: number;
  percentage: number;
  academicYear: string;
  termCount: number;
  subjects: YearlySubject[];
  yearlyCombinedActivity?: CombinedActivityResult | null;
  useYearlyCombinedActivity?: boolean;
}

interface YearlyAverageTabProps {
  combinedGpaData: CombinedGpaData | null;
}

export default function YearlyAverageTab({ combinedGpaData }: YearlyAverageTabProps) {
  if (!combinedGpaData) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div>
          <h3 className="font-bold text-foreground">เฉลี่ยรวมทั้งปีการศึกษา</h3>
          <p className="text-xs text-muted-foreground mt-0.5">คำนวณจากคะแนนทั้ง 2 เทอมของปีการศึกษารวมกัน</p>
        </div>
        <div className="ui-card p-14 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-soft rounded-2xl flex items-center justify-center" style={{ background: "var(--primary-soft)" }}>
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-bold text-foreground mb-1 text-base">ยังไม่มีข้อมูลเฉลี่ยรวม</h3>
          <p className="text-sm text-muted-foreground">ต้องมีคะแนนครบทั้ง 2 เทอมของปีการศึกษาเดียวกันจึงจะคำนวณได้</p>
        </div>
      </div>
    );
  }

  const gpaNum = parseFloat(combinedGpaData.value);
  const gpaColor = gpaNum >= 3.5 ? "text-emerald-600 dark:text-emerald-400" : gpaNum >= 2.5 ? "text-blue-600 dark:text-blue-400" : gpaNum >= 1.5 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h3 className="font-bold text-foreground">เฉลี่ยรวมทั้งปีการศึกษา</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          ปีการศึกษา {combinedGpaData.academicYear} · รวม {combinedGpaData.termCount} เทอม
        </p>
      </div>

      {/* Combined GPA Summary */}
      <div className="ui-card px-6 py-5 flex items-center gap-5 relative overflow-hidden border-purple-200/50 dark:border-purple-500/30">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500" />
        <div className={`text-3xl font-extrabold ${gpaColor}`}>{combinedGpaData.value}</div>
        <div className="flex-1">
          <div className="text-xs font-bold text-muted-foreground mb-1.5">
            เกรดเฉลี่ยสะสม (GPA) รวมทั้งปี · {combinedGpaData.credits} หน่วยกิต
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${(gpaNum / 4) * 100}%` }} />
          </div>
        </div>
        <div className="text-xs font-bold text-subtle-foreground">{combinedGpaData.percentage}%</div>
      </div>

      {/* Per-subject breakdown */}
      <div className="space-y-3 stagger-children">
        {combinedGpaData.useYearlyCombinedActivity && (() => {
          const combined = combinedGpaData.yearlyCombinedActivity;
          if (!combined) return null;
          return (
            <div className={`rounded-2xl border p-5 flex items-center gap-4 ${combined.pass ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"}`}>
              <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${combined.color}`}>
                <span className="text-base font-extrabold leading-tight">{combined.label}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground text-sm">ผลกิจกรรมรวมทั้งปี</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  คะแนน {combined.totalScore}/{combined.totalMax} · {Math.round(combined.percent)}%
                </div>
                <div className="h-2 rounded-full bg-card mt-2 overflow-hidden border border-border">
                  <div className={`h-full rounded-full transition-all duration-500 ${combined.bar}`} style={{ width: `${Math.min(100, combined.percent)}%` }} />
                </div>
                <div className="text-[10px] text-subtle-foreground mt-1">
                  รวมจาก: {combinedGpaData.subjects.filter(s => s.isActivity).map(s => s.name).join(", ")}
                </div>
              </div>
            </div>
          );
        })()}

        {combinedGpaData.subjects.map(sub => {
          const isActivity = !!sub.isActivity;
          const combinedActResult = isActivity && combinedGpaData.useYearlyCombinedActivity ? combinedGpaData.yearlyCombinedActivity : null;

          const info = isActivity
            ? (combinedActResult
                ? { letter: combinedActResult.label, color: combinedActResult.color, bar: combinedActResult.bar }
                : (sub.percent >= 50
                    ? { letter: "ผ่าน", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30", bar: "bg-emerald-500" }
                    : { letter: "ไม่ผ่าน", color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30", bar: "bg-rose-500" }
                  )
              )
            : (sub.percent >= 80
                ? { letter: "A", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30", bar: "bg-emerald-500" }
                : sub.percent >= 75
                ? { letter: "B+", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30", bar: "bg-green-500" }
                : sub.percent >= 70
                ? { letter: "B", color: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30", bar: "bg-teal-500" }
                : sub.percent >= 65
                ? { letter: "C+", color: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30", bar: "bg-sky-500" }
                : sub.percent >= 60
                ? { letter: "C", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30", bar: "bg-blue-500" }
                : sub.percent >= 55
                ? { letter: "D+", color: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30", bar: "bg-yellow-500" }
                : sub.percent >= 50
                ? { letter: "D", color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30", bar: "bg-orange-500" }
                : { letter: "F", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30", bar: "bg-red-500" }
              );

          return (
            <div key={sub.name} className="ui-card overflow-hidden relative">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isActivity ? "bg-gradient-to-b from-amber-400 to-orange-400" : "bg-gradient-to-b from-purple-400 to-fuchsia-400"}`} />
              <div className="p-5 pl-6 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${info.color}`}>
                  <span className="text-lg font-extrabold leading-tight">{info.letter}</span>
                  {!isActivity && <span className="text-[10px] font-semibold opacity-70">{sub.point.toFixed(1)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-bold text-foreground text-sm truncate">{sub.name}</span>
                    {isActivity ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">กิจกรรม</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30">
                        {sub.credits} หน่วยกิต
                      </span>
                    )}
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                    <div className={`h-full rounded-full transition-all duration-500 ${info.bar}`} style={{ width: `${Math.min(100, sub.percent)}%` }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium">รวม 2 เทอม</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-extrabold text-foreground">{sub.totalScore}</div>
                  <div className="text-xs text-subtle-foreground font-medium">/{sub.totalMax}</div>
                  <div className={`text-[11px] font-bold mt-0.5 ${info.color.split(" ")[1]}`}>{Math.round(sub.percent)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
