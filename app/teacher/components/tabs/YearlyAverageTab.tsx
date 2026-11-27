import { Users, TrendingUp, Loader2 } from "lucide-react";
import { type DBClassroom } from "../types";
import RankingLists, { type RankingRow } from "../RankingLists";

interface YearlyAverageTabProps {
  homeroomClass: DBClassroom | null;
  combinedAvailable: boolean;
  rankingsCombinedLoaded: boolean;
  rankingsCombinedData: RankingRow[];
}

export default function YearlyAverageTab({
  homeroomClass,
  combinedAvailable,
  rankingsCombinedLoaded,
  rankingsCombinedData,
}: YearlyAverageTabProps) {
  if (!homeroomClass) {
    return (
      <div className="ui-card p-12 text-center animate-fade-in-up">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">ยังไม่ได้รับมอบหมายห้องประจำชั้น</h3>
        <p className="text-sm text-muted-foreground">กรุณาติดต่อแอดมินเพื่อให้ผูกข้อมูลครูประจำชั้น</p>
      </div>
    );
  }

  const myClassroomId = homeroomClass.id;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-base">เฉลี่ยรวมทั้งปีการศึกษา</h3>
          <p className="text-xs text-muted-foreground">
            คำนวณจากคะแนนทั้ง 2 เทอมของปีการศึกษาปัจจุบันรวมกัน · ห้อง {homeroomClass.name}
          </p>
        </div>
      </div>

      {!combinedAvailable ? (
        <div className="ui-card p-12 text-center text-muted-foreground font-medium text-sm">
          ยังไม่มีคะแนนครบทั้ง 2 เทอมของปีการศึกษานี้
        </div>
      ) : !rankingsCombinedLoaded ? (
        <div className="ui-card p-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2.5" />
          <p className="text-sm text-muted-foreground font-medium">กำลังคำนวณเฉลี่ยรวม...</p>
        </div>
      ) : (
        <RankingLists
          myClassroomId={myClassroomId}
          homeroomClassName={homeroomClass.name}
          rankingsData={rankingsCombinedData}
          suffix=" · รวม 2 เทอม"
        />
      )}
    </div>
  );
}
