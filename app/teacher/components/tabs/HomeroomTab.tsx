import { type DBStudent, type DBClassroom, type DBGrade } from "../types";

interface RankingRow {
  student_id: string; student_name: string; student_number: number | null;
  classroom_id: string; classroom_name: string; total_score: number; max_possible: number;
  percentage: number; gpa: number; subject_count: number;
  school_rank: number; classroom_rank: number; school_total: number; classroom_total: number;
}

interface HomeroomTabProps {
  homeroomClass: DBClassroom | null;
  homeroomStudents: DBStudent[];
  grades: DBGrade[];
  calculateGPAForStudent: (studentId: string) => string;

  otherTermSettings: { id: number; term: string; academic_year: string }[];
  rankingMode: "single" | "combined";
  setRankingMode: (mode: "single" | "combined") => void;
  rankingTermSettingId: number | null;
  setRankingTermSettingId: (id: number | null) => void;
  activeSettingId: number | null;
  combinedAvailable: boolean;

  rankingsLoaded: boolean;
  rankingsData: RankingRow[];
}

export default function HomeroomTab({
  homeroomClass,
  homeroomStudents,
  grades,
  calculateGPAForStudent,
  otherTermSettings,
  rankingMode,
  setRankingMode,
  rankingTermSettingId,
  setRankingTermSettingId,
  activeSettingId,
  combinedAvailable,
  rankingsLoaded,
  rankingsData,
}: HomeroomTabProps) {
  if (!homeroomClass) {
    return (
      <div className="space-y-5">
        <div className="card-modern p-12 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-100 dark:to-indigo-500/10 flex items-center justify-center shadow-lg shadow-indigo-100/30">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">ยังไม่ได้รับมอบหมายห้องประจำชั้น</h3>
          <p className="text-sm text-muted-foreground">กรุณาติดต่อแอดมินเพื่อให้ผูกข้อมูลครูประจำชั้น</p>
        </div>
      </div>
    );
  }

  const myClassroomId = homeroomClass.id;
  const classroomRankings = rankingsData.filter(r => r.classroom_id === myClassroomId).sort((a, b) => a.classroom_rank - b.classroom_rank || b.percentage - a.percentage);
  const schoolRankingsForClass = rankingsData.filter(r => r.classroom_id === myClassroomId).sort((a, b) => a.school_rank - b.school_rank || b.percentage - a.percentage);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "นักเรียนทั้งหมด", value: homeroomStudents.length, gradient: "from-indigo-500 to-violet-600", shadowColor: "shadow-indigo-200/40", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
          { label: "GPA >= 3.0", value: homeroomStudents.filter(s => parseFloat(calculateGPAForStudent(s.student_id)) >= 3.0).length, gradient: "from-emerald-500 to-teal-600", shadowColor: "shadow-emerald-200/40", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
          { label: "GPA < 2.0", value: homeroomStudents.filter(s => parseFloat(calculateGPAForStudent(s.student_id)) < 2.0 && parseFloat(calculateGPAForStudent(s.student_id)) > 0).length, gradient: "from-amber-500 to-orange-600", shadowColor: "shadow-amber-200/40", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
          { label: "GPA < 1.0", value: homeroomStudents.filter(s => parseFloat(calculateGPAForStudent(s.student_id)) < 1.0 && grades.some(g => g.student_id === s.student_id)).length, gradient: "from-rose-500 to-pink-600", shadowColor: "shadow-rose-200/40", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
        ].map((card, i) => (
          <div key={i} className="card-modern p-4 animate-fade-in-up hover:scale-[1.02] transition-transform duration-200">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadowColor}`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={card.icon} />
              </svg>
            </div>
            <div className="text-2xl font-extrabold text-foreground">{card.value}</div>
            <div className="text-xs text-muted-foreground font-medium mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Student Table */}
      <div className="card-modern overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h3 className="font-bold text-foreground">รายชื่อนักเรียน · ห้อง {homeroomClass.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">เกรดเฉลี่ยสะสม (GPA) เฉพาะวิชาหลัก</p>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-indigo-100/40 dark:border-indigo-500/25 text-foreground text-xs">
                <th className="px-5 py-3.5 text-center font-bold w-10">#</th>
                <th className="px-5 py-3.5 font-bold w-28">รหัส</th>
                <th className="px-5 py-3.5 font-bold">ชื่อ-สกุล</th>
                <th className="px-5 py-3.5 text-center font-bold w-24">จำนวนวิชา</th>
                <th className="px-5 py-3.5 text-center font-bold w-24">GPA</th>
                <th className="px-5 py-3.5 text-center font-bold w-28">ระดับ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {homeroomStudents.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">ยังไม่มีนักเรียนในห้องนี้</td></tr>
              ) : (
                homeroomStudents.map((s, idx) => {
                  const gpa = calculateGPAForStudent(s.student_id);
                  const gpaNum = parseFloat(gpa);
                  const subjectCount = grades.filter(g => g.student_id === s.student_id).length;
                  let gpaColor = "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
                  let statusLabel = "ดีเยี่ยม";
                  if (gpaNum < 1.0) { gpaColor = "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30"; statusLabel = "ต้องปรับปรุง"; }
                  else if (gpaNum < 2.0) { gpaColor = "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30"; statusLabel = "พอใช้"; }
                  else if (gpaNum < 3.0) { gpaColor = "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"; statusLabel = "ดี"; }
                  return (
                    <tr key={s.id} className="hover:bg-muted transition-colors">
                      <td className="px-5 py-4 text-center text-muted-foreground text-xs">{idx + 1}</td>
                      <td className="px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400 text-xs">{s.student_id}</td>
                      <td className="px-5 py-4 font-medium text-foreground">{s.name}</td>
                      <td className="px-5 py-4 text-center text-muted-foreground text-sm">{subjectCount}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-xl border font-extrabold text-base ${gpaColor}`}>{gpa}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${gpaColor}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border">
          {homeroomStudents.map((s, idx) => {
            const gpa = calculateGPAForStudent(s.student_id);
            const gpaNum = parseFloat(gpa);
            const subjectCount = grades.filter(g => g.student_id === s.student_id).length;
            let gpaColor = "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
            let statusLabel = "ดีเยี่ยม";
            if (gpaNum < 1.0) { gpaColor = "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30"; statusLabel = "ต้องปรับปรุง"; }
            else if (gpaNum < 2.0) { gpaColor = "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30"; statusLabel = "พอใช้"; }
            else if (gpaNum < 3.0) { gpaColor = "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"; statusLabel = "ดี"; }
            return (
              <div key={s.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{s.name}</div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">{s.student_id} · {subjectCount} วิชา</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-3 py-1 rounded-xl border font-extrabold text-lg ${gpaColor}`}>{gpa}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gpaColor}`}>{statusLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Term Mode Selector for Rankings */}
      <div className="card-modern overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h3 className="font-bold text-foreground text-sm">เลือกช่วงเวลาดูอันดับ</h3>
          <p className="text-xs text-muted-foreground mt-0.5">ปีการศึกษา {otherTermSettings.length > 0 ? otherTermSettings[0].academic_year : ""}</p>
        </div>
        <div className="p-5 flex flex-wrap gap-2">
          {otherTermSettings.map(s => (
            <button
              key={s.id}
              onClick={() => { setRankingMode("single"); setRankingTermSettingId(s.id); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 cursor-pointer ${
                rankingMode === "single" && (rankingTermSettingId === s.id || (!rankingTermSettingId && s.id === activeSettingId))
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-lg shadow-indigo-200/40"
                  : "bg-card/80 text-foreground border-border/60 hover:border-indigo-300 hover:bg-indigo-50/60 dark:bg-indigo-500/10 hover:shadow-sm"
              }`}
            >
              เทอม {s.term}
            </button>
          ))}
          <button
            onClick={() => { if (combinedAvailable) setRankingMode("combined"); }}
            disabled={!combinedAvailable}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${
              rankingMode === "combined"
                ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white border-purple-500 shadow-lg shadow-purple-200/40 cursor-pointer"
                : combinedAvailable
                ? "bg-card/80 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-500/30 hover:border-purple-400 hover:bg-purple-50/60 dark:bg-purple-500/10 cursor-pointer hover:shadow-sm"
                : "bg-muted/80 text-muted-foreground border-border/60 cursor-not-allowed"
            }`}
          >
            รวม 2 เทอม
            {!combinedAvailable && (
              <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">(ยังไม่มีคะแนนครบ)</span>
            )}
          </button>
        </div>
      </div>

      {/* Rankings Loading */}
      {!rankingsLoaded && activeSettingId && (
        <div className="card-modern p-8 text-center">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100/50 dark:border-indigo-500/25" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-violet-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-cyan-400 border-l-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-sm text-muted-foreground font-semibold">กำลังโหลดข้อมูลอันดับ...</p>
        </div>
      )}

      {/* Rankings Section */}
      {rankingsLoaded && classroomRankings.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Classroom Ranking */}
          <div className="card-modern overflow-hidden border-purple-200/40 dark:border-purple-500/30 animate-fade-in-up">
            <div className="px-5 py-4 bg-gradient-to-r from-purple-50/80 dark:from-purple-500/10 to-indigo-50/80 dark:to-indigo-500/10 border-b border-purple-100/60 dark:border-purple-500/25">
              <h3 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2 text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                อันดับในห้อง {homeroomClass?.name}
              </h3>
              <p className="text-xs text-purple-500 dark:text-purple-400 mt-0.5">
                {classroomRankings.length} คน · {rankingMode === "combined" ? "รวม 2 เทอม" : "จากคะแนนรวม"}
              </p>
            </div>
            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-center font-bold w-14">อันดับ</th>
                    <th className="px-3 py-2.5 font-bold">ชื่อ-นามสกุล</th>
                    <th className="px-3 py-2.5 text-center font-bold w-20">เปอร์เซ็นต์</th>
                    <th className="px-3 py-2.5 text-center font-bold w-16">GPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {classroomRankings.map(s => (
                    <tr key={`cr-${s.student_id}`} className={`transition-colors ${s.classroom_rank <= 3 ? "bg-amber-50/40 dark:bg-amber-500/10" : "hover:bg-muted"}`}>
                      <td className="px-3 py-2.5 text-center">
                        {s.classroom_rank <= 3 ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${s.classroom_rank === 1 ? "bg-amber-400 text-white" : s.classroom_rank === 2 ? "bg-gray-300 text-white" : "bg-orange-300 text-white"}`}>
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
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs font-extrabold ${s.percentage >= 80 ? "text-emerald-600 dark:text-emerald-400" : s.percentage >= 60 ? "text-amber-600 dark:text-amber-400" : s.percentage >= 50 ? "text-orange-600 dark:text-orange-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {s.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${s.gpa >= 3.0 ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : s.gpa >= 2.0 ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300" : s.gpa >= 1.0 ? "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300" : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"}`}>
                          {s.gpa.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile: Cards */}
            <div className="md:hidden max-h-[500px] overflow-y-auto p-3 space-y-2.5">
              {classroomRankings.map(s => (
                <div key={`cr-mob-${s.student_id}`} className={`p-3 rounded-xl border border-border flex items-center justify-between gap-3 ${s.classroom_rank <= 3 ? "bg-amber-50/40 dark:bg-amber-500/10 border-amber-200/50" : "bg-card"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {s.classroom_rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${s.classroom_rank === 1 ? "bg-amber-400 text-white" : s.classroom_rank === 2 ? "bg-gray-300 text-white" : "bg-orange-300 text-white"}`}>
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
                      <div className="text-[10px] text-subtle-foreground">รหัส {s.student_id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <div>
                      <div className={`text-xs font-extrabold ${s.percentage >= 80 ? "text-emerald-600 dark:text-emerald-400" : s.percentage >= 60 ? "text-amber-600 dark:text-amber-400" : s.percentage >= 50 ? "text-orange-600 dark:text-orange-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {s.percentage.toFixed(1)}%
                      </div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${s.gpa >= 3.0 ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : s.gpa >= 2.0 ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300" : s.gpa >= 1.0 ? "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300" : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"}`}>
                        GPA {s.gpa.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* School Ranking */}
          <div className="card-modern overflow-hidden border-blue-200/40 dark:border-blue-500/30 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50/80 dark:from-blue-500/10 to-indigo-50/80 dark:to-indigo-500/10 border-b border-blue-100/60 dark:border-blue-500/25">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                อันดับทั้งโรงเรียน
              </h3>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                เฉพาะนักเรียนห้อง {homeroomClass?.name} · จาก {rankingsData.length} คนทั้งหมด
                {rankingMode === "combined" && " · รวม 2 เทอม"}
              </p>
            </div>
            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-center font-bold w-14">อันดับ</th>
                    <th className="px-3 py-2.5 font-bold">ชื่อ-นามสกุล</th>
                    <th className="px-3 py-2.5 text-center font-bold w-20">เปอร์เซ็นต์</th>
                    <th className="px-3 py-2.5 text-center font-bold w-16">GPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schoolRankingsForClass.map(s => (
                    <tr key={`sr-${s.student_id}`} className="hover:bg-muted transition-colors">
                      <td className="px-3 py-2.5 text-center">
                        {s.school_rank <= 3 ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${s.school_rank === 1 ? "bg-amber-400 text-white" : s.school_rank === 2 ? "bg-gray-300 text-white" : "bg-orange-300 text-white"}`}>
                            {s.school_rank}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-bold text-xs">{s.school_rank}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-foreground text-xs">{s.student_name}</div>
                        <div className="text-[10px] text-subtle-foreground">{s.student_id} · อันดับ {s.school_rank}/{s.school_total}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs font-extrabold ${s.percentage >= 80 ? "text-emerald-600 dark:text-emerald-400" : s.percentage >= 60 ? "text-amber-600 dark:text-amber-400" : s.percentage >= 50 ? "text-orange-600 dark:text-orange-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {s.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${s.gpa >= 3.0 ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : s.gpa >= 2.0 ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300" : s.gpa >= 1.0 ? "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300" : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"}`}>
                          {s.gpa.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile: Cards */}
            <div className="md:hidden max-h-[500px] overflow-y-auto p-3 space-y-2.5">
              {schoolRankingsForClass.map(s => (
                <div key={`sr-mob-${s.student_id}`} className="p-3 rounded-xl border border-border flex items-center justify-between gap-3 bg-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {s.school_rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${s.school_rank === 1 ? "bg-amber-400 text-white" : s.school_rank === 2 ? "bg-gray-300 text-white" : "bg-orange-300 text-white"}`}>
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
                      <div className="text-[10px] text-subtle-foreground">รหัส {s.student_id} • อันดับโรงเรียน {s.school_rank}/{s.school_total}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <div>
                      <div className={`text-xs font-extrabold ${s.percentage >= 80 ? "text-emerald-600 dark:text-emerald-400" : s.percentage >= 60 ? "text-amber-600 dark:text-amber-400" : s.percentage >= 50 ? "text-orange-600 dark:text-orange-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {s.percentage.toFixed(1)}%
                      </div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${s.gpa >= 3.0 ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : s.gpa >= 2.0 ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300" : s.gpa >= 1.0 ? "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300" : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"}`}>
                        GPA {s.gpa.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
