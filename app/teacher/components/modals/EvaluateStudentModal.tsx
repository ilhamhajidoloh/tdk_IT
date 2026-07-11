import { type DBStudent, type EvaluationTopic } from "../types";
import { RWT_TOPICS, RATING_LEVELS } from "../../../lib/evaluation";

interface EvaluateStudentModalProps {
  isOpen: boolean;
  student: DBStudent | null;
  characterTopics: EvaluationTopic[];
  ratings: Record<string, number>;
  onSetRating: (key: string, value: number) => void;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EvaluateStudentModal({
  isOpen,
  student,
  characterTopics,
  ratings,
  onSetRating,
  saving,
  onClose,
  onSave,
}: EvaluateStudentModalProps) {
  if (!isOpen || !student) return null;

  const renderRow = (key: string, label: string) => (
    <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-border/60 last:border-b-0">
      <div className="flex-1 text-sm font-semibold text-foreground">{label}</div>
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        {RATING_LEVELS.map(level => (
          <button
            key={level.value}
            type="button"
            onClick={() => onSetRating(key, level.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              ratings[key] === level.value
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-indigo-300"
            }`}
          >
            {level.th}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] my-auto flex flex-col border border-border animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-card">
          <div>
            <h3 className="text-lg font-extrabold text-foreground">ประเมินคุณลักษณะ</h3>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">{student.name} · {student.student_id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted rounded-full transition-all cursor-pointer border-0 bg-transparent"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">คุณลักษณะอันพึงประสงค์</div>
            {characterTopics.length === 0 ? (
              <div className="text-xs text-subtle-foreground py-3">ยังไม่มีหัวข้อ (แอดมินยังไม่ได้เพิ่ม)</div>
            ) : (
              characterTopics.map(t => renderRow(`character:${t.id}`, t.name_th))
            )}
          </div>

          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">การอ่าน คิดวิเคราะห์ และเขียน</div>
            {RWT_TOPICS.map(rt => renderRow(`rwt:${rt.key}`, rt.th))}
          </div>
        </div>

        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-card border-t border-border flex items-center justify-end gap-2.5 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-foreground bg-muted hover:bg-border transition-all cursor-pointer border-0"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md text-sm cursor-pointer border-0 disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
