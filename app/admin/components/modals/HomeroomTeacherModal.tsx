import { useMemo, useState } from "react";
import ModalPortal from "@/app/components/ModalPortal";
import type { DBClassroom, DBUser } from "../types";

interface Props {
  isOpen: boolean;
  classroom: DBClassroom | null;
  /** ชั้นเรียนทั้งหมดในเทอมเดียวกัน ใช้ตรวจว่าครูคนไหนประจำชั้นห้องอื่นอยู่แล้ว */
  classrooms: DBClassroom[];
  teachers: DBUser[];
  onClose: () => void;
  onSave: (teacherIds: string[]) => void;
}

export default function HomeroomTeacherModal({ isOpen, classroom, classrooms, teachers, onClose, onSave }: Props) {
  // ผู้เรียกใช้ใส่ key ตาม classroom.id เพื่อให้ state เริ่มใหม่ทุกครั้งที่เปิดกับชั้นเรียนอื่น
  const [selectedIds, setSelectedIds] = useState<string[]>(classroom?.homeroom_teacher_ids || []);
  const [search, setSearch] = useState("");

  // ครู 1 คนประจำชั้นได้ 1 ห้องต่อเทอม: เก็บว่าครูแต่ละคนประจำห้องอื่นห้องไหนอยู่
  const assignedElsewhere = useMemo(() => {
    const map = new Map<string, string>();
    classrooms.forEach(c => {
      if (c.id === classroom?.id) return;
      c.homeroom_teacher_ids?.forEach(tid => map.set(tid, c.name));
    });
    return map;
  }, [classrooms, classroom?.id]);

  if (!isOpen || !classroom) return null;

  const keyword = search.trim().toLowerCase();
  const activeTeachers = teachers
    .filter(t => t.role === "teacher" && t.status !== "resigned")
    .filter(t => !keyword || t.username.toLowerCase().includes(keyword))
    .sort((a, b) => a.username.localeCompare(b.username, "th"));

  const toggle = (id: string) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="homeroom-teacher-modal-title"
          className="flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl border border-border bg-card shadow-2xl"
          onClick={event => event.stopPropagation()}
        >
          <div className="border-b border-border px-6 py-5">
            <h3 id="homeroom-teacher-modal-title" className="text-lg font-extrabold text-foreground">กำหนดครูประจำชั้น</h3>
            <p className="mt-1 text-sm text-muted-foreground">ชั้นเรียน: <span className="font-bold text-foreground">{classroom.name}</span></p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ครูประจำชั้น (เลือกได้หลายคน)</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">เลือกแล้ว {selectedIds.length} คน</span>
            </div>
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="ค้นหาชื่อครู..."
              aria-label="ค้นหาชื่อครู"
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
              {activeTeachers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">ไม่พบครู</p>
              ) : activeTeachers.map(teacher => {
                const otherRoom = assignedElsewhere.get(teacher.id);
                const checked = selectedIds.includes(teacher.id);
                return (
                  <label
                    key={teacher.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${otherRoom ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/60"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!!otherRoom}
                      onChange={() => toggle(teacher.id)}
                      className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex-1 font-semibold text-foreground">{teacher.username}</span>
                    {otherRoom && <span className="text-xs text-muted-foreground">ประจำชั้น {otherRoom}</span>}
                  </label>
                );
              })}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">1 ชั้นเรียนมีครูประจำชั้นได้หลายคน แต่ครู 1 คนประจำชั้นได้เพียง 1 ห้องในเทอม/ปีการศึกษาเดียวกัน การกำหนดนี้ใช้เฉพาะเทอมที่เลือก</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-xl bg-muted px-4 py-2.5 text-sm font-bold text-foreground hover:bg-border">ยกเลิก</button>
            <button type="button" onClick={() => onSave(selectedIds)} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md">บันทึก</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
