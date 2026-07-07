import { type SystemSetting, type RankingRow } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import RankingGrid from "../RankingGrid";

interface YearlyAverageTabProps {
  settingsList: SystemSetting[];
  yearlyAvgSettingId: number | null;
  handleSelectYearlyAvgSetting: (id: number) => void;
  yearlyAvgLoading: boolean;
  yearlyAvgAvailable: boolean;
  yearlyAvgReason: string;
  yearlyAvgData: RankingRow[];
  yearlyAvgClassroomFilter: string;
  setYearlyAvgClassroomFilter: (filter: string) => void;
  token: string | null;
  loadYearlyAverage: (settingId: number, token: string) => void;
}

export default function YearlyAverageTab({
  settingsList,
  yearlyAvgSettingId,
  handleSelectYearlyAvgSetting,
  yearlyAvgLoading,
  yearlyAvgAvailable,
  yearlyAvgReason,
  yearlyAvgData,
  yearlyAvgClassroomFilter,
  setYearlyAvgClassroomFilter,
  token,
  loadYearlyAverage,
}: YearlyAverageTabProps) {
  return (
    <div className="p-8 animate-fade-in-up">
      <SectionHeader
        icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        color="purple"
        title="เฉลี่ยรวมทั้งปีการศึกษา"
        subtitle="คำนวณคะแนนและ GPA จากทั้ง 2 เทอมของปีการศึกษารวมกัน"
      >
        <button
          onClick={() => {
            if (yearlyAvgSettingId && token) loadYearlyAverage(yearlyAvgSettingId, token);
          }}
          disabled={!yearlyAvgSettingId}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 disabled:bg-muted disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          รีเฟรชข้อมูล
        </button>
      </SectionHeader>

      {/* Year Selector */}
      {(() => {
        if (settingsList.length === 0) {
          return (
            <div className="mb-6 px-5 py-4 rounded-2xl border border-dashed border-border bg-muted text-sm text-subtle-foreground">
              ยังไม่มีปีการศึกษาในระบบ กรุณาเพิ่มที่แท็บ ตั้งค่าระบบ
            </div>
          );
        }

        // Group settings by academic year
        const yearsMap = new Map<string, typeof settingsList[0]>();
        settingsList.forEach(s => {
          const existing = yearsMap.get(s.academic_year);
          if (!existing) {
            yearsMap.set(s.academic_year, s);
          } else {
            // Prefer active term, then higher term number
            if (s.is_active || (!existing.is_active && Number(s.term) > Number(existing.term))) {
              yearsMap.set(s.academic_year, s);
            }
          }
        });

        const uniqueYears = Array.from(yearsMap.values()).sort((a, b) => b.academic_year.localeCompare(a.academic_year));
        const selectedSetting = settingsList.find(s => s.id === yearlyAvgSettingId);
        const selectedYear = selectedSetting?.academic_year || null;

        return (
          <div className="mb-6 p-3.5 rounded-2xl border border-border/80 bg-muted">
            <div className="text-xs font-bold text-subtle-foreground uppercase tracking-wider mb-2.5 px-1">
              เลือกปีการศึกษา
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueYears.map((y) => {
                const isSelected = selectedYear === y.academic_year;
                return (
                  <button
                    key={y.id}
                    onClick={() => handleSelectYearlyAvgSetting(y.id)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-600 shadow-lg shadow-purple-200/50"
                        : "bg-card text-muted-foreground border-border hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/20 hover:shadow-sm"
                    }`}
                  >
                    ปีการศึกษา {y.academic_year}
                    {y.is_active && (
                      <span
                        className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-card/20 text-white"
                            : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {!yearlyAvgSettingId ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : yearlyAvgLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-purple-200 dark:border-purple-500/30 border-t-purple-600 rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground font-semibold text-sm">กำลังคำนวณเฉลี่ยรวม...</p>
        </div>
      ) : !yearlyAvgAvailable ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          {yearlyAvgReason || "ยังไม่มีคะแนนครบทั้ง 2 เทอมของปีการศึกษานี้"}
        </div>
      ) : yearlyAvgData.length === 0 ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          ไม่มีข้อมูลนักเรียนสำหรับการคำนวณรวม
        </div>
      ) : (
        (() => {
          const classroomList = Array.from(new Set(yearlyAvgData.map((r) => r.classroom_name))).sort();
          const filtered =
            yearlyAvgClassroomFilter === "all"
              ? yearlyAvgData
              : yearlyAvgData.filter((r) => r.classroom_name === yearlyAvgClassroomFilter);
          const classroomSorted = [...filtered].sort(
            (a, b) => a.classroom_rank - b.classroom_rank || b.percentage - a.percentage
          );
          const schoolSorted = [...filtered].sort(
            (a, b) => a.school_rank - b.school_rank || b.percentage - a.percentage
          );

          return (
            <div>
              {/* Classroom Filter */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-subtle-foreground uppercase tracking-wider">
                  กรองห้องเรียน:
                </span>
                <button
                  onClick={() => setYearlyAvgClassroomFilter("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    yearlyAvgClassroomFilter === "all"
                      ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-600 shadow-md"
                      : "bg-card text-muted-foreground border-border hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/20"
                  }`}
                >
                  ทั้งหมด
                </button>
                {classroomList.map((cn) => (
                  <button
                    key={cn}
                    onClick={() => setYearlyAvgClassroomFilter(cn)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      yearlyAvgClassroomFilter === cn
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-600 shadow-md"
                        : "bg-card text-muted-foreground border-border hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/20"
                    }`}
                  >
                    {cn}
                  </button>
                ))}
              </div>

              <RankingGrid
                classroomSorted={classroomSorted}
                schoolSorted={schoolSorted}
                classroomCount={filtered.length}
                schoolCount={yearlyAvgData.length}
                subtitleSuffix=" · รวม 2 เทอม"
              />
            </div>
          );
        })()
      )}
    </div>
  );
}
