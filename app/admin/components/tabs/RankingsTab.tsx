import { type SystemSetting, type RankingRow } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import RankingGrid from "../RankingGrid";

interface RankingsTabProps {
  settingsList: SystemSetting[];
  rankingsSettingId: number | null;
  handleSelectRankingsSetting: (id: number) => void;
  rankingsLoading: boolean;
  rankingsData: RankingRow[];
  rankingsClassroomFilter: string;
  setRankingsClassroomFilter: (filter: string) => void;
  token: string | null;
  loadRankings: (settingId: number, token: string) => void;
}

export default function RankingsTab({
  settingsList,
  rankingsSettingId,
  handleSelectRankingsSetting,
  rankingsLoading,
  rankingsData,
  rankingsClassroomFilter,
  setRankingsClassroomFilter,
  token,
  loadRankings,
}: RankingsTabProps) {
  return (
    <div className="p-8 animate-fade-in-up">
      <SectionHeader
        icon="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        color="purple"
        title="อันดับผลการเรียน"
        subtitle="จัดอันดับนักเรียนจากคะแนนรวม ทั้งภายในห้องเรียนและทั้งโรงเรียน"
      >
        <button
          onClick={() => {
            if (rankingsSettingId && token) loadRankings(rankingsSettingId, token);
          }}
          disabled={!rankingsSettingId}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-muted disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          รีเฟรชข้อมูล
        </button>
      </SectionHeader>

      <TermSelector
        settingsList={settingsList}
        selectedId={rankingsSettingId}
        onSelect={handleSelectRankingsSetting}
      />

      {!rankingsSettingId ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : rankingsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground font-semibold text-sm">กำลังคำนวณอันดับ...</p>
        </div>
      ) : rankingsData.length === 0 ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          ไม่มีข้อมูลนักเรียนในเทอมนี้
        </div>
      ) : (
        (() => {
          const classroomList = Array.from(new Set(rankingsData.map((r) => r.classroom_name))).sort();
          const filtered =
            rankingsClassroomFilter === "all"
              ? rankingsData
              : rankingsData.filter((r) => r.classroom_name === rankingsClassroomFilter);
          const classroomSorted = [...filtered].sort(
            (a, b) => a.classroom_rank - b.classroom_rank || b.percentage - a.percentage
          );
          const schoolSorted = [...filtered].sort(
            (a, b) => a.school_rank - b.school_rank || b.percentage - a.percentage
          );

          return (
            <div>
              {/* Classroom Filter */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-subtle-foreground uppercase tracking-wider">
                  กรองห้องเรียน:
                </span>
                <button
                  onClick={() => setRankingsClassroomFilter("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    rankingsClassroomFilter === "all"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                      : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                  }`}
                >
                  ทั้งหมด
                </button>
                {classroomList.map((cn) => (
                  <button
                    key={cn}
                    onClick={() => setRankingsClassroomFilter(cn)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      rankingsClassroomFilter === cn
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                        : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                    }`}
                  >
                    {cn}
                  </button>
                ))}
              </div>

              <RankingGrid
                classroomSorted={classroomSorted}
                schoolSorted={schoolSorted}
                classroomCount={filtered.length}
                schoolCount={rankingsData.length}
              />
            </div>
          );
        })()
      )}
    </div>
  );
}
