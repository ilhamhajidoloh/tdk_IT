import { type DBSubject, type SystemSetting } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";

interface SubjectsTabProps {
  settingsList: SystemSetting[];
  selectedSubjectSettingId: number | null;
  handleSelectSubjectSetting: (id: number) => void;
  subjectsList: DBSubject[];
  handleAddSubject: () => void;
  handleOpenCopySubjectsModal: () => void;
  handleEditSubject: (subject: DBSubject) => void;
  handleDeleteSubject: (id: string, name: string) => void;
}

export default function SubjectsTab({
  settingsList,
  selectedSubjectSettingId,
  handleSelectSubjectSetting,
  subjectsList,
  handleAddSubject,
  handleOpenCopySubjectsModal,
  handleEditSubject,
  handleDeleteSubject,
}: SubjectsTabProps) {
  return (
    <div className="p-8">
      <SectionHeader
        icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        color="amber"
        title="จัดการวิชาเรียน (Subjects)"
        subtitle="วิชาเรียนแต่ละรายวิชาผูกกับปีการศึกษา / เทอม"
        count={selectedSubjectSettingId ? subjectsList.length : undefined}
        countLabel="วิชา"
      >
        <button
          onClick={handleAddSubject}
          disabled={!selectedSubjectSettingId}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-muted disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มวิชาเรียนใหม่
        </button>
        <button
          onClick={handleOpenCopySubjectsModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium border border-border bg-card hover:bg-muted text-foreground shadow-sm transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          คัดลอกวิชาเรียน
        </button>
      </SectionHeader>

      {/* Term Selector */}
      <TermSelector
        settingsList={settingsList}
        selectedId={selectedSubjectSettingId}
        onSelect={handleSelectSubjectSetting}
      />

      {/* Subjects Table */}
      {!selectedSubjectSettingId ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : subjectsList.length === 0 ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
          ยังไม่มีวิชาเรียนในเทอมนี้ กด &quot;เพิ่มวิชาเรียนใหม่&quot; เพื่อเริ่ม
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border animate-fade-in-up">
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold font-bold">ชื่อวิชาเรียน</th>
                  <th className="px-6 py-4 font-semibold font-bold">ครูผู้สอน</th>
                  <th className="px-6 py-4 font-semibold font-bold">ชั้นเรียน</th>
                  <th className="px-6 py-4 font-semibold text-center">ประเภทวิชา</th>
                  <th className="px-6 py-4 font-semibold text-center">คะแนนเต็ม (เก็บ/สอบ)</th>
                  <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subjectsList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-semibold text-foreground">{sub.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {sub.teacher_names && sub.teacher_names.length > 0
                        ? sub.teacher_names.join(", ")
                        : sub.teacher_name || "-"}
                      {sub.teacher_names && sub.teacher_names.length > 1 && (
                        <span className="ml-1.5 text-xs bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">
                          สอนรวม
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {sub.classroom_names && sub.classroom_names.length > 0
                        ? sub.classroom_names.join(", ")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sub.subject_type === "activity" ? (
                        <span className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                            วิชากิจกรรม
                          </span>
                          {Number(sub.midterm_max_score) + Number(sub.final_max_score) > 0 ? (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                              มีคะแนน
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">ไม่มีคะแนน</span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                            วิชาหลัก
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {Number(sub.credit_hours) || 1} หน่วยกิต
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                      {sub.subject_type === "activity" &&
                      Number(sub.midterm_max_score) + Number(sub.final_max_score) === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        `${sub.midterm_max_score ?? 50} / ${sub.final_max_score ?? 50}`
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditSubject(sub)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                        >
                          แก้ไขชื่อวิชา
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(sub.id, sub.name)}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 animate-fade-in-up">
            {subjectsList.map((sub) => (
              <div key={sub.id} className="card-modern p-4">
                <div className="font-semibold text-foreground">{sub.name}</div>
                <div className="text-xs text-muted-foreground mt-1.5 space-y-0.5">
                  <div>
                    <span className="font-medium">ครูผู้สอน:</span>{" "}
                    {sub.teacher_names && sub.teacher_names.length > 0
                      ? sub.teacher_names.join(", ")
                      : sub.teacher_name || "-"}
                    {sub.teacher_names && sub.teacher_names.length > 1 && (
                      <span className="ml-1 text-[10px] bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">
                        สอนรวม
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">ชั้นเรียน:</span>{" "}
                    {sub.classroom_names && sub.classroom_names.length > 0
                      ? sub.classroom_names.join(", ")
                      : "-"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">ประเภทวิชา:</span>
                    {sub.subject_type === "activity" ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                        วิชากิจกรรม
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                        วิชาหลัก ({Number(sub.credit_hours) || 1} หน่วยกิต)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">คะแนนเต็ม:</span> เก็บ {sub.midterm_max_score ?? 50} / สอบ{" "}
                    {sub.final_max_score ?? 50}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => handleEditSubject(sub)}
                    className="flex-1 text-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                  >
                    แก้ไขชื่อวิชา
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(sub.id, sub.name)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
