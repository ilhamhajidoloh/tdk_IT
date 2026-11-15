import { type ChangeEvent, useRef, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Download,
  Filter,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
  ArrowUp,
  ArrowDown,
  School,
  SlidersHorizontal,
  Info,
  Check,
  FileSpreadsheet,
  AlertCircle,
  Clock,
} from "lucide-react";
import { type SystemSetting, type DBStudent, type EvaluationTopic, type EvaluationSummaryRow } from "../types";
import { RWT_TOPICS, RATING_LEVELS, RATING_BADGE_CLASSES, isEvaluationTermOpen } from "../../../lib/evaluation";
import SectionHeader from "../SectionHeader";

interface EvaluationsTabProps {
  settingsList: SystemSetting[];
  evalSettingId: number | null;
  handleSelectEvalSetting: (id: number) => void;
  evalLoading: boolean;
  evalTopics: EvaluationTopic[];
  evalStudents: DBStudent[];
  evalClassrooms: {
    id: string;
    name: string;
    name_thai?: string | null;
    name_rumi?: string | null;
    name_jawi?: string | null;
  }[];
  evalClassroomId: string;
  setEvalClassroomId: (id: string) => void;
  evalSummary: EvaluationSummaryRow[];
  evalTopicForm: { name_th: string; name_rumi: string; name_jawi: string };
  setEvalTopicForm: (form: { name_th: string; name_rumi: string; name_jawi: string }) => void;
  evalSavingTopic: boolean;
  onAddTopic: () => void;
  onUpdateTopic: (id: string, patch: Partial<{ name_th: string; name_rumi: string; name_jawi: string; sort_order: number; is_active: boolean }>) => void;
  onReorderTopic: (index: number, direction: "up" | "down") => void;
  onDeleteTopic: (id: string) => void;
  onImportTopics: (topics: { name_th: string; name_rumi?: string; name_jawi?: string }[]) => void;
}

function RatingBadge({ rating, size = "md" }: { rating: number | undefined; size?: "sm" | "md" }) {
  if (rating === undefined) {
    return (
      <span className={`inline-flex items-center justify-center font-medium text-subtle-foreground/50 ${
        size === "sm" ? "text-[11px] px-1 py-0.5" : "text-xs px-2 py-0.5"
      }`}>
        —
      </span>
    );
  }
  const level = RATING_LEVELS.find(r => r.value === rating);
  if (!level) return <span className="text-xs text-subtle-foreground">—</span>;
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-lg border whitespace-nowrap shadow-xs transition-transform ${
        RATING_BADGE_CLASSES[rating]
      } ${size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          rating === 3
            ? "bg-emerald-500"
            : rating === 2
            ? "bg-sky-500"
            : rating === 1
            ? "bg-amber-500"
            : "bg-rose-500"
        }`}
      />
      <span>{level.th}</span>
    </span>
  );
}

export default function EvaluationsTab({
  settingsList,
  evalSettingId,
  handleSelectEvalSetting,
  evalLoading,
  evalTopics,
  evalStudents,
  evalClassrooms,
  evalClassroomId,
  setEvalClassroomId,
  evalSummary,
  evalTopicForm,
  setEvalTopicForm,
  evalSavingTopic,
  onAddTopic,
  onUpdateTopic,
  onReorderTopic,
  onDeleteTopic,
  onImportTopics,
}: EvaluationsTabProps) {
  const [viewMode, setViewMode] = useState<"results" | "topics">("results");
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name_th: "", name_rumi: "", name_jawi: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all");
  const importInputRef = useRef<HTMLInputElement>(null);

  const sortedTopics = useMemo(
    () => [...evalTopics].sort((a, b) => a.sort_order - b.sort_order),
    [evalTopics]
  );
  const activeTopics = useMemo(
    () => sortedTopics.filter(t => t.is_active),
    [sortedTopics]
  );
  const totalTopicsCount = activeTopics.length + RWT_TOPICS.length;

  const selectedSetting = settingsList.find(s => s.id === evalSettingId);
  const evaluationSettings = settingsList.filter(setting => String(setting.term) === "2");
  const termOpen = isEvaluationTermOpen(selectedSetting?.term);

  const classroomStudents = useMemo(() => {
    return evalStudents
      .filter(s => s.classroom_id === evalClassroomId)
      .sort((a, b) => (a.student_number ?? 9999) - (b.student_number ?? 9999) || a.name.localeCompare(b.name, "th"));
  }, [evalStudents, evalClassroomId]);

  const findRating = (studentId: string, category: "character" | "rwt", topicKey: string) =>
    evalSummary.find(r => r.student_id === studentId && r.category === category && r.topic_key === topicKey)?.rating;

  const getStudentProgress = (studentId: string) => {
    let done = 0;
    for (const t of activeTopics) {
      if (findRating(studentId, "character", t.id) !== undefined) done++;
    }
    for (const rt of RWT_TOPICS) {
      if (findRating(studentId, "rwt", rt.key) !== undefined) done++;
    }
    return {
      done,
      total: totalTopicsCount,
      isComplete: totalTopicsCount > 0 && done === totalTopicsCount,
    };
  };

  const classStats = useMemo(() => {
    if (classroomStudents.length === 0) return { total: 0, completed: 0, pending: 0, percent: 0 };
    let completed = 0;
    for (const s of classroomStudents) {
      const { isComplete } = getStudentProgress(s.student_id);
      if (isComplete) completed++;
    }
    const total = classroomStudents.length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percent };
  }, [classroomStudents, activeTopics, evalSummary]);

  const filteredStudents = useMemo(() => {
    return classroomStudents.filter(student => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = student.name.toLowerCase().includes(q);
        const matchId = student.student_id.toLowerCase().includes(q);
        const matchNum = student.student_number !== null && String(student.student_number).includes(q);
        if (!matchName && !matchId && !matchNum) return false;
      }
      if (filterStatus !== "all") {
        const { isComplete } = getStudentProgress(student.student_id);
        if (filterStatus === "completed" && !isComplete) return false;
        if (filterStatus === "pending" && isComplete) return false;
      }
      return true;
    });
  }, [classroomStudents, searchQuery, filterStatus, activeTopics, evalSummary]);

  const startEdit = (t: EvaluationTopic) => {
    setEditingTopicId(t.id);
    setEditForm({ name_th: t.name_th, name_rumi: t.name_rumi || "", name_jawi: t.name_jawi || "" });
  };

  const saveEdit = () => {
    if (!editingTopicId) return;
    onUpdateTopic(editingTopicId, editForm);
    setEditingTopicId(null);
  };

  const downloadTemplate = (format: "xlsx" | "csv") => {
    const sheet = XLSX.utils.aoa_to_sheet([["ชื่อหัวข้อ (ไทย) *", "Rumi", "Jawi"]]);
    if (format === "xlsx") {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "หัวข้อคุณลักษณะ");
      XLSX.writeFile(workbook, "แม่แบบหัวข้อคุณลักษณะ.xlsx");
      return;
    }
    const csv = `\uFEFF${XLSX.utils.sheet_to_csv(sheet)}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "แม่แบบหัวข้อคุณลักษณะ.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      const topics = rows.map(row => ({
        name_th: String(row["ชื่อหัวข้อ (ไทย) *"] || row["ชื่อหัวข้อ (ไทย)"] || row["ชื่อหัวข้อ"] || row.name_th || "").trim(),
        name_rumi: String(row.Rumi || row["ชื่อรูมี"] || row.name_rumi || "").trim(),
        name_jawi: String(row.Jawi || row["ชื่อยาวี"] || row.name_jawi || "").trim(),
      })).filter(topic => topic.name_th);

      onImportTopics(topics);
    } catch {
      alert("ไม่สามารถอ่านไฟล์ได้ กรุณาใช้ไฟล์ .xlsx หรือ .csv ตามแม่แบบ");
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Main Section Header */}
      <SectionHeader
        icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        color="purple"
        title="ประเมินคุณลักษณะอันพึงประสงค์"
        subtitle="จัดการหัวข้อคุณลักษณะฯ และตรวจสอบผลสรุปการประเมินประจำปีการศึกษา (เทอม 2)"
      >
        {/* Navigation Switcher Pills */}
        <div className="inline-flex p-1 bg-muted/80 backdrop-blur-sm rounded-2xl border border-border/80 shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("results")}
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === "results"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="w-4 h-4 text-indigo-500" />
            <span>ผลการประเมินรายห้อง</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("topics")}
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === "topics"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-violet-500" />
            <span>จัดการหัวข้อคุณลักษณะ</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold">
              {evalTopics.length}
            </span>
          </button>
        </div>
      </SectionHeader>

      {/* VIEW 1: RESULTS (ผลการประเมินรายห้อง) */}
      {viewMode === "results" && (
        <div className="space-y-6 animate-fade-in">
          {/* Term Warning Alert */}
          {selectedSetting && !termOpen && (
            <div className="flex items-start gap-3 bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur-sm border border-rose-200/60 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 p-4 rounded-2xl text-sm font-semibold shadow-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-bold">ระบบเปิดให้ดูผลการประเมินเฉพาะภาคเรียนที่ 2</p>
                <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                  ปีการศึกษาปัจจุบันที่เลือกไม่ได้กำหนดเป็นเทอม 2 จึงยังไม่เปิดประมวลผลคุณลักษณะอันพึงประสงค์
                </p>
              </div>
            </div>
          )}

          {/* Academic Year & Classroom Selection Control Card */}
          <div className="card-modern p-4 sm:p-5 lg:p-6 border border-border/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">ข้อมูลห้องเรียนและปีการศึกษา</h3>
                  <p className="text-xs text-muted-foreground">ผลการประเมินประมวลผลอัตโนมัติสำหรับเทอม 2</p>
                </div>
              </div>

              {/* Year Selector */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-muted-foreground shrink-0">ปีการศึกษา:</span>
                <select
                  id="evaluation-year"
                  value={evalSettingId || ""}
                  onChange={(event) => handleSelectEvalSetting(Number(event.target.value))}
                  className="input-modern !py-1.5 !px-3 text-xs sm:text-sm font-semibold min-w-[170px]"
                >
                  <option value="" disabled>-- เลือกปีการศึกษา --</option>
                  {evaluationSettings.map(setting => (
                    <option key={setting.id} value={setting.id}>
                      ปีการศึกษา {setting.academic_year} (เทอม 2)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Classrooms List */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-bold text-subtle-foreground uppercase tracking-wider">
                  เลือกห้องเรียน ({evalClassrooms.length} ห้อง):
                </span>
                {evalClassroomId && (
                  <button
                    type="button"
                    onClick={() => setEvalClassroomId("")}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ล้างการเลือก
                  </button>
                )}
              </div>

              {evalClassrooms.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 text-center text-xs text-subtle-foreground">
                  ไม่พบห้องเรียนในระบบสำหรับปีการศึกษานี้
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {evalClassrooms.map(c => {
                    const isSelected = evalClassroomId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setEvalClassroomId(c.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-[1.02]"
                            : "bg-card text-foreground border-border/80 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10"
                        }`}
                      >
                        <span>{c.name}</span>
                        {c.name_thai && c.name_thai !== c.name && (
                          <span className={`text-[10px] font-normal ${isSelected ? "text-indigo-100" : "text-muted-foreground"}`}>
                            ({c.name_thai})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Conditional Result State */}
          {!evalSettingId ? (
            <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border shadow-xs">
              <Award className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="font-bold text-foreground text-base">กรุณาเลือกปีการศึกษาด้านบน</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                เลือกปีการศึกษาเพื่อโหลดรายชื่อห้องเรียนและผลการประเมินคุณลักษณะอันพึงประสงค์
              </p>
            </div>
          ) : !termOpen ? (
            <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border shadow-xs">
              <Clock className="w-12 h-12 text-amber-500/40 mx-auto mb-3" />
              <h4 className="font-bold text-foreground text-base">ระบบยังไม่เปิดให้ดูผลการประเมิน</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                ระบบจะเปิดให้ดูผลการประเมินคุณลักษณะอันพึงประสงค์เฉพาะภาคเรียนที่ 2
              </p>
            </div>
          ) : evalLoading ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-xs">
              <div className="inline-block w-9 h-9 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
              <p className="text-muted-foreground font-semibold text-sm">กำลังโหลดข้อมูลผลการประเมิน...</p>
            </div>
          ) : !evalClassroomId ? (
            <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border shadow-xs">
              <School className="w-12 h-12 text-indigo-400/40 mx-auto mb-3" />
              <h4 className="font-bold text-foreground text-base">กรุณาเลือกห้องเรียนที่ต้องการดูผล</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                คลิกเลือกห้องเรียนในกล่องด้านบนเพื่อเปิดดูตารางสรุปผลการประเมินของนักเรียน
              </p>
            </div>
          ) : classroomStudents.length === 0 ? (
            <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border shadow-xs">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="font-bold text-foreground text-base">ไม่มีนักเรียนในห้องเรียนนี้</h4>
              <p className="text-xs text-muted-foreground mt-1">ยังไม่มีข้อมูลนักเรียนที่ถูกจัดเข้าชั้นเรียนนี้ในเทอมปัจจุบัน</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Classroom Overview & Stat Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="card-modern p-3.5 sm:p-4 border border-border/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase truncate">นักเรียนทั้งหมด</div>
                    <div className="text-lg sm:text-xl font-extrabold text-foreground">{classStats.total} <span className="text-xs font-normal text-muted-foreground">คน</span></div>
                  </div>
                </div>

                <div className="card-modern p-3.5 sm:p-4 border border-border/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase truncate">ประเมินครบถ้วน</div>
                    <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{classStats.completed} <span className="text-xs font-normal text-muted-foreground">คน ({classStats.percent}%)</span></div>
                  </div>
                </div>

                <div className="card-modern p-3.5 sm:p-4 border border-border/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase truncate">รอประเมิน / ไม่ครบ</div>
                    <div className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400">{classStats.pending} <span className="text-xs font-normal text-muted-foreground">คน</span></div>
                  </div>
                </div>

                <div className="card-modern p-3.5 sm:p-4 border border-border/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase truncate">เกณฑ์ที่ใช้</div>
                      <div className="text-sm font-extrabold text-foreground truncate">{totalTopicsCount} หัวข้อ</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode("topics")}
                    className="p-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer shrink-0"
                    title="ไปที่การตั้งค่าหัวข้อ"
                  >
                    ปรับหัวข้อ
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="card-modern p-3 sm:p-4 border border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ หรือรหัสนักเรียน..."
                    className="input-modern !py-1.5 !pl-9 !pr-8 text-xs sm:text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex p-0.5 bg-muted rounded-xl border border-border text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setFilterStatus("all")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        filterStatus === "all" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      ทั้งหมด ({classroomStudents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus("completed")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        filterStatus === "completed" ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      ครบถ้วน ({classStats.completed})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus("pending")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        filterStatus === "pending" ? "bg-card text-amber-600 dark:text-amber-400 shadow-2xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      ยังไม่ครบ ({classStats.pending})
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:inline-block">
                    แสดง {filteredStudents.length} คน
                  </span>
                </div>
              </div>

              {/* TABLE VIEW (Tablet & Desktop: md:block) */}
              <div className="hidden md:block card-modern overflow-hidden border border-border/80 shadow-sm">
                <div className="overflow-x-auto max-h-[660px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20 bg-card shadow-xs">
                      {/* Top Tier Headers */}
                      <tr>
                        <th
                          rowSpan={2}
                          className="border-b-2 border-r border-border text-center font-bold text-xs text-muted-foreground w-12 py-3 px-2 bg-muted"
                        >
                          #
                        </th>
                        <th
                          rowSpan={2}
                          className="border-b-2 border-r-2 border-border font-bold text-xs text-muted-foreground min-w-[210px] max-w-[250px] py-3 px-3 text-left bg-muted"
                        >
                          ชื่อ-สกุล / รหัสนักเรียน
                        </th>

                        {activeTopics.length > 0 && (
                          <th
                            colSpan={activeTopics.length}
                            className="bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold border-b border-r-2 border-border py-2 px-3 text-left text-xs tracking-wide"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                              <span className="truncate">คุณลักษณะอันพึงประสงค์ (แอดมินกำหนด · {activeTopics.length} หัวข้อ)</span>
                            </div>
                          </th>
                        )}

                        <th
                          colSpan={RWT_TOPICS.length}
                          className="bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold border-b border-r-2 border-border py-2 px-3 text-left text-xs tracking-wide"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">การอ่าน คิดวิเคราะห์ และเขียน (RTW · 3 ด้าน)</span>
                          </div>
                        </th>

                        <th
                          rowSpan={2}
                          className="border-b-2 border-border text-center font-bold text-xs text-muted-foreground min-w-[110px] py-3 px-3 bg-muted/95 backdrop-blur-md"
                        >
                          สถานะ
                        </th>
                      </tr>

                      {/* Second Tier Topic Headers */}
                      <tr className="bg-muted/70 text-muted-foreground text-xs">
                        {activeTopics.map((t, idx) => (
                          <th
                            key={t.id}
                            className={`bg-muted/90 px-2.5 py-2 text-center font-bold text-[11px] min-w-[110px] max-w-[140px] border-b-2 border-border truncate ${
                              idx === activeTopics.length - 1 ? "border-r-2 border-border" : "border-r border-border/50"
                            }`}
                            title={t.name_th}
                          >
                            <span className="block truncate">{t.name_th}</span>
                          </th>
                        ))}
                        {RWT_TOPICS.map((rt, idx) => (
                          <th
                            key={rt.key}
                            className={`bg-muted/90 px-2 py-2 text-center font-bold text-[11px] min-w-[140px] max-w-[170px] border-b-2 border-border ${
                              idx < RWT_TOPICS.length - 1 ? "border-r border-border/50" : "border-r-2 border-border"
                            }`}
                            title={`${rt.th} / ${rt.rumi} / ${rt.jawi}`}
                          >
                            <div className="flex flex-col items-center justify-center leading-tight">
                              <span className="font-extrabold text-foreground">{rt.th} / {rt.rumi}</span>
                              <span className="text-[10px] text-muted-foreground font-arabic" dir="rtl">{rt.jawi}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border/70">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={2 + activeTopics.length + RWT_TOPICS.length + 1} className="py-12 text-center text-muted-foreground text-sm">
                            ไม่พบนักเรียนตามเงื่อนไขการค้นหา
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s, idx) => {
                          const { done, total, isComplete } = getStudentProgress(s.student_id);
                          return (
                            <tr key={s.id} className="group hover:bg-muted/40 transition-colors">
                              {/* Column 1: Index */}
                              <td className="border-b border-r border-border/60 text-center text-xs font-semibold py-2.5 px-2 text-muted-foreground bg-card group-hover:bg-muted/70">
                                {idx + 1}
                              </td>

                              {/* Column 2: Name & ID */}
                              <td className="border-b border-r-2 border-border py-2.5 px-3 bg-card group-hover:bg-muted/70">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="font-bold text-foreground text-xs sm:text-sm truncate max-w-[150px]">
                                      {s.name}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{s.student_id}</span>
                                      {s.student_number !== null && (
                                        <span className="text-subtle-foreground">· เลขที่ {s.student_number}</span>
                                      )}
                                    </div>
                                  </div>
                                  <span
                                    className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                      isComplete
                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                                        : "bg-muted text-muted-foreground border-border"
                                    }`}
                                    title={`ประเมินแล้ว ${done} จาก ${total} หัวข้อ`}
                                  >
                                    {isComplete && <Check className="w-2.5 h-2.5" />}
                                    {done}/{total}
                                  </span>
                                </div>
                              </td>

                              {/* Character Topics */}
                              {activeTopics.map((t, tIdx) => (
                                <td
                                  key={t.id}
                                  className={`px-2 py-2.5 text-center border-b ${
                                    tIdx === activeTopics.length - 1
                                      ? "border-r-2 border-border bg-indigo-500/[0.015] dark:bg-indigo-500/[0.03]"
                                      : "border-r border-border/50"
                                  }`}
                                >
                                  <RatingBadge rating={findRating(s.student_id, "character", t.id)} />
                                </td>
                              ))}

                              {/* RWT Topics */}
                              {RWT_TOPICS.map((rt, rtIdx) => (
                                <td
                                  key={rt.key}
                                  className={`px-2 py-2.5 text-center border-b bg-emerald-500/[0.015] dark:bg-emerald-500/[0.03] ${
                                    rtIdx < RWT_TOPICS.length - 1 ? "border-r border-border/50" : "border-r border-border"
                                  }`}
                                >
                                  <RatingBadge rating={findRating(s.student_id, "rwt", rt.key)} />
                                </td>
                              ))}

                              {/* Status Column */}
                              <td className="bg-card group-hover:bg-muted/70 border-b border-border text-center py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                                    isComplete
                                      ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                                      : "bg-muted text-muted-foreground border-border"
                                  }`}
                                >
                                  {isComplete ? <Check className="w-3 h-3" /> : null}
                                  {done}/{total} หัวข้อ
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE CARDS VIEW (md:hidden) */}
              <div className="space-y-3.5 md:hidden">
                {filteredStudents.length === 0 ? (
                  <div className="card-modern p-8 text-center text-sm text-muted-foreground">
                    ไม่พบนักเรียนตามเงื่อนไขการค้นหา
                  </div>
                ) : (
                  filteredStudents.map((student, index) => {
                    const { done, total, isComplete } = getStudentProgress(student.student_id);
                    return (
                      <article key={student.id} className="card-modern p-4 space-y-3.5 border border-border/80 shadow-xs">
                        {/* Student Card Header */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-bold text-foreground text-sm truncate">{student.name}</h4>
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{student.student_id}</span>
                                {student.student_number !== null && (
                                  <span>· เลขที่ {student.student_number}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isComplete
                                ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {isComplete && <Check className="w-3 h-3" />}
                            {done}/{total} หัวข้อ
                          </span>
                        </div>

                        {/* Character Topics */}
                        {activeTopics.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/70">
                            <div className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              คุณลักษณะอันพึงประสงค์
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {activeTopics.map((topic) => (
                                <div
                                  key={topic.id}
                                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50 text-xs"
                                >
                                  <span className="text-muted-foreground truncate">{topic.name_th}</span>
                                  <RatingBadge rating={findRating(student.student_id, "character", topic.id)} size="sm" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* RWT Topics */}
                        <div className="space-y-2 pt-2 border-t border-border/70">
                          <div className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            การอ่าน คิดวิเคราะห์ และเขียน
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                            {RWT_TOPICS.map((topic) => (
                              <div
                                key={topic.key}
                                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50 text-xs"
                              >
                                <span className="text-muted-foreground truncate">{topic.th} / {topic.rumi} / {topic.jawi}</span>
                                <RatingBadge rating={findRating(student.student_id, "rwt", topic.key)} size="sm" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TOPIC MANAGEMENT (จัดการหัวข้อคุณลักษณะ) */}
      {viewMode === "topics" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Action Toolbar Banner */}
          <div className="card-modern p-4 sm:p-5 border border-border/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  จัดการหัวข้อเกณฑ์การประเมิน
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                กำหนดหัวข้อคุณลักษณะ ปรับลำดับ เปิด/ปิดใช้งาน หรือนำเข้าจากไฟล์ Excel/CSV
              </p>
            </div>

            {/* Template & Import Buttons */}
            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
              <button
                type="button"
                onClick={() => downloadTemplate("xlsx")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>แม่แบบ .xlsx</span>
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate("csv")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>แม่แบบ .csv</span>
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้าไฟล์</span>
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </div>

          {/* Add New Topic Form Card */}
          <div className="card-modern p-4 sm:p-5 lg:p-6 border border-border/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-foreground text-sm">เพิ่มหัวข้อคุณลักษณะใหม่</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-4 space-y-1">
                <label className="text-xs font-bold text-foreground">
                  ชื่อหัวข้อ (ภาษาไทย) <span className="text-rose-500">*</span>
                </label>
                <input
                  value={evalTopicForm.name_th}
                  onChange={(e) => setEvalTopicForm({ ...evalTopicForm, name_th: e.target.value })}
                  placeholder="เช่น ซื่อสัตย์สุจริต, มีวินัย..."
                  className="input-modern px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div className="lg:col-span-3 space-y-1">
                <label className="text-xs font-bold text-muted-foreground">
                  ชื่อภาษารูมี (Rumi - ไม่บังคับ)
                </label>
                <input
                  value={evalTopicForm.name_rumi}
                  onChange={(e) => setEvalTopicForm({ ...evalTopicForm, name_rumi: e.target.value })}
                  placeholder="เช่น Jujur, Berdisiplin..."
                  className="input-modern px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div className="lg:col-span-3 space-y-1">
                <label className="text-xs font-bold text-muted-foreground">
                  ชื่อภาษายาวี (Jawi - ไม่บังคับ)
                </label>
                <input
                  value={evalTopicForm.name_jawi}
                  onChange={(e) => setEvalTopicForm({ ...evalTopicForm, name_jawi: e.target.value })}
                  placeholder="เช่น جوجور, برديسيڤلين..."
                  className="input-modern px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div className="lg:col-span-2">
                <button
                  type="button"
                  onClick={onAddTopic}
                  disabled={!evalTopicForm.name_th.trim() || evalSavingTopic}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white disabled:opacity-50 cursor-pointer shadow-md hover:opacity-95 active:scale-98 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{evalSavingTopic ? "กำลังเพิ่ม..." : "เพิ่มหัวข้อ"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Topics Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Main Column: Admin Defined Topics */}
            <div className="lg:col-span-7 xl:col-span-8 card-modern overflow-hidden border border-border/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border/60 bg-indigo-500/[0.02] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                    <h4 className="font-bold text-foreground text-sm">
                      หัวข้อกำหนดโดยแอดมิน ({sortedTopics.length} หัวข้อ)
                    </h4>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">
                    เปิดใช้งาน {activeTopics.length} หัวข้อ
                  </span>
                </div>

                <div className="divide-y divide-border/70 max-h-[500px] overflow-y-auto">
                  {sortedTopics.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      ยังไม่มีหัวข้อคุณลักษณะที่กำหนดโดยแอดมิน กรุณาเพิ่มข้อมูลด้านบนหรือนำเข้าไฟล์
                    </div>
                  ) : (
                    sortedTopics.map((t, idx) => (
                      <div
                        key={t.id}
                        className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-muted/30 ${
                          !t.is_active ? "opacity-50 bg-muted/20" : ""
                        }`}
                      >
                        {editingTopicId === t.id ? (
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                value={editForm.name_th}
                                onChange={(e) => setEditForm({ ...editForm, name_th: e.target.value })}
                                placeholder="ชื่อไทย *"
                                className="input-modern px-3 py-1.5 text-xs sm:text-sm"
                              />
                              <input
                                value={editForm.name_rumi}
                                onChange={(e) => setEditForm({ ...editForm, name_rumi: e.target.value })}
                                placeholder="Rumi"
                                className="input-modern px-3 py-1.5 text-xs sm:text-sm"
                              />
                              <input
                                value={editForm.name_jawi}
                                onChange={(e) => setEditForm({ ...editForm, name_jawi: e.target.value })}
                                placeholder="Jawi"
                                className="input-modern px-3 py-1.5 text-xs sm:text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={saveEdit}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
                              >
                                บันทึก
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTopicId(null)}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-foreground text-sm flex items-center gap-2 flex-wrap">
                                  <span>{t.name_th}</span>
                                  {!t.is_active && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-muted text-muted-foreground rounded-md border border-border">
                                      ปิดใช้งาน
                                    </span>
                                  )}
                                </div>
                                {(t.name_rumi || t.name_jawi) && (
                                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                    {t.name_rumi && <span>{t.name_rumi}</span>}
                                    {t.name_rumi && t.name_jawi && <span>·</span>}
                                    {t.name_jawi && <span>{t.name_jawi}</span>}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions Group */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <div className="flex items-center gap-1 mr-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => onReorderTopic(idx, "up")}
                                  className="p-1 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-20 cursor-pointer"
                                  title="เลื่อนขึ้น"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === sortedTopics.length - 1}
                                  onClick={() => onReorderTopic(idx, "down")}
                                  className="p-1 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-20 cursor-pointer"
                                  title="เลื่อนลง"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => startEdit(t)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
                              >
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateTopic(t.id, { is_active: !t.is_active })}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
                              >
                                {t.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTopic(t.id)}
                                className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-500/30 cursor-pointer"
                                title="ลบหัวข้อ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-3 bg-muted/20 border-t border-border text-center text-xs text-muted-foreground">
                การแก้ไขลำดับหรือเปิด/ปิดใช้งานจะมีผลทันทีในตารางประเมินของคุณครู
              </div>
            </div>

            {/* Right/Side Column: System Fixed Topics (RWT) */}
            <div className="lg:col-span-5 xl:col-span-4 card-modern overflow-hidden border border-border/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border/60 bg-emerald-500/[0.03]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-foreground text-sm">
                      หัวข้อค่าเริ่มต้น (ระบบกำหนด / Fixed)
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    มาตรฐานการอ่าน คิดวิเคราะห์ และเขียนตามหลักสูตรแกนกลาง
                  </p>
                </div>

                <div className="divide-y divide-border/70">
                  {RWT_TOPICS.map((rt) => (
                    <div key={rt.key} className="p-4 flex items-center justify-between gap-3 bg-emerald-500/[0.005]">
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-sm">{rt.th} / {rt.rumi} / {rt.jawi}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {[rt.rumi, rt.jawi].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                        Fixed
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted/20 border-t border-border flex items-start gap-2.5 text-xs text-muted-foreground">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  หัวข้อในส่วนนี้คือเกณฑ์ประเมิน &ldquo;การอ่าน คิดวิเคราะห์ และเขียน&rdquo; ซึ่งเป็นหัวข้อมาตรฐานตายตัว ไม่สามารถลบหรือแก้ไขได้
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
