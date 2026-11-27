import { Clock, Lock, TrendingUp, Award } from "lucide-react";
import { type CombinedActivityResult, getGradeInfo } from "../types";

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
  settingsList?: any[];
}

export default function YearlyAverageTab({ combinedGpaData, settingsList = [] }: YearlyAverageTabProps) {
  if (!combinedGpaData) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div>
          <h3 className="font-bold text-foreground text-base">เฉลี่ยรวมทั้งปีการศึกษา</h3>
          <p className="text-xs text-muted-foreground mt-0.5">คำนวณจากคะแนนทั้ง 2 เทอมของปีการศึกษารวมกัน</p>
        </div>
        <div className="ui-card p-10 sm:p-14 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-foreground mb-1 text-base">ยังไม่มีข้อมูลเฉลี่ยรวม</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            ต้องมีคะแนนครบทั้ง 2 เทอมของปีการศึกษาเดียวกันจึงจะคำนวณได้
          </p>
        </div>
      </div>
    );
  }

  const yearSettings = settingsList.filter(
    (s) => String(s.academic_year) === String(combinedGpaData.academicYear)
  );

  const isYearFullyReleased = yearSettings.every((s) => {
    const isManual = s.is_grade_released !== false;
    const releaseDate = s.grade_release_date;
    if (releaseDate && releaseDate.trim() !== "") {
      return new Date().getTime() >= new Date(releaseDate).getTime();
    }
    return isManual;
  });

  if (!isYearFullyReleased) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div>
          <h3 className="font-bold text-foreground text-base">เฉลี่ยรวมทั้งปีการศึกษา</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            ปีการศึกษา {combinedGpaData.academicYear} · รวม {combinedGpaData.termCount} เทอม
          </p>
        </div>
        <div className="ui-card p-10 text-center space-y-3 bg-amber-500/5 border-amber-500/25">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">
            ผลการเรียนเฉลี่ยรวมทั้งปียังไม่เปิดเผยสำหรับนักเรียน
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            ผลการเรียนในบางภาคเรียนของปีการศึกษา {combinedGpaData.academicYear} ยังไม่ถึงเวลากำหนดเปิดประกาศ
          </p>
        </div>
      </div>
    );
  }

  const gpaNum = parseFloat(combinedGpaData.value);
  const gpaColor =
    gpaNum >= 3.5
      ? "text-emerald-600 dark:text-emerald-400"
      : gpaNum >= 2.5
      ? "text-sky-600 dark:text-sky-400"
      : gpaNum >= 1.5
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-foreground text-base">เฉลี่ยรวมทั้งปีการศึกษา</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            ปีการศึกษา {combinedGpaData.academicYear} · รวม {combinedGpaData.termCount} เทอม
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          <TrendingUp className="w-3.5 h-3.5" />
          {combinedGpaData.subjects.length} รายวิชา
        </span>
      </div>

      {/* Combined GPA Summary */}
      <div className="ui-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/70" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground">เกรดเฉลี่ยสะสมทั้งปี</div>
            <div className={`text-3xl font-extrabold leading-tight ${gpaColor}`}>
              {combinedGpaData.value}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
            <span>{combinedGpaData.credits} หน่วยกิตรวม</span>
            <span className="text-foreground font-bold">{combinedGpaData.percentage}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, (gpaNum / 4) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Per-subject breakdown */}
      <div className="space-y-3 stagger-children">
        {combinedGpaData.useYearlyCombinedActivity &&
          (() => {
            const combined = combinedGpaData.yearlyCombinedActivity;
            if (!combined) return null;
            return (
              <div
                className={`rounded-2xl border p-4 sm:p-5 flex items-center gap-4 ${
                  combined.pass
                    ? "bg-emerald-500/8 border-emerald-500/25"
                    : "bg-rose-500/8 border-rose-500/25"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${combined.color}`}
                >
                  <span className="text-sm font-extrabold leading-tight">{combined.label}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground text-sm">ผลกิจกรรมรวมทั้งปี</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    คะแนน {combined.totalScore}/{combined.totalMax} · {Math.round(combined.percent)}%
                  </div>
                  <div className="h-2 rounded-full bg-card mt-2 overflow-hidden border border-border">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${combined.bar}`}
                      style={{ width: `${Math.min(100, combined.percent)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-subtle-foreground mt-1.5 truncate">
                    รวมจาก: {combinedGpaData.subjects.filter((s) => s.isActivity).map((s) => s.name).join(", ")}
                  </div>
                </div>
              </div>
            );
          })()}

        {combinedGpaData.subjects.map((sub) => {
          const isActivity = !!sub.isActivity;
          const combinedActResult =
            isActivity && combinedGpaData.useYearlyCombinedActivity
              ? combinedGpaData.yearlyCombinedActivity
              : null;

          const info = isActivity
            ? combinedActResult
              ? { letter: combinedActResult.label, color: combinedActResult.color, bar: combinedActResult.bar }
              : sub.percent >= 50
              ? {
                  letter: "ผ่าน",
                  color: "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:text-emerald-300",
                  bar: "bg-emerald-500",
                }
              : {
                  letter: "ไม่ผ่าน",
                  color: "bg-rose-500/12 text-rose-700 border-rose-500/25 dark:text-rose-300",
                  bar: "bg-rose-500",
                }
            : getGradeInfo(sub.percent);

          return (
            <div key={sub.name} className="ui-card overflow-hidden relative">
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  isActivity ? "bg-amber-500/80" : "bg-primary/80"
                }`}
              />
              <div className="p-4 sm:p-5 pl-5 sm:pl-6 flex items-center gap-3.5 sm:gap-4">
                <div
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${info.color}`}
                >
                  <span className="text-base sm:text-lg font-extrabold leading-tight">{info.letter}</span>
                  {!isActivity && (
                    <span className="text-[10px] font-semibold opacity-75">{sub.point.toFixed(1)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-bold text-foreground text-sm truncate">{sub.name}</span>
                    {isActivity ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                        กิจกรรม
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {sub.credits} หน่วยกิต
                      </span>
                    )}
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${info.bar}`}
                      style={{ width: `${Math.min(100, sub.percent)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium">รวม 2 เทอม</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground leading-none">
                    {sub.totalScore}
                  </div>
                  <div className="text-xs text-subtle-foreground font-medium mt-0.5">/{sub.totalMax}</div>
                  <div className="text-[11px] font-bold text-primary mt-0.5">{Math.round(sub.percent)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
