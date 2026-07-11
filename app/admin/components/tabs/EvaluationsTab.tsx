import { useState } from "react";
import { type SystemSetting, type DBStudent, type EvaluationTopic, type EvaluationSummaryRow } from "../types";
import { RWT_TOPICS, RATING_LEVELS, RATING_BADGE_CLASSES, isEvaluationTermOpen } from "../../../lib/evaluation";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";

interface EvaluationsTabProps {
  settingsList: SystemSetting[];
  evalSettingId: number | null;
  handleSelectEvalSetting: (id: number) => void;
  evalLoading: boolean;
  evalTopics: EvaluationTopic[];
  evalStudents: DBStudent[];
  evalClassrooms: { id: string; name: string }[];
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
}

function RatingBadge({ rating }: { rating: number | undefined }) {
  if (rating === undefined) {
    return <span className="text-xs text-subtle-foreground">—</span>;
  }
  const level = RATING_LEVELS.find(r => r.value === rating);
  if (!level) return <span className="text-xs text-subtle-foreground">—</span>;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold border ${RATING_BADGE_CLASSES[rating]}`}>
      {level.th}
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
}: EvaluationsTabProps) {
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name_th: "", name_rumi: "", name_jawi: "" });

  const sortedTopics = [...evalTopics].sort((a, b) => a.sort_order - b.sort_order);
  const activeTopics = sortedTopics.filter(t => t.is_active);

  const selectedSetting = settingsList.find(s => s.id === evalSettingId);
  const termOpen = isEvaluationTermOpen(selectedSetting?.term);

  const classroomStudents = evalStudents
    .filter(s => s.classroom_id === evalClassroomId)
    .sort((a, b) => (a.student_number ?? 9999) - (b.student_number ?? 9999) || a.name.localeCompare(b.name, "th"));

  const findRating = (studentId: string, category: "character" | "rwt", topicKey: string) =>
    evalSummary.find(r => r.student_id === studentId && r.category === category && r.topic_key === topicKey)?.rating;

  const startEdit = (t: EvaluationTopic) => {
    setEditingTopicId(t.id);
    setEditForm({ name_th: t.name_th, name_rumi: t.name_rumi || "", name_jawi: t.name_jawi || "" });
  };

  const saveEdit = () => {
    if (!editingTopicId) return;
    onUpdateTopic(editingTopicId, editForm);
    setEditingTopicId(null);
  };

  return (
    <div className="p-8 animate-fade-in-up">
      <SectionHeader
        icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        color="purple"
        title="ประเมินคุณลักษณะอันพึงประสงค์"
        subtitle="จัดการหัวข้อคุณลักษณะฯ และดูผลรวมการประเมิน (เปิดใช้งานเฉพาะภาคเรียนที่ 2)"
      />

      {/* Topic Manager Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Admin-Defined Topics */}
        <div className="lg:col-span-2 card-modern overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-border/60 bg-indigo-500/[0.01]">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                หัวข้อคุณลักษณะอันพึงประสงค์ (กำหนดโดยแอดมิน)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">หัวข้อที่คุณสามารถเพิ่ม แก้ไข ปรับลำดับ ปิดใช้งาน หรือลบได้ตามต้องการ</p>
            </div>
            <div className="divide-y divide-border max-h-[350px] overflow-y-auto">
              {sortedTopics.length === 0 ? (
                <div className="p-6 text-center text-subtle-foreground text-sm">ยังไม่มีหัวข้อ กรุณาเพิ่มด้านล่าง</div>
              ) : (
                sortedTopics.map((t, idx) => (
                  <div key={t.id} className={`p-4 flex items-start gap-3 transition-opacity ${!t.is_active ? "opacity-40" : ""}`}>
                    {editingTopicId === t.id ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          value={editForm.name_th}
                          onChange={e => setEditForm({ ...editForm, name_th: e.target.value })}
                          placeholder="ชื่อไทย"
                          className="input-modern px-3 py-2 text-sm"
                        />
                        <input
                          value={editForm.name_rumi}
                          onChange={e => setEditForm({ ...editForm, name_rumi: e.target.value })}
                          placeholder="Rumi (ไม่บังคับ)"
                          className="input-modern px-3 py-2 text-sm"
                        />
                        <input
                          value={editForm.name_jawi}
                          onChange={e => setEditForm({ ...editForm, name_jawi: e.target.value })}
                          placeholder="Jawi (ไม่บังคับ)"
                          className="input-modern px-3 py-2 text-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          {t.name_th}
                          {!t.is_active && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded-md">ปิดใช้งาน</span>
                          )}
                        </div>
                        {(t.name_rumi || t.name_jawi) && (
                          <div className="text-xs text-subtle-foreground mt-0.5">{[t.name_rumi, t.name_jawi].filter(Boolean).join(" · ")}</div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                      {editingTopicId === t.id ? (
                        <>
                          <button onClick={saveEdit} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer border-0 shadow-sm transition-colors">บันทึก</button>
                          <button onClick={() => setEditingTopicId(null)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-muted hover:bg-muted/85 text-foreground cursor-pointer border-0 transition-colors">ยกเลิก</button>
                        </>
                      ) : (
                        <>
                          <button disabled={idx === 0} onClick={() => onReorderTopic(idx, "up")} className="px-2 py-1 text-xs font-bold rounded-lg bg-card border border-border hover:bg-muted disabled:opacity-30 cursor-pointer">⬆️</button>
                          <button disabled={idx === sortedTopics.length - 1} onClick={() => onReorderTopic(idx, "down")} className="px-2 py-1 text-xs font-bold rounded-lg bg-card border border-border hover:bg-muted disabled:opacity-30 cursor-pointer">⬇️</button>
                          <button onClick={() => startEdit(t)} className="px-2.5 py-1 text-xs font-bold rounded-lg bg-card border border-border hover:bg-muted cursor-pointer">แก้ไข</button>
                          <button onClick={() => onUpdateTopic(t.id, { is_active: !t.is_active })} className="px-2.5 py-1 text-xs font-bold rounded-lg bg-card border border-border hover:bg-muted cursor-pointer">
                            {t.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                          </button>
                          <button onClick={() => onDeleteTopic(t.id)} className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 cursor-pointer">ลบ</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 bg-muted/40 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={evalTopicForm.name_th}
              onChange={e => setEvalTopicForm({ ...evalTopicForm, name_th: e.target.value })}
              placeholder="ชื่อหัวข้อ (ไทย) *"
              className="input-modern px-3 py-2 text-sm sm:col-span-1"
            />
            <input
              value={evalTopicForm.name_rumi}
              onChange={e => setEvalTopicForm({ ...evalTopicForm, name_rumi: e.target.value })}
              placeholder="Rumi (ไม่บังคับ)"
              className="input-modern px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                value={evalTopicForm.name_jawi}
                onChange={e => setEvalTopicForm({ ...evalTopicForm, name_jawi: e.target.value })}
                placeholder="Jawi (ไม่บังคับ)"
                className="input-modern px-3 py-2 text-sm flex-1"
              />
              <button
                onClick={onAddTopic}
                disabled={!evalTopicForm.name_th.trim() || evalSavingTopic}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white disabled:opacity-50 cursor-pointer border-0 shrink-0 shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                เพิ่มหัวข้อ
              </button>
            </div>
          </div>
        </div>

        {/* Right: System Fixed Topics (Read-Only) */}
        <div className="card-modern overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-border/60 bg-emerald-500/[0.02]">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                หัวข้อค่าเริ่มต้น (ระบบกำหนด / Fixed)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">หัวข้อพื้นฐานที่เป็นมาตรฐานของระบบ ไม่สามารถแก้ไขหรือลบได้</p>
            </div>
            <div className="divide-y divide-border">
              {RWT_TOPICS.map((rt) => (
                <div key={rt.key} className="p-4 flex items-center justify-between gap-3 bg-emerald-500/[0.005]">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground text-sm">{rt.th}</div>
                    <div className="text-xs text-subtle-foreground mt-0.5">
                      {[rt.rumi, rt.jawi].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    Fixed
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-muted/20 border-t border-border text-center text-xs text-muted-foreground">
            การประเมินส่วนนี้คือ &ldquo;การอ่าน คิดวิเคราะห์ และเขียน&rdquo;
          </div>
        </div>
      </div>

      {/* Term / classroom results */}
      <TermSelector settingsList={settingsList} selectedId={evalSettingId} onSelect={handleSelectEvalSetting} />

      {!evalSettingId ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : !termOpen ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          ระบบเปิดให้ดูผลการประเมินเฉพาะภาคเรียนที่ 2 ของปีการศึกษานั้นๆ
        </div>
      ) : evalLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground font-semibold text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-subtle-foreground uppercase tracking-wider">ห้องเรียน:</span>
            {evalClassrooms.length === 0 ? (
              <span className="text-xs text-subtle-foreground">ไม่มีห้องเรียนในเทอมนี้</span>
            ) : (
              evalClassrooms.map(c => (
                <button
                  key={c.id}
                  onClick={() => setEvalClassroomId(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    evalClassroomId === c.id
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                      : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                  }`}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>

          {!evalClassroomId ? (
            <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
              กรุณาเลือกห้องเรียนก่อน
            </div>
          ) : classroomStudents.length === 0 ? (
            <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
              ไม่มีนักเรียนในห้องนี้
            </div>
          ) : (
            <div className="card-modern overflow-hidden">
              <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted text-muted-foreground text-xs sticky top-0 z-10 border-b border-border/80">
                    <tr>
                      <th rowSpan={2} className="px-3 py-3 text-center font-bold w-10 border-r border-border/60">#</th>
                      <th rowSpan={2} className="px-3 py-3 font-bold min-w-[160px] border-r border-border/60 text-left">ชื่อ-สกุล</th>
                      {activeTopics.length > 0 && (
                        <th colSpan={activeTopics.length} className="px-3 py-1.5 text-center font-bold bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-r-2 border-border">
                          คุณลักษณะอันพึงประสงค์ (แอดมินกำหนด)
                        </th>
                      )}
                      <th colSpan={RWT_TOPICS.length} className="px-3 py-1.5 text-center font-bold bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        การอ่าน คิดวิเคราะห์ และเขียน (ค่าเริ่มต้น)
                      </th>
                    </tr>
                    <tr className="bg-muted/50 border-t border-border/40">
                      {activeTopics.map((t, idx) => (
                        <th 
                          key={t.id} 
                          className={`px-3 py-2 text-center font-semibold min-w-[110px] text-[11px] ${
                            idx === activeTopics.length - 1 ? "border-r-2 border-border" : "border-r border-border/40"
                          }`}
                        >
                          {t.name_th}
                        </th>
                      ))}
                      {RWT_TOPICS.map((rt, idx) => (
                        <th 
                          key={rt.key} 
                          className={`px-3 py-2 text-center font-semibold min-w-[110px] text-[11px] ${
                            idx < RWT_TOPICS.length - 1 ? "border-r border-border/40" : ""
                          }`}
                        >
                          {rt.th}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classroomStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-muted transition-colors">
                        <td className="px-3 py-2.5 text-center text-muted-foreground text-xs border-r border-border/40">{idx + 1}</td>
                        <td className="px-3 py-2.5 border-r border-border/60">
                          <div className="font-semibold text-foreground text-xs">{s.name}</div>
                          <div className="text-[10px] text-subtle-foreground">{s.student_id}</div>
                        </td>
                        {activeTopics.map((t, tIdx) => (
                          <td 
                            key={t.id} 
                            className={`px-3 py-2.5 text-center ${
                              tIdx === activeTopics.length - 1 ? "border-r-2 border-border bg-indigo-500/[0.01] dark:bg-indigo-500/[0.02]" : "border-r border-border/40"
                            }`}
                          >
                            <RatingBadge rating={findRating(s.student_id, "character", t.id)} />
                          </td>
                        ))}
                        {RWT_TOPICS.map((rt, rtIdx) => (
                          <td 
                            key={rt.key} 
                            className={`px-3 py-2.5 text-center bg-emerald-500/[0.01] dark:bg-emerald-500/[0.02] ${
                              rtIdx < RWT_TOPICS.length - 1 ? "border-r border-border/40" : ""
                            }`}
                          >
                            <RatingBadge rating={findRating(s.student_id, "rwt", rt.key)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
