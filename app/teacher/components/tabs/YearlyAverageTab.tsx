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
      <div className="space-y-5">
        <div className="card-modern p-12 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-100 dark:to-indigo-500/10 flex items-center justify-center shadow-lg shadow-indigo-100/30">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">ยังไม่ได้รับมอบหมายห้องประจำชั้น</h3>
          <p className="text-sm text-muted-foreground">กรุณาติดต่อแอดมินเพื่อให้ผูกข้อมูลครูประจำชั้น</p>
        </div>
      </div>
    );
  }

  const myClassroomId = homeroomClass.id;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-purple-500 to-fuchsia-500" />
        <div>
          <h3 className="font-bold text-foreground text-base">เฉลี่ยรวมทั้งปีการศึกษา</h3>
          <p className="text-xs text-muted-foreground">คำนวณจากคะแนนทั้ง 2 เทอมของปีการศึกษาปัจจุบันรวมกัน · ห้อง {homeroomClass.name}</p>
        </div>
      </div>

      {!combinedAvailable ? (
        <div className="card-modern p-12 text-center text-subtle-foreground font-semibold">
          ยังไม่มีคะแนนครบทั้ง 2 เทอมของปีการศึกษานี้
        </div>
      ) : !rankingsCombinedLoaded ? (
        <div className="card-modern p-8 text-center">
          <div className="inline-block w-10 h-10 border-4 border-purple-200 dark:border-purple-500/30 border-t-purple-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted-foreground font-semibold">กำลังคำนวณเฉลี่ยรวม...</p>
        </div>
      ) : (
        <RankingLists myClassroomId={myClassroomId} homeroomClassName={homeroomClass.name} rankingsData={rankingsCombinedData} suffix=" · รวม 2 เทอม" />
      )}
    </div>
  );
}
