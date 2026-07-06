import { type DBStudent } from "../types";

interface AssignStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClassroom: { id: string; name: string } | null;
  students: DBStudent[];
  searchAssignStudent: string;
  setSearchAssignStudent: (query: string) => void;
  selectedStudentsForAssign: string[];
  setSelectedStudentsForAssign: React.Dispatch<React.SetStateAction<string[]>>;
  handleEditStudent: (student: DBStudent) => void;
  handleRemoveStudentFromClass: (student: DBStudent) => void;
  onSave: () => void;
}

export default function AssignStudentsModal({
  isOpen,
  onClose,
  targetClassroom,
  students,
  searchAssignStudent,
  setSearchAssignStudent,
  selectedStudentsForAssign,
  setSelectedStudentsForAssign,
  handleEditStudent,
  handleRemoveStudentFromClass,
  onSave,
}: AssignStudentsModalProps) {
  if (!isOpen || !targetClassroom) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] my-auto flex flex-col border border-border animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-card">
          <div>
            <h3 className="text-xl font-extrabold text-foreground">เพิ่มนักเรียนเข้าชั้นเรียน</h3>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              ชั้น {targetClassroom.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหานักเรียนด้วยชื่อ หรือรหัส..."
              value={searchAssignStudent}
              onChange={(e) => setSearchAssignStudent(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-sm font-semibold focus:ring-2 focus:ring-indigo-400 outline-none"
            />
            <svg
              className="w-5 h-5 text-muted-foreground absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex flex-col gap-6">
            {/* นักเรียนในชั้นเรียนนี้ */}
            <div>
              {(() => {
                const assigned = students.filter(
                  (s) =>
                    s.classroom_id === targetClassroom.id &&
                    (s.name.includes(searchAssignStudent) || s.student_id.includes(searchAssignStudent))
                );
                return (
                  <>
                    <h4 className="text-sm font-bold text-foreground mb-3">
                      นักเรียนในชั้นเรียนนี้ ({assigned.length} คน)
                    </h4>
                    <div className="border border-border rounded-xl max-h-60 overflow-y-auto bg-card shadow-sm">
                      {assigned.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-sm font-semibold">
                          ยังไม่มีนักเรียนในชั้นเรียนนี้
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {assigned.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between p-3 hover:bg-muted transition-colors"
                            >
                              <div>
                                <div className="font-bold text-foreground">{s.name}</div>
                                <div className="text-xs font-semibold text-muted-foreground">
                                  รหัส: {s.student_id}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditStudent(s)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 text-xs font-bold px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors"
                                >
                                  แก้ไข
                                </button>
                                <button
                                  onClick={() => handleRemoveStudentFromClass(s)}
                                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:text-amber-300 text-xs font-bold px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:bg-amber-500/15 rounded-lg transition-colors"
                                >
                                  นำออก
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* นักเรียนที่ยังไม่มีชั้นเรียน */}
            <div>
              {(() => {
                const unassigned = students.filter(
                  (s) =>
                    !s.classroom_id &&
                    (s.name.includes(searchAssignStudent) || s.student_id.includes(searchAssignStudent))
                );
                return (
                  <>
                    <h4 className="text-sm font-bold text-foreground mb-3">
                      เพิ่มนักเรียนที่ยังไม่มีชั้นเรียน ({unassigned.length} คน)
                    </h4>
                    <div className="border border-border rounded-xl max-h-60 overflow-y-auto bg-muted/30">
                      {unassigned.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-sm font-semibold">
                          ไม่พบนักเรียนที่ยังไม่มีห้อง
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {unassigned.map((s) => (
                            <label
                              key={s.id}
                              className="flex items-center gap-3 p-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/20 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudentsForAssign.includes(s.id)}
                                onChange={(e) => {
                                  if (e.target.checked)
                                    setSelectedStudentsForAssign((prev) => [...prev, s.id]);
                                  else
                                    setSelectedStudentsForAssign((prev) =>
                                      prev.filter((id) => id !== s.id)
                                    );
                                }}
                                className="w-5 h-5 text-indigo-600 dark:text-indigo-400 rounded border-border focus:ring-indigo-500"
                              />
                              <div>
                                <div className="font-bold text-foreground">{s.name}</div>
                                <div className="text-xs font-semibold text-muted-foreground">
                                  รหัส: {s.student_id}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-border bg-muted/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-foreground bg-card border border-border hover:bg-muted transition-colors shadow-sm cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={onSave}
            disabled={selectedStudentsForAssign.length === 0}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors shadow-md cursor-pointer flex items-center gap-2"
          >
            บันทึก ({selectedStudentsForAssign.length})
          </button>
        </div>
      </div>
    </div>
  );
}
