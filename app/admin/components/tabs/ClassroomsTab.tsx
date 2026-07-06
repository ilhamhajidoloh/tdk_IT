import { type SystemSetting } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";

interface ClassroomsTabProps {
  settingsList: SystemSetting[];
  selectedSettingId: number | null;
  setSelectedSettingId: (id: number) => void;
  setSelectedClassroomIds: React.Dispatch<React.SetStateAction<string[]>>;
  loadClassrooms: (settingId: number, token: string) => void;
  token: string | null;
  classrooms: { id: string; name: string }[];
  selectedClassroomIds: string[];
  classroomFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImportClassrooms: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadClassroomTemplate: () => void;
  handleOpenExportScoreModal: (classroomId?: string) => void;
  handleOpenCopyModal: () => void;
  handleBulkDeleteClassrooms: () => void;
  handleAddClassroom: () => void;
  handleOpenAssignModal: (classroom: { id: string; name: string }) => void;
  handleEditClassroom: (classroom: { id: string; name: string }) => void;
  handleDeleteClassroom: (id: string, name: string) => void;
}

export default function ClassroomsTab({
  settingsList,
  selectedSettingId,
  setSelectedSettingId,
  setSelectedClassroomIds,
  loadClassrooms,
  token,
  classrooms,
  selectedClassroomIds,
  classroomFileInputRef,
  handleImportClassrooms,
  handleDownloadClassroomTemplate,
  handleOpenExportScoreModal,
  handleOpenCopyModal,
  handleBulkDeleteClassrooms,
  handleAddClassroom,
  handleOpenAssignModal,
  handleEditClassroom,
  handleDeleteClassroom,
}: ClassroomsTabProps) {
  return (
    <div className="p-8">
      <SectionHeader
        icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16M9 7h1m4 0h1m-6 4h1m4 0h1m-5 9v-4a1 1 0 011-1h1a1 1 0 011 1v4"
        color="purple"
        title="จัดการชั้นเรียน"
        subtitle="ชั้นเรียนแต่ละห้องผูกกับปีการศึกษา / เทอม"
        count={classrooms.length}
        countLabel="ห้อง"
      >
        <input
          type="file"
          ref={classroomFileInputRef}
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={handleImportClassrooms}
        />
        <button
          onClick={handleDownloadClassroomTemplate}
          className="bg-card border border-border text-muted-foreground hover:bg-muted px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          โหลดเทมเพลต
        </button>
        <button
          onClick={() => classroomFileInputRef.current?.click()}
          className="bg-card border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          นำเข้า (Excel)
        </button>
        <button
          onClick={() => handleOpenExportScoreModal()}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          ส่งออกคะแนนชั้นเรียน
        </button>
        <button
          onClick={handleOpenCopyModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
            />
          </svg>
          คัดลอกชั้นเรียน
        </button>
        {selectedClassroomIds.length > 0 && (
          <button
            onClick={handleBulkDeleteClassrooms}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            ลบที่เลือก ({selectedClassroomIds.length})
          </button>
        )}
        <button
          onClick={handleAddClassroom}
          disabled={!selectedSettingId}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-muted disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มชั้นเรียนใหม่
        </button>
      </SectionHeader>

      {/* Term Selector */}
      <TermSelector
        settingsList={settingsList}
        selectedId={selectedSettingId}
        onSelect={(id) => {
          setSelectedSettingId(id);
          setSelectedClassroomIds([]);
          if (token) loadClassrooms(id, token);
        }}
      />

      {/* Classroom Grid */}
      {!selectedSettingId ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
          ยังไม่มีชั้นเรียนในเทอมนี้ กด &quot;เพิ่มชั้นเรียนใหม่&quot; เพื่อเริ่ม
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
          {classrooms.map((c) => (
            <div
              key={c.id}
              className={`bg-gradient-to-br p-5 rounded-2xl border flex flex-col justify-between hover:shadow-md transition-all relative ${
                selectedClassroomIds.includes(c.id)
                  ? "from-red-50/40 dark:from-red-500/10 to-orange-50/40 dark:to-orange-500/10 border-red-200 dark:border-red-500/30"
                  : "from-indigo-50/40 dark:from-indigo-500/10 to-blue-50/40 dark:to-blue-500/10 border-indigo-100 dark:border-indigo-500/25"
              }`}
            >
              <div className="absolute top-4 right-4">
                <input
                  type="checkbox"
                  checked={selectedClassroomIds.includes(c.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClassroomIds((prev) => [...prev, c.id]);
                    } else {
                      setSelectedClassroomIds((prev) => prev.filter((id) => id !== c.id));
                    }
                  }}
                  className="w-5 h-5 rounded border-border text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <div className="pr-8">
                <div className="font-extrabold text-lg text-indigo-700 dark:text-indigo-300">{c.name}</div>
                <div className="text-muted-foreground text-xs mt-1 font-semibold truncate">ID: {c.id}</div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-indigo-100/30 dark:border-indigo-500/25 flex-wrap">
                <button
                  onClick={() => handleOpenExportScoreModal(c.id)}
                  className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 px-3 py-1.5 bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:bg-teal-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer flex items-center gap-1"
                >
                  📊 ส่งออกคะแนน
                </button>
                <button
                  onClick={() => handleOpenAssignModal(c)}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:bg-emerald-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                >
                  เพิ่มนักเรียน
                </button>
                <button
                  onClick={() => handleEditClassroom(c)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDeleteClassroom(c.id, c.name)}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
