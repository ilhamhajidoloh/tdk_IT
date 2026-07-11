import { RWT_TOPICS, RATING_LEVELS, RATING_BADGE_CLASSES, isEvaluationTermOpen } from "../../../lib/evaluation";
import { type EvaluationTopic, type EvaluationSummaryRow } from "../types";

interface EvaluationTabProps {
  activeTermStr: string;
  settingsList: any[];
  activeSettingId: number | null;
  onChangeSetting: (setting: any) => void;
  evalTopics: EvaluationTopic[];
  evalSummary: EvaluationSummaryRow[];
  evalLoading: boolean;
}

function RatingBadge({ rating }: { rating: number | undefined }) {
  if (rating === undefined) {
    return <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold border bg-muted text-subtle-foreground border-border">ยังไม่ได้ประเมิน</span>;
  }
  const level = RATING_LEVELS.find(r => r.value === rating);
  if (!level) return <span className="text-xs text-subtle-foreground">—</span>;
  return (
    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${RATING_BADGE_CLASSES[rating]}`}>
      {level.th}
    </span>
  );
}

export default function EvaluationTab({
  activeTermStr,
  settingsList,
  activeSettingId,
  onChangeSetting,
  evalTopics,
  evalSummary,
  evalLoading,
}: EvaluationTabProps) {
  const activeSetting = settingsList.find(s => s.id === activeSettingId);
  const termOpen = isEvaluationTermOpen(activeSetting?.term);
  const activeTopics = [...evalTopics].filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order);

  const findRating = (category: "character" | "rwt", topicKey: string) =>
    evalSummary.find(r => r.category === category && r.topic_key === topicKey)?.rating;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-foreground">ผลการประเมินคุณลักษณะ</h3>
          <p className="text-xs text-muted-foreground mt-0.5">เทอม {activeTermStr}</p>
        </div>
        <select
          className="ui-input !w-auto py-2 text-sm font-semibold text-primary"
          value={activeSettingId || ""}
          onChange={(e) => {
            const val = e.target.value;
            const s = settingsList.find((x: any) => String(x.id) === val);
            if (s) onChangeSetting(s);
          }}
        >
          {settingsList.map(s => (
            <option key={s.id} value={s.id}>ปี {s.academic_year} เทอม {s.term}{s.is_active ? " · ปัจจุบัน" : ""}</option>
          ))}
        </select>
      </div>

      {!termOpen ? (
        <div className="ui-card p-14 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-soft rounded-2xl flex items-center justify-center" style={{ background: "var(--primary-soft)" }}>
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="font-bold text-foreground mb-1 text-base">ยังไม่เปิดให้ดูผลการประเมิน</h3>
          <p className="text-sm text-muted-foreground">ระบบเปิดให้ดูผลการประเมินคุณลักษณะเฉพาะภาคเรียนที่ 2 ของปีการศึกษานั้นๆ</p>
        </div>
      ) : evalLoading ? (
        <div className="ui-card p-14 text-center text-muted-foreground text-sm">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="space-y-5">
          <div className="ui-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <h4 className="font-bold text-foreground text-sm">คุณลักษณะอันพึงประสงค์</h4>
            </div>
            <div className="divide-y divide-border">
              {activeTopics.length === 0 ? (
                <div className="p-5 text-center text-sm text-muted-foreground">ยังไม่มีหัวข้อการประเมิน</div>
              ) : (
                activeTopics.map(t => (
                  <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">{t.name_th}</span>
                    <RatingBadge rating={findRating("character", t.id)} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="ui-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <h4 className="font-bold text-foreground text-sm">การอ่าน คิดวิเคราะห์ และเขียน</h4>
            </div>
            <div className="divide-y divide-border">
              {RWT_TOPICS.map(rt => (
                <div key={rt.key} className="p-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{rt.th}</span>
                  <RatingBadge rating={findRating("rwt", rt.key)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
