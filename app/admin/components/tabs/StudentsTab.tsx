import { type DBStudent, type SystemSetting } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";

interface StudentsTabProps {
  settingsList: SystemSetting[];
  selectedSettingId: number | null;
  setSelectedSettingId: (id: number) => void;
  loadClassrooms: (settingId: number, token: string) => void;
  loadStudents: (settingId: number, token: string) => void;
  token: string | null;
  filteredStudents: DBStudent[];
  studentFilterClassroomId: string;
  setStudentFilterClassroomId: (id: string) => void;
  classrooms: { id: string; name: string }[];
  exportLanguage: "th" | "ms-rumi" | "ms-jawi";
  setExportLanguage: (lang: "th" | "ms-rumi" | "ms-jawi") => void;
  handleExportStudents: () => void;
  handleRandomStudentNumbers: () => void;
  setStudents: React.Dispatch<React.SetStateAction<DBStudent[]>>;
  handleUpdateStudentNumber: (studentDbId: string, rawValue: string) => void;
  handleEditStudent: (student: DBStudent) => void;
}

export default function StudentsTab({
  settingsList,
  selectedSettingId,
  setSelectedSettingId,
  loadClassrooms,
  loadStudents,
  token,
  filteredStudents,
  studentFilterClassroomId,
  setStudentFilterClassroomId,
  classrooms,
  exportLanguage,
  setExportLanguage,
  handleExportStudents,
  handleRandomStudentNumbers,
  setStudents,
  handleUpdateStudentNumber,
  handleEditStudent,
}: StudentsTabProps) {
  const activeStudentSetting = settingsList.find((s) => s.id === selectedSettingId);

  return (
    <div className="p-8">
      <SectionHeader
        icon="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
        color="green"
        title="จัดการข้อมูลนักเรียน (Students)"
        subtitle={
          activeStudentSetting
            ? `กำลังจัดการนักเรียน ปีการศึกษา ${activeStudentSetting.academic_year} เทอม ${activeStudentSetting.term}`
            : "จัดการข้อมูลและการนำนักเรียนเข้าชั้นเรียน (Enrollment)"
        }
        count={filteredStudents.length}
        countLabel="คน"
      >
        <select
          className="border border-border rounded-xl px-4 py-2 bg-card text-sm font-medium text-foreground hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          value={studentFilterClassroomId}
          onChange={(e) => setStudentFilterClassroomId(e.target.value)}
        >
          <option value="unassigned">-- ยังไม่ระบุชั้นเรียน --</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </SectionHeader>

      {/* Term Selector */}
      <TermSelector
        settingsList={settingsList}
        selectedId={selectedSettingId}
        onSelect={(id) => {
          setSelectedSettingId(id);
          if (token) {
            loadClassrooms(id, token);
            loadStudents(id, token);
          }
        }}
      />

      {/* Export Students Section */}
      <div className="mb-6 p-5 rounded-2xl border border-amber-100 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-xs">
          <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">
            📄 ภาษาการส่งออก
          </label>
          <select
            value={exportLanguage}
            onChange={(e) => setExportLanguage(e.target.value as any)}
            className="w-full px-3 py-2.5 text-sm bg-card border border-amber-200 dark:border-amber-500/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent hover:border-amber-300 transition-colors"
          >
            <option value="th">🇹🇭 ภาษาไทย</option>
            <option value="ms-rumi">🇲🇾 Bahasa Melayu (Rumi)</option>
            <option value="ms-jawi">🇲🇾 Bahasa Melayu (Jawi)</option>
          </select>
        </div>
        <button
          onClick={handleExportStudents}
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8H3m16-8h3m-6-4l-4-4m0 0l-4 4m4-4v12"
            />
          </svg>
          ส่งออกรายชื่อนักเรียน
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block animate-fade-in-up">
        <div className="flex justify-end mb-2">
          <button
            onClick={handleRandomStudentNumbers}
            title="กำหนดเลขที่แบบสุ่ม"
            className="px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-500/25 text-xs font-bold transition-all cursor-pointer border-0"
          >
            Random เลขที่
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold w-24">เลขที่</th>
                <th className="px-6 py-4 font-semibold">รหัสนักเรียน</th>
                <th className="px-6 py-4 font-semibold">ชื่อ-สกุล</th>
                <th className="px-6 py-4 font-semibold">ห้องเรียน</th>
                <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-16 px-2 py-1.5 border border-border rounded-lg text-center text-sm font-medium text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-card hover:bg-muted"
                      value={s.student_number ?? ""}
                      placeholder="-"
                      onChange={(e) => {
                        const val = e.target.value;
                        setStudents((prev) =>
                          prev.map((item) =>
                            item.id === s.id
                              ? { ...item, student_number: val === "" ? null : Number(val) }
                              : item
                          )
                        );
                      }}
                      onBlur={(e) => {
                        handleUpdateStudentNumber(s.id, e.target.value);
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">
                    {s.student_id}
                  </td>
                  <td className="px-6 py-4 text-foreground font-semibold">{s.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-border/50">
                      ชั้น {classrooms.find((c) => c.id === s.classroom_id)?.name || "ยังไม่ระบุ"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleEditStudent(s)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                      >
                        แก้ไขข้อมูล / จัดห้องเรียน
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 animate-fade-in-up">
        <div className="flex justify-end mb-2">
          <button
            onClick={handleRandomStudentNumbers}
            className="px-3 py-2 rounded-xl bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-500/25 text-xs font-bold transition-all cursor-pointer border-0 shadow-sm"
          >
            Random เลขที่
          </button>
        </div>
        {filteredStudents.map((s) => (
          <div key={s.id} className="card-modern p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="number"
                    placeholder="เลขที่"
                    className="w-16 px-2 py-1 border border-border rounded-lg text-center text-xs font-medium text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-card hover:bg-muted"
                    value={s.student_number ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStudents((prev) =>
                        prev.map((item) =>
                          item.id === s.id
                            ? { ...item, student_number: val === "" ? null : Number(val) }
                            : item
                        )
                      );
                    }}
                    onBlur={(e) => {
                      handleUpdateStudentNumber(s.id, e.target.value);
                    }}
                  />
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">{s.student_id}</div>
                </div>
                <div className="text-foreground font-semibold mt-0.5">{s.name}</div>
                <span className="inline-block mt-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-border/50">
                  ชั้น {classrooms.find((c) => c.id === s.classroom_id)?.name || "ยังไม่ระบุ"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
              <button
                onClick={() => handleEditStudent(s)}
                className="flex-1 text-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
              >
                แก้ไขข้อมูล / จัดห้องเรียน
              </button>
            </div>
          </div>
        ))}
        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
            ไม่มีข้อมูลนักเรียน
          </div>
        )}
      </div>
    </div>
  );
}
