import { Award, Lock, CheckCircle2, BookOpenCheck } from "lucide-react";
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
    return (
      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border bg-muted text-subtle-foreground border-border shrink-0">
        ยังไม่ได้ประเมิน
      </span>
    );
  }
  const level = RATING_LEVELS.find((r) => r.value === rating);
  if (!level) return <span className="text-xs text-subtle-foreground">—</span>;
  return (
    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${RATING_BADGE_CLASSES[rating]}`}>
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
  const activeSetting = settingsList.find((s: any) => s.id === activeSettingId);
  const evaluationSettings = settingsList.filter((s: any) => String(s.term) === "2");
  const termOpen = isEvaluationTermOpen(activeSetting?.term);
  const activeTopics = [...evalTopics].filter((t) => t.is_active).sort((a, b) => a.sort_order - b.sort_order);

  const isManualReleased = activeSetting?.is_grade_released !== false;
  const releaseDateStr = activeSetting?.grade_release_date || null;

  let isGradeReleased = true;
  if (releaseDateStr && releaseDateStr.trim() !== "") {
    const targetTime = new Date(releaseDateStr).getTime();
    const now = new Date().getTime();
    isGradeReleased = now >= targetTime;
  } else {
    isGradeReleased = isManualReleased;
  }

  const findRating = (category: "character" | "rwt", topicKey: string) =>
    evalSummary.find((r) => r.category === category && r.topic_key === topicKey)?.rating;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-foreground text-base">ผลการประเมินคุณลักษณะ</h3>
          <p className="text-xs text-muted-foreground mt-0.5">เทอม {activeTermStr}</p>
        </div>
        <select
          aria-label="เลือกปีการศึกษา"
          className="ui-input !w-auto !py-2 !text-sm font-semibold text-foreground"
          value={activeSettingId || ""}
          onChange={(e) => {
            const s = settingsList.find((x: any) => String(x.id) === e.target.value);
            if (s) onChangeSetting(s);
          }}
        >
          {evaluationSettings.map((s) => (
            <option key={s.id} value={s.id}>
              ปีการศึกษา {s.academic_year}
            </option>
          ))}
        </select>
      </div>

      {!isGradeReleased ? (
        <div className="ui-card p-10 text-center space-y-3 bg-amber-500/5 border-amber-500/25">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">ผลการประเมินยังไม่เปิดเผยสำหรับนักเรียน</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            ผู้ดูแลระบบได้กำหนดช่วงเวลาเปิดประกาศผลการประเมินและเกรดไว้สำหรับเทอม {activeTermStr}
          </p>
        </div>
      ) : !termOpen ? (
        <div className="ui-card p-10 sm:p-14 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-foreground mb-1 text-base">ยังไม่เปิดให้ดูผลการประเมิน</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            ระบบเปิดให้ดูผลการประเมินคุณลักษณะเฉพาะภาคเรียนที่ 2 ของปีการศึกษานั้นๆ
          </p>
        </div>
      ) : evalLoading ? (
        <div className="ui-card p-14 text-center">
          <span className="inline-block h-7 w-7 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin mb-2" />
          <p className="text-muted-foreground text-sm font-medium">กำลังโหลดข้อมูลการประเมิน...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Character */}
          <div className="ui-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-foreground text-sm">คุณลักษณะอันพึงประสงค์</h4>
            </div>
            <div className="divide-y divide-border">
              {activeTopics.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">ยังไม่มีหัวข้อการประเมิน</div>
              ) : (
                activeTopics.map((t) => (
                  <div key={t.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">{t.name_th}</span>
                    <RatingBadge rating={findRating("character", t.id)} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reading, Analytical Thinking, Writing */}
          <div className="ui-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BookOpenCheck className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-foreground text-sm">การอ่าน คิดวิเคราะห์ และเขียน</h4>
            </div>
            <div className="divide-y divide-border">
              {RWT_TOPICS.map((rt) => (
                <div key={rt.key} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {rt.th} / {rt.rumi} / {rt.jawi}
                  </span>
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
