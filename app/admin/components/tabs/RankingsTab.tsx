import { type SystemSetting, type RankingRow } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";

interface RankingsTabProps {
  settingsList: SystemSetting[];
  rankingsSettingId: number | null;
  handleSelectRankingsSetting: (id: number) => void;
  rankingsLoading: boolean;
  rankingsData: RankingRow[];
  rankingsClassroomFilter: string;
  setRankingsClassroomFilter: (filter: string) => void;
  token: string | null;
  loadRankings: (settingId: number, token: string) => void;
}

export default function RankingsTab({
  settingsList,
  rankingsSettingId,
  handleSelectRankingsSetting,
  rankingsLoading,
  rankingsData,
  rankingsClassroomFilter,
  setRankingsClassroomFilter,
  token,
  loadRankings,
}: RankingsTabProps) {
  return (
    <div className="p-8 animate-fade-in-up">
      <SectionHeader
        icon="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        color="purple"
        title="อันดับผลการเรียน"
        subtitle="จัดอันดับนักเรียนจากคะแนนรวม ทั้งภายในห้องเรียนและทั้งโรงเรียน"
      >
        <button
          onClick={() => {
            if (rankingsSettingId && token) loadRankings(rankingsSettingId, token);
          }}
          disabled={!rankingsSettingId}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-muted disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          รีเฟรชข้อมูล
        </button>
      </SectionHeader>

      <TermSelector
        settingsList={settingsList}
        selectedId={rankingsSettingId}
        onSelect={handleSelectRankingsSetting}
      />

      {!rankingsSettingId ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : rankingsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground font-semibold text-sm">กำลังคำนวณอันดับ...</p>
        </div>
      ) : rankingsData.length === 0 ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          ไม่มีข้อมูลนักเรียนในเทอมนี้
        </div>
      ) : (
        (() => {
          const classroomList = Array.from(new Set(rankingsData.map((r) => r.classroom_name))).sort();
          const filtered =
            rankingsClassroomFilter === "all"
              ? rankingsData
              : rankingsData.filter((r) => r.classroom_name === rankingsClassroomFilter);
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
                  onClick={() => setRankingsClassroomFilter("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    rankingsClassroomFilter === "all"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                      : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                  }`}
                >
                  ทั้งหมด
                </button>
                {classroomList.map((cn) => (
                  <button
                    key={cn}
                    onClick={() => setRankingsClassroomFilter(cn)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      rankingsClassroomFilter === cn
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                        : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                    }`}
                  >
                    {cn}
                  </button>
                ))}
              </div>

              {/* Two-column layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Classroom Ranking */}
                <div className="card-modern overflow-hidden border-purple-100/60 dark:border-purple-500/25">
                  <div className="px-5 py-4 bg-gradient-to-r from-purple-50 dark:from-purple-500/10 to-indigo-50 dark:to-indigo-500/10 border-b border-purple-100 dark:border-purple-500/25">
                    <h3 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16" />
                      </svg>
                      อันดับในห้องเรียน
                    </h3>
                    <p className="text-xs text-purple-500 dark:text-purple-400 mt-0.5">{filtered.length} คน</p>
                  </div>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground text-xs sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2.5 text-center font-bold w-14">อันดับ</th>
                          <th className="px-3 py-2.5 font-bold">ชื่อ-นามสกุล</th>
                          <th className="px-3 py-2.5 text-center font-bold w-16">ห้อง</th>
                          <th className="px-3 py-2.5 text-center font-bold w-20">เปอร์เซ็นต์</th>
                          <th className="px-3 py-2.5 text-center font-bold w-16">GPA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {classroomSorted.map((s) => (
                          <tr
                            key={`cr-${s.student_id}`}
                            className={`transition-colors ${
                              s.classroom_rank <= 3
                                ? "bg-amber-50/40 dark:bg-amber-500/10"
                                : "hover:bg-muted"
                            }`}
                          >
                            <td className="px-3 py-2.5 text-center">
                              {s.classroom_rank <= 3 ? (
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                                    s.classroom_rank === 1
                                      ? "bg-amber-400 text-white"
                                      : s.classroom_rank === 2
                                      ? "bg-gray-300 text-white"
                                      : "bg-orange-300 text-white"
                                  }`}
                                >
                                  {s.classroom_rank}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-bold text-xs">
                                  {s.classroom_rank}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-foreground text-xs">{s.student_name}</div>
                              <div className="text-[10px] text-subtle-foreground">{s.student_id}</div>
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-muted-foreground font-semibold">
                              {s.classroom_name}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`text-xs font-extrabold ${
                                  s.percentage >= 80
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : s.percentage >= 60
                                    ? "text-amber-600 dark:text-amber-400"
                                    : s.percentage >= 50
                                    ? "text-orange-600 dark:text-orange-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {s.percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                                  s.gpa >= 3.0
                                    ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                    : s.gpa >= 2.0
                                    ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                    : s.gpa >= 1.0
                                    ? "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300"
                                    : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                }`}
                              >
                                {s.gpa.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile Cards */}
                  <div className="md:hidden max-h-[600px] overflow-y-auto p-3 space-y-2.5">
                    {classroomSorted.map((s) => (
                      <div
                        key={`cr-mob-${s.student_id}`}
                        className={`p-3 rounded-xl border border-border flex items-center justify-between gap-3 ${
                          s.classroom_rank <= 3
                            ? "bg-amber-50/40 dark:bg-amber-500/10 border-amber-200/50"
                            : "bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0">
                            {s.classroom_rank <= 3 ? (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                                  s.classroom_rank === 1
                                    ? "bg-amber-400 text-white"
                                    : s.classroom_rank === 2
                                    ? "bg-gray-300 text-white"
                                    : "bg-orange-300 text-white"
                                }`}
                              >
                                {s.classroom_rank}
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground font-bold text-xs">
                                {s.classroom_rank}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-xs truncate">
                              {s.student_name}
                            </div>
                            <div className="text-[10px] text-subtle-foreground">
                              รหัส {s.student_id} • ห้อง {s.classroom_name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-right">
                          <div>
                            <div
                              className={`text-xs font-extrabold ${
                                s.percentage >= 80
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : s.percentage >= 60
                                  ? "text-amber-600 dark:text-amber-400"
                                  : s.percentage >= 50
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {s.percentage.toFixed(1)}%
                            </div>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                s.gpa >= 3.0
                                  ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : s.gpa >= 2.0
                                  ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                  : s.gpa >= 1.0
                                  ? "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300"
                                  : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              GPA {s.gpa.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* School Ranking */}
                <div className="card-modern overflow-hidden border-blue-100/60 dark:border-blue-500/25">
                  <div className="px-5 py-4 bg-gradient-to-r from-blue-50 dark:from-blue-500/10 to-indigo-50 dark:to-indigo-500/10 border-b border-blue-100 dark:border-blue-500/25">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                      อันดับทั้งโรงเรียน
                    </h3>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">{rankingsData.length} คน</p>
                  </div>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground text-xs sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2.5 text-center font-bold w-14">อันดับ</th>
                          <th className="px-3 py-2.5 font-bold">ชื่อ-นามสกุล</th>
                          <th className="px-3 py-2.5 text-center font-bold w-16">ห้อง</th>
                          <th className="px-3 py-2.5 text-center font-bold w-20">เปอร์เซ็นต์</th>
                          <th className="px-3 py-2.5 text-center font-bold w-16">GPA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {schoolSorted.map((s) => (
                          <tr
                            key={`sr-${s.student_id}`}
                            className={`transition-colors ${
                              s.school_rank <= 3
                                ? "bg-amber-50/40 dark:bg-amber-500/10"
                                : "hover:bg-muted"
                            }`}
                          >
                            <td className="px-3 py-2.5 text-center">
                              {s.school_rank <= 3 ? (
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                                    s.school_rank === 1
                                      ? "bg-amber-400 text-white"
                                      : s.school_rank === 2
                                      ? "bg-gray-300 text-white"
                                      : "bg-orange-300 text-white"
                                  }`}
                                >
                                  {s.school_rank}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-bold text-xs">{s.school_rank}</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-foreground text-xs">{s.student_name}</div>
                              <div className="text-[10px] text-subtle-foreground">{s.student_id}</div>
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-muted-foreground font-semibold">
                              {s.classroom_name}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`text-xs font-extrabold ${
                                  s.percentage >= 80
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : s.percentage >= 60
                                    ? "text-amber-600 dark:text-amber-400"
                                    : s.percentage >= 50
                                    ? "text-orange-600 dark:text-orange-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {s.percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                                  s.gpa >= 3.0
                                    ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                    : s.gpa >= 2.0
                                    ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                    : s.gpa >= 1.0
                                    ? "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300"
                                    : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                }`}
                              >
                                {s.gpa.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile Cards */}
                  <div className="md:hidden max-h-[600px] overflow-y-auto p-3 space-y-2.5">
                    {schoolSorted.map((s) => (
                      <div
                        key={`sr-mob-${s.student_id}`}
                        className={`p-3 rounded-xl border border-border flex items-center justify-between gap-3 ${
                          s.school_rank <= 3
                            ? "bg-amber-50/40 dark:bg-amber-500/10 border-amber-200/50"
                            : "bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0">
                            {s.school_rank <= 3 ? (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                                  s.school_rank === 1
                                    ? "bg-amber-400 text-white"
                                    : s.school_rank === 2
                                    ? "bg-gray-300 text-white"
                                    : "bg-orange-300 text-white"
                                }`}
                              >
                                {s.school_rank}
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground font-bold text-xs">
                                {s.school_rank}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-xs truncate">
                              {s.student_name}
                            </div>
                            <div className="text-[10px] text-subtle-foreground">
                              รหัส {s.student_id} • ห้อง {s.classroom_name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-right">
                          <div>
                            <div
                              className={`text-xs font-extrabold ${
                                s.percentage >= 80
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : s.percentage >= 60
                                  ? "text-amber-600 dark:text-amber-400"
                                  : s.percentage >= 50
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {s.percentage.toFixed(1)}%
                            </div>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                s.gpa >= 3.0
                                  ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : s.gpa >= 2.0
                                  ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                  : s.gpa >= 1.0
                                  ? "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300"
                                  : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              GPA {s.gpa.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
