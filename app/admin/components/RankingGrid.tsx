import { type RankingRow } from "./types";

export default function RankingGrid({
  classroomSorted,
  schoolSorted,
  classroomCount,
  schoolCount,
  subtitleSuffix,
}: {
  classroomSorted: RankingRow[];
  schoolSorted: RankingRow[];
  classroomCount: number;
  schoolCount: number;
  subtitleSuffix?: string;
}) {
  return (
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
          <p className="text-xs text-purple-500 dark:text-purple-400 mt-0.5">
            {classroomCount} คน{subtitleSuffix}
          </p>
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
                    s.classroom_rank <= 3 ? "bg-amber-50/40 dark:bg-amber-500/10" : "hover:bg-muted"
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
                      <span className="text-muted-foreground font-bold text-xs">{s.classroom_rank}</span>
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
                s.classroom_rank <= 3 ? "bg-amber-50/40 dark:bg-amber-500/10 border-amber-200/50" : "bg-card"
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
                  <div className="font-semibold text-foreground text-xs truncate">{s.student_name}</div>
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
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
            {schoolCount} คน{subtitleSuffix}
          </p>
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
                    s.school_rank <= 3 ? "bg-amber-50/40 dark:bg-amber-500/10" : "hover:bg-muted"
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
                s.school_rank <= 3 ? "bg-amber-50/40 dark:bg-amber-500/10 border-amber-200/50" : "bg-card"
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
                  <div className="font-semibold text-foreground text-xs truncate">{s.student_name}</div>
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
  );
}
