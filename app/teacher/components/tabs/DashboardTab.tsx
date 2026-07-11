import { type DBStudent, type DBSubject, type DBGrade, type DBClassroom, type ScheduleEntry } from "../types";
import { formatThaiDateRange } from "../../../lib/format";

interface DashboardTabProps {
  teacherName: string;
  homeroomClass: DBClassroom | null;
  homeroomStudents: DBStudent[];
  mySubjects: DBSubject[];
  students: DBStudent[];
  classrooms: DBClassroom[];
  grades: DBGrade[];
  term: string;
  isGradingActive: boolean;
  settingsStartDate: string;
  settingsEndDate: string;
  myScheduleEntries: ScheduleEntry[];
  setActiveTab: (tab: any) => void;
  setEnterSubject: (subjName: string) => void;
  setEnterClassroom: (classId: string) => void;
  setEvaluateSubjectId: (subjId: string) => void;
  setEvaluateClassroomId: (classId: string) => void;
  setAttendanceSubjectId: (subjId: string) => void;
  setAttendanceClassroomId: (classId: string) => void;
}

export default function DashboardTab({
  teacherName,
  homeroomClass,
  homeroomStudents,
  mySubjects,
  students,
  classrooms,
  grades,
  term,
  isGradingActive,
  settingsStartDate,
  settingsEndDate,
  myScheduleEntries,
  setActiveTab,
  setEnterSubject,
  setEnterClassroom,
  setEvaluateSubjectId,
  setEvaluateClassroomId,
  setAttendanceSubjectId,
  setAttendanceClassroomId,
}: DashboardTabProps) {
  // 1. Calculate general stats
  const taughtClassrooms = classrooms.filter(c =>
    mySubjects.some(s => s.classroom_ids?.includes(c.id))
  );

  const taughtStudentCount = students.filter(st =>
    mySubjects.some(s => s.classroom_ids?.includes(st.classroom_id ?? ""))
  ).length;

  // 2. Calculate grade entry progress
  let totalExpectedGrades = 0;
  let enteredGradesCount = 0;

  mySubjects.forEach(s => {
    const classIds = s.classroom_ids || [];
    classIds.forEach(cid => {
      const classStudents = students.filter(st => st.classroom_id === cid);
      totalExpectedGrades += classStudents.length;
      classStudents.forEach(st => {
        const hasGrade = grades.some(
          g => g.student_id === st.student_id &&
            g.subject.trim().toLowerCase() === s.name.trim().toLowerCase() &&
            g.term === term
        );
        if (hasGrade) enteredGradesCount++;
      });
    });
  });

  const gradingProgressPct = totalExpectedGrades > 0 ? (enteredGradesCount / totalExpectedGrades) * 100 : 0;

  // 3. Today's classes
  const todayDayNum = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const todaySchedule = myScheduleEntries
    .filter(entry => Number(entry.day_of_week) === todayDayNum)
    .sort((a, b) => Number(a.period_no) - Number(b.period_no));

  const thaiDayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  const todayThaiName = thaiDayNames[todayDayNum];

  const formattedTodayDate = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleQuickGradesAction = (subjectName: string, classroomId: string) => {
    setEnterSubject(subjectName);
    setEnterClassroom(classroomId);
    setActiveTab("enter");
  };

  const handleQuickAttendanceAction = (subjectId: string, classroomId: string) => {
    setAttendanceSubjectId(subjectId);
    setAttendanceClassroomId(classroomId);
    setActiveTab("attendance");
  };

  const handleQuickEvaluateAction = (subjectId: string, classroomId: string) => {
    setEvaluateSubjectId(subjectId);
    setEvaluateClassroomId(classroomId);
    setActiveTab("evaluate");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className="card-modern relative overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
              พอร์ทัลคุณครู
            </span>
            <span className="text-xs text-muted-foreground">เทอม {term}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            สวัสดีครับ/ค่ะ, <span className="gradient-text font-black">ครู {teacherName}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            ยินดีต้อนรับกลับสู่ระบบจัดการวิชาการและคะแนนนักเรียน วันนี้คือวัน{todayThaiName}ที่ {formattedTodayDate}
          </p>
        </div>

        {/* Grading window notification */}
        <div className="shrink-0 bg-card border border-border p-4 rounded-2xl max-w-sm flex items-start gap-3 shadow-sm">
          <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
          <div className="space-y-1">
            <div className="text-xs font-bold text-foreground">
              {isGradingActive ? "🟢 ระบบกำลังเปิดรับคะแนน" : "🔴 ปิดรับการบันทึกคะแนน"}
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold">
              ช่วงเวลากรอก: {formatThaiDateRange(settingsStartDate, settingsEndDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Subjects */}
        <div className="card-modern p-5 flex items-center justify-between hover:shadow-md transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">วิชาที่รับผิดชอบ</span>
            <div className="text-3xl font-black text-foreground">{mySubjects.length} วิชา</div>
            <p className="text-xs text-muted-foreground font-semibold">ใน {taughtClassrooms.length} ห้องเรียน</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        {/* Stat 2: Students */}
        <div className="card-modern p-5 flex items-center justify-between hover:shadow-md transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">จำนวนนักเรียนที่สอน</span>
            <div className="text-3xl font-black text-foreground">{taughtStudentCount} คน</div>
            <p className="text-xs text-muted-foreground font-semibold">จากห้องเรียนที่ได้รับมอบหมาย</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Stat 3: Homeroom */}
        <button
          onClick={() => homeroomClass && setActiveTab("homeroom")}
          disabled={!homeroomClass}
          className={`card-modern p-5 flex items-center justify-between text-left hover:shadow-md hover:border-indigo-300 transition-all duration-200 ${homeroomClass ? "cursor-pointer" : "opacity-80"}`}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ห้องประจำชั้น</span>
            <div className="text-2xl font-black text-foreground">
              {homeroomClass ? homeroomClass.name : "ไม่มี"}
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              {homeroomClass ? `${homeroomStudents.length} นักเรียนในชั้น` : "ไม่ได้เป็นครูประจำชั้น"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </button>

        {/* Stat 4: Grading Progress */}
        <button
          onClick={() => setActiveTab("enter")}
          className="card-modern p-5 flex items-center justify-between text-left hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer"
        >
          <div className="space-y-1 flex-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ความคืบหน้าการกรอกคะแนน</span>
            <div className="text-3xl font-black text-foreground">{gradingProgressPct.toFixed(1)}%</div>
            <div className="w-3/4 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${gradingProgressPct}%` }}
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </button>
      </div>

      {/* Main Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule (1/3) */}
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              คาบสอนวันนี้
            </h2>
            <button
              onClick={() => setActiveTab("schedule")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer border-0 bg-transparent"
            >
              ดูตารางทั้งหมด
            </button>
          </div>

          <div className="card-modern flex-1 p-5 space-y-4 overflow-y-auto max-h-[450px]">
            {todaySchedule.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-sm text-foreground">ไม่มีชั่วโมงสอนวันนี้</div>
                  <p className="text-xs text-muted-foreground">พักผ่อนหรือจัดการเอกสารคะแนนอย่างสบายใจ</p>
                </div>
              </div>
            ) : (
              <div className="relative border-l border-indigo-100 dark:border-indigo-500/20 pl-4 space-y-5 py-2">
                {todaySchedule.map((entry, idx) => {
                  const subjectObj = mySubjects.find(s => s.id === entry.subject_id);
                  return (
                    <div key={entry.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-card group-hover:scale-125 transition-transform" />

                      <div className="bg-muted/40 hover:bg-muted/70 dark:bg-indigo-500/5 dark:hover:bg-indigo-500/10 p-3 rounded-xl border border-border/50 transition-colors space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                            คาบที่ {entry.period_no}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {entry.start_time} - {entry.end_time} น.
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-xs text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {entry.subject_name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-bold mt-0.5">
                            ห้องเรียน: {entry.classroom_name}
                          </div>
                        </div>

                        {/* Quick link */}
                        {subjectObj && (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
                            <button
                              onClick={() => handleQuickGradesAction(entry.subject_name, entry.classroom_id)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 border-0 bg-transparent cursor-pointer"
                            >
                              กรอกคะแนน
                            </button>
                            <span className="text-[10px] text-muted-foreground/40">•</span>
                            <button
                              onClick={() => handleQuickAttendanceAction(entry.subject_id, entry.classroom_id)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 border-0 bg-transparent cursor-pointer"
                            >
                              เช็คชื่อ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Subjects & Action Shortcuts (2/3) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            รายวิชาและห้องเรียนที่ดูแล
          </h2>

          <div className="flex-1 space-y-4">
            {mySubjects.length === 0 ? (
              <div className="card-modern py-12 text-center text-muted-foreground font-semibold">
                ยังไม่มีวิชาที่คุณสอนถูกกำหนดให้มีการเก็บคะแนนในภาคเรียนนี้
              </div>
            ) : (
              mySubjects.map(subj => {
                const subjectClassroomIds = subj.classroom_ids || [];
                const subjectClassrooms = classrooms.filter(c => subjectClassroomIds.includes(c.id));

                return (
                  <div key={subj.id} className="card-modern overflow-hidden">
                    <div className="px-5 py-3.5 bg-muted/30 dark:bg-indigo-500/5 border-b border-border/50 flex justify-between items-center gap-3">
                      <div>
                        <div className="font-bold text-foreground text-sm flex items-center gap-2">
                          {subj.name}
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                            {subj.subject_type === "activity" ? "วิชากิจกรรม" : `${Number(subj.credit_hours) || 1} หน่วยกิต`}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold">
                        สอนใน {subjectClassrooms.length} ห้อง
                      </span>
                    </div>

                    <div className="divide-y divide-border/60">
                      {subjectClassrooms.map(c => {
                        const classStudents = students.filter(st => st.classroom_id === c.id);
                        const totalCount = classStudents.length;
                        const gradedCount = classStudents.filter(st =>
                          grades.some(
                            g => g.student_id === st.student_id &&
                              g.subject.trim().toLowerCase() === subj.name.trim().toLowerCase() &&
                              g.term === term
                          )
                        ).length;

                        const pct = totalCount > 0 ? (gradedCount / totalCount) * 100 : 0;
                        const isDone = gradedCount > 0 && gradedCount === totalCount;

                        return (
                          <div key={c.id} className="px-5 py-4 hover:bg-muted/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            {/* Class and Progress Info */}
                            <div className="space-y-1.5 flex-1 min-w-[200px]">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-foreground">ชั้น {c.name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-muted-foreground dark:bg-slate-800'}`}>
                                  กรอกแล้ว {gradedCount} / {totalCount} คน ({pct.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            {/* Action links */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                              <button
                                onClick={() => handleQuickGradesAction(subj.name, c.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-300 cursor-pointer border-0 transition-all"
                              >
                                บันทึกคะแนน
                              </button>
                              <button
                                onClick={() => handleQuickAttendanceAction(subj.id, c.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-300 cursor-pointer border-0 transition-all"
                              >
                                เช็คชื่อ
                              </button>
                              <button
                                onClick={() => handleQuickEvaluateAction(subj.id, c.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:hover:bg-fuchsia-500/20 dark:text-fuchsia-300 cursor-pointer border-0 transition-all"
                              >
                                ประเมินคุณลักษณะ
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
