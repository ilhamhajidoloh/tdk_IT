import { useState, useEffect } from "react";
import { type DBSubject, type SystemSetting } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import PermissionGate from "@/app/components/PermissionGate";

interface SubjectsTabProps {
  settingsList: SystemSetting[];
  selectedSubjectSettingId: number | null;
  handleSelectSubjectSetting: (id: number) => void;
  subjectsList: DBSubject[];
  handleAddSubject: () => void;
  handleOpenCopySubjectsModal: () => void;
  handleEditSubject: (subject: DBSubject) => void;
  handleDeleteSubject: (id: string, name: string) => void;
  token?: string | null;
}

type SubjectSubTab = "list" | "ordering" | "language";

export default function SubjectsTab({
  settingsList,
  selectedSubjectSettingId,
  handleSelectSubjectSetting,
  subjectsList,
  handleAddSubject,
  handleOpenCopySubjectsModal,
  handleEditSubject,
  handleDeleteSubject,
  token,
}: SubjectsTabProps) {
  const [subTab, setSubTab] = useState<SubjectSubTab>("list");

  return (
    <div className="p-8">
      <SectionHeader
        icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        color="amber"
        title="จัดการวิชาเรียน (Subjects)"
        subtitle="จัดการรายวิชา เรียงลำดับ และคำแปลภาษารายวิชา"
        count={selectedSubjectSettingId && subTab === "list" ? subjectsList.length : undefined}
        countLabel="วิชา"
      >
        {subTab === "list" && (
          <>
            <PermissionGate permission="subjects.create">
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
            </PermissionGate>
          </>
        )}
      </SectionHeader>

      {/* Sub-Tab Navigation */}
      <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl border border-border">
        <button
          onClick={() => setSubTab("list")}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            subTab === "list"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          }`}
        >
          📚 รายการวิชา
        </button>
        <button
          onClick={() => setSubTab("ordering")}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            subTab === "ordering"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          }`}
        >
          🔢 เรียงลำดับวิชา
        </button>
        <button
          onClick={() => setSubTab("language")}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            subTab === "language"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          }`}
        >
          🌐 คำแปลรายวิชา
        </button>
      </div>

      {/* Term Selector */}
      <TermSelector
        settingsList={settingsList}
        selectedId={selectedSubjectSettingId}
        onSelect={handleSelectSubjectSetting}
      />

      {/* Tab Content */}
      {subTab === "list" && (
        <>
          {!selectedSubjectSettingId ? (
            <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
              กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
            </div>
          ) : subjectsList.length === 0 ? (
            <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
              ยังไม่มีวิชาเรียนในเทอมนี้ กด &quot;เพิ่มวิชาเรียนใหม่&quot; เพื่อเริ่ม
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-border animate-fade-in-up">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-bold">ชื่อวิชาเรียน</th>
                      <th className="px-6 py-4 font-bold">ครูผู้สอน</th>
                      <th className="px-6 py-4 font-bold">ชั้นเรียน</th>
                      <th className="px-6 py-4 font-bold text-center">ประเภทวิชา</th>
                      <th className="px-6 py-4 font-bold text-center">คะแนนเต็ม (เก็บ/สอบ)</th>
                      <th className="px-6 py-4 font-bold text-center">จัดการ</th>
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
                            <PermissionGate permission="subjects.edit">
                              <button
                                onClick={() => handleEditSubject(sub)}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                              >
                                แก้ไขชื่อวิชา
                              </button>
                            </PermissionGate>
                            <PermissionGate permission="subjects.delete">
                              <button
                                onClick={() => handleDeleteSubject(sub.id, sub.name)}
                                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                              >
                                ลบ
                              </button>
                            </PermissionGate>
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
                      <PermissionGate permission="subjects.edit">
                        <button
                          onClick={() => handleEditSubject(sub)}
                          className="flex-1 text-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                        >
                          แก้ไขชื่อวิชา
                        </button>
                      </PermissionGate>
                      <PermissionGate permission="subjects.delete">
                        <button
                          onClick={() => handleDeleteSubject(sub.id, sub.name)}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                        >
                          ลบ
                        </button>
                      </PermissionGate>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Ordering Tab */}
      {subTab === "ordering" && (
        <SubjectOrderingSection
          selectedSubjectSettingId={selectedSubjectSettingId}
          subjectsList={subjectsList}
          token={token}
        />
      )}

      {/* Subject Language Translations Tab */}
      {subTab === "language" && (
        <SubjectLanguageSection
          selectedSubjectSettingId={selectedSubjectSettingId}
          subjectsList={subjectsList}
          token={token}
        />
      )}
    </div>
  );
}

// ===== Subject Ordering Section =====
interface SubjectOrderingSectionProps {
  selectedSubjectSettingId: number | null;
  subjectsList: DBSubject[];
  token?: string | null;
}

function SubjectOrderingSection({ selectedSubjectSettingId, subjectsList, token }: SubjectOrderingSectionProps) {
  const [orderedSubjects, setOrderedSubjects] = useState<DBSubject[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sorted = [...subjectsList].sort((a, b) => {
      const orderA = a.sort_order ?? 999;
      const orderB = b.sort_order ?? 999;
      return orderA - orderB || a.name.localeCompare(b.name, "th");
    });
    setOrderedSubjects(sorted);
  }, [subjectsList]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...orderedSubjects];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setOrderedSubjects(newList);
  };

  const moveDown = (index: number) => {
    if (index === orderedSubjects.length - 1) return;
    const newList = [...orderedSubjects];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setOrderedSubjects(newList);
  };

  const saveOrder = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const updates = orderedSubjects.map((sub, idx) => ({
        id: sub.id,
        sort_order: idx + 1,
      }));

      const res = await fetch("/api/subjects/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      if (res.ok) {
        const Swal = (await import("sweetalert2")).default;
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          text: "เรียงลำดับวิชาเรียบร้อยแล้ว",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error("Failed to save order");
      }
    } catch {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกลำดับได้", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedSubjectSettingId) {
    return (
      <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
        กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
      </div>
    );
  }

  if (orderedSubjects.length === 0) {
    return (
      <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
        ยังไม่มีวิชาเรียนในเทอมนี้
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30">
        <div>
          <div className="font-bold text-amber-900 dark:text-amber-200 text-sm">🔢 จัดเรียงลำดับการแสดงผลวิชาเรียน</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            ลำดับนี้จะใช้ในการแสดงผลใบรายงาน คะแนน และเอกสารต่างๆ ทั่วทั้งระบบ
          </div>
        </div>
        <PermissionGate permission="subjects.reorder">
          <button
            onClick={saveOrder}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer border-0 flex items-center gap-2"
          >
            {isSaving ? "กำลังบันทึก..." : "💾 บันทึกลำดับ"}
          </button>
        </PermissionGate>
      </div>

      <div className="space-y-2">
        {orderedSubjects.map((sub, idx) => (
          <div
            key={sub.id}
            className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-all"
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors border-0 cursor-pointer"
              >
                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === orderedSubjects.length - 1}
                className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors border-0 cursor-pointer"
              >
                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg font-bold text-foreground">
              {idx + 1}
            </div>

            <div className="flex-1">
              <div className="font-semibold text-foreground">{sub.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {sub.teacher_names?.join(", ") || sub.teacher_name || "-"}
              </div>
            </div>

            {sub.subject_type === "activity" ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                กิจกรรม
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                วิชาหลัก
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Subject Language Section (จัดการคำแปลรายวิชา) =====
interface SubjectLanguageSectionProps {
  selectedSubjectSettingId: number | null;
  subjectsList: DBSubject[];
  token?: string | null;
}

interface TranslationRecord {
  id: string;
  key: string;
  thai: string;
  malay_rumi: string;
  malay_jawi: string;
}

function SubjectLanguageSection({
  selectedSubjectSettingId,
  subjectsList,
  token,
}: SubjectLanguageSectionProps) {
  const [translations, setTranslations] = useState<TranslationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSubjectName, setEditingSubjectName] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ thai: "", malay_rumi: "", malay_jawi: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const loadTranslations = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/translations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTranslations(data);
      }
    } catch (err) {
      console.error("Failed to load translations", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTranslations();
  }, [token]);

  const getTranslationForSubject = (subjectName: string) => {
    const trimmed = subjectName.trim().toLowerCase();
    return translations.find(
      (t) =>
        t.key.trim().toLowerCase() === trimmed ||
        t.key.trim().toLowerCase() === `subj_${trimmed}` ||
        t.thai.trim().toLowerCase() === trimmed ||
        t.malay_rumi.trim().toLowerCase() === trimmed ||
        t.malay_jawi.trim().toLowerCase() === trimmed
    );
  };

  const handleStartEdit = (subjectName: string) => {
    const existing = getTranslationForSubject(subjectName);

    setEditingSubjectName(subjectName);
    setEditForm({
      thai: existing?.thai || (/^[ก-๙]/.test(subjectName) ? subjectName : ""),
      malay_rumi: existing?.malay_rumi || (/^[a-zA-Z]/.test(subjectName) ? subjectName : ""),
      malay_jawi: existing?.malay_jawi || (/^[\u0600-\u06FF]/.test(subjectName) ? subjectName : ""),
    });
  };

  const handleSaveTranslation = async (subjectName: string) => {
    if (!token) return;
    try {
      const trimmedKey = subjectName.trim();
      const res = await fetch("/api/translations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: trimmedKey,
          thai: editForm.thai.trim(),
          malay_rumi: editForm.malay_rumi.trim(),
          malay_jawi: editForm.malay_jawi.trim(),
        }),
      });

      if (res.ok) {
        await loadTranslations();
        setEditingSubjectName(null);
        const Swal = (await import("sweetalert2")).default;
        Swal.fire({
          icon: "success",
          title: "บันทึกคำแปลเรียบร้อย",
          timer: 1200,
          showConfirmButton: false,
        });
      } else {
        throw new Error("Failed to save translation");
      }
    } catch {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกคำแปลได้", "error");
    }
  };

  if (!selectedSubjectSettingId) {
    return (
      <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
        กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-subtle-foreground font-semibold">
        กำลังโหลดข้อมูลคำแปลรายวิชา...
      </div>
    );
  }

  const filteredSubjects = subjectsList.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder="ค้นหาชื่อวิชา..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-xs px-3.5 py-2 border border-border bg-card rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <span className="text-xs font-semibold text-muted-foreground">
          ทั้งหมด {filteredSubjects.length} วิชา
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-bold w-12 text-center">#</th>
              <th className="px-4 py-3 font-bold">ชื่อวิชาในระบบ (Registered Name)</th>
              <th className="px-4 py-3 font-bold">🇹🇭 ภาษาไทย (Thai)</th>
              <th className="px-4 py-3 font-bold">🇲🇾 Bahasa Melayu (Rumi)</th>
              <th className="px-4 py-3 font-bold">🇸🇦 Bahasa Melayu (Jawi / Arabic)</th>
              <th className="px-4 py-3 font-bold text-center">สถานะ</th>
              <th className="px-4 py-3 font-bold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-subtle-foreground font-semibold">
                  ยังไม่มีวิชาเรียนในเทอมนี้
                </td>
              </tr>
            ) : (
              filteredSubjects.map((sub, idx) => {
                const trans = getTranslationForSubject(sub.name);
                const isEditing = editingSubjectName === sub.name;
                const hasThai = Boolean(trans?.thai?.trim());
                const hasRumi = Boolean(trans?.malay_rumi?.trim());
                const hasJawi = Boolean(trans?.malay_jawi?.trim());
                const completedCount = (hasThai ? 1 : 0) + (hasRumi ? 1 : 0) + (hasJawi ? 1 : 0);

                return (
                  <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-center text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      {sub.name}
                      {sub.subject_type === "activity" && (
                        <span className="ml-2 text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                          กิจกรรม
                        </span>
                      )}
                    </td>
                    {/* Thai Column */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.thai}
                          onChange={(e) => setEditForm({ ...editForm, thai: e.target.value })}
                          placeholder="ภาษาไทย เช่น ฟิกฮ์"
                          className="w-full px-2.5 py-1.5 border border-emerald-300 dark:border-emerald-500/40 bg-card rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      ) : (
                        <span className="text-foreground font-medium">
                          {trans?.thai || <span className="text-muted-foreground">—</span>}
                        </span>
                      )}
                    </td>
                    {/* Rumi Column */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.malay_rumi}
                          onChange={(e) => setEditForm({ ...editForm, malay_rumi: e.target.value })}
                          placeholder="Rumi เช่น Fiqh"
                          className="w-full px-2.5 py-1.5 border border-emerald-300 dark:border-emerald-500/40 bg-card rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      ) : (
                        <span className="text-foreground font-medium">
                          {trans?.malay_rumi || <span className="text-muted-foreground">—</span>}
                        </span>
                      )}
                    </td>
                    {/* Jawi Column */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          dir="rtl"
                          value={editForm.malay_jawi}
                          onChange={(e) => setEditForm({ ...editForm, malay_jawi: e.target.value })}
                          placeholder="Jawi เช่น الفقه"
                          className="w-full px-2.5 py-1.5 border border-emerald-300 dark:border-emerald-500/40 bg-card rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-400 text-right"
                        />
                      ) : (
                        <span className="text-foreground font-medium" dir="rtl">
                          {trans?.malay_jawi || <span className="text-muted-foreground">—</span>}
                        </span>
                      )}
                    </td>
                    {/* Status Column */}
                    <td className="px-4 py-3 text-center">
                      {completedCount === 3 ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          ครบ 3 ภาษา
                        </span>
                      ) : completedCount > 0 ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          มี {completedCount}/3 ภาษา
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-500/15 text-muted-foreground">
                          ยังไม่ได้แปล
                        </span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSaveTranslation(sub.name)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer shadow-sm"
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => setEditingSubjectName(null)}
                            className="px-3 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <PermissionGate permission="subjects.translations">
                          <button
                            onClick={() => handleStartEdit(sub.name)}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer"
                          >
                            แก้ไขคำแปล
                          </button>
                        </PermissionGate>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
