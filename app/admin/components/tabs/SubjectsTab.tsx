import { useState, useEffect } from "react";
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
        subtitle="จัดการรายวิชา เรียงลำดับ และตั้งค่าภาษา"
        count={selectedSubjectSettingId && subTab === "list" ? subjectsList.length : undefined}
        countLabel="วิชา"
      >
        {subTab === "list" && (
          <>
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
          🌐 ภาษา & คำแปล
        </button>
      </div>

      {/* Term Selector - Show only for list and ordering tabs */}
      {(subTab === "list" || subTab === "ordering") && (
        <TermSelector
          settingsList={settingsList}
          selectedId={selectedSubjectSettingId}
          onSelect={handleSelectSubjectSetting}
        />
      )}

      {/* Tab Content */}
      {subTab === "list" && (
        <>
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

      {/* Language Tab */}
      {subTab === "language" && (
        <LanguageManagementSection token={token} />
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

  // Initialize ordered subjects
  useEffect(() => {
    const sorted = [...subjectsList].sort((a, b) => {
      const orderA = a.sort_order ?? 999;
      const orderB = b.sort_order ?? 999;
      return orderA - orderB;
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
    } catch (err) {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกลำดับได้", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedSubjectSettingId) {
    return (
      <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
        กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
      </div>
    );
  }

  if (orderedSubjects.length === 0) {
    return (
      <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
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
            ลำดับนี้จะใช้ในการแสดงผลใบรายงานและเอกสารต่างๆ
          </div>
        </div>
        <button
          onClick={saveOrder}
          disabled={isSaving}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer border-0 flex items-center gap-2"
        >
          {isSaving ? "กำลังบันทึก..." : "💾 บันทึกลำดับ"}
        </button>
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

// ===== Language Management Section =====
interface LanguageManagementSectionProps {
  token?: string | null;
}

interface TranslationEntry {
  id: string;
  key: string;
  thai: string;
  malay_rumi: string;
  malay_jawi: string;
}

function LanguageManagementSection({ token }: LanguageManagementSectionProps) {
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ thai: "", malay_rumi: "", malay_jawi: "" });

  // Load translations from API
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

  const handleEdit = (entry: TranslationEntry) => {
    setEditingId(entry.id);
    setEditForm({
      thai: entry.thai,
      malay_rumi: entry.malay_rumi,
      malay_jawi: entry.malay_jawi,
    });
  };

  const handleSave = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/translations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        await loadTranslations();
        setEditingId(null);
        const Swal = (await import("sweetalert2")).default;
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกได้", "error");
    }
  };

  const handleAddNew = async () => {
    const Swal = (await import("sweetalert2")).default;
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มคำศัพท์ใหม่",
      html: `
        <div class="space-y-3 text-left">
          <div>
            <label class="block text-xs font-bold mb-1">Key (ภาษาอังกฤษ)</label>
            <input id="key" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="เช่น grade">
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">ภาษาไทย</label>
            <input id="thai" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="เกรด">
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">Bahasa Melayu (Rumi)</label>
            <input id="rumi" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Gred">
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">Bahasa Melayu (Jawi)</label>
            <input id="jawi" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="ڬريد">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "เพิ่ม",
      cancelButtonText: "ยกเลิก",
      preConfirm: () => {
        const key = (document.getElementById("key") as HTMLInputElement).value;
        const thai = (document.getElementById("thai") as HTMLInputElement).value;
        const rumi = (document.getElementById("rumi") as HTMLInputElement).value;
        const jawi = (document.getElementById("jawi") as HTMLInputElement).value;

        if (!key || !thai) {
          Swal.showValidationMessage("กรุณากรอก Key และภาษาไทย");
          return null;
        }
        return { key, thai, malay_rumi: rumi, malay_jawi: jawi };
      },
    });

    if (formValues && token) {
      try {
        const res = await fetch("/api/translations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formValues),
        });

        if (res.ok) {
          await loadTranslations();
          Swal.fire({
            icon: "success",
            title: "เพิ่มสำเร็จ",
            timer: 1000,
            showConfirmButton: false,
          });
        } else {
          const data = await res.json();
          Swal.fire("ข้อผิดพลาด", data.error || "ไม่สามารถเพิ่มได้", "error");
        }
      } catch (err) {
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์", "error");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-subtle-foreground">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
        <div>
          <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">🌐 จัดการคำแปลภาษา</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            คำศัพท์เหล่านี้ใช้ในการแสดงผลรายงานและเอกสารหลายภาษา
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer border-0 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มคำศัพท์
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-bold">Key</th>
              <th className="px-4 py-3 font-bold">ภาษาไทย</th>
              <th className="px-4 py-3 font-bold">Bahasa Melayu (Rumi)</th>
              <th className="px-4 py-3 font-bold">Bahasa Melayu (Jawi)</th>
              <th className="px-4 py-3 font-bold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {translations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-subtle-foreground">
                  ยังไม่มีคำศัพท์ในระบบ กด &quot;เพิ่มคำศัพท์&quot; เพื่อเริ่ม
                </td>
              </tr>
            ) : (
              translations.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                    {entry.key}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editForm.thai}
                        onChange={(e) => setEditForm({ ...editForm, thai: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    ) : (
                      <span className="text-foreground font-medium">{entry.thai}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editForm.malay_rumi}
                        onChange={(e) => setEditForm({ ...editForm, malay_rumi: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    ) : (
                      <span className="text-muted-foreground">{entry.malay_rumi || "-"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editForm.malay_jawi}
                        onChange={(e) => setEditForm({ ...editForm, malay_jawi: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                        dir="rtl"
                      />
                    ) : (
                      <span className="text-muted-foreground" dir="rtl">{entry.malay_jawi || "-"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === entry.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleSave(entry.id)}
                          className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors border-0 cursor-pointer"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-bold hover:bg-muted/80 transition-colors border-0 cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(entry)}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-200 transition-colors border-0 cursor-pointer"
                      >
                        แก้ไข
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
