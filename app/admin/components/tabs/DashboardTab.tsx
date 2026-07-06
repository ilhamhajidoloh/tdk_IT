import { type DBUser, type DBStudent, type DBClassroom, type DBSubject, type SchedulePeriod, type SystemSetting, type Tab } from "../types";
import { formatThaiDateRange } from "../../../lib/format";
import StatCard from "../StatCard";
import QuickLinkCard from "../QuickLinkCard";

interface DashboardTabProps {
  adminYear: string | number;
  adminTerm: string | number;
  users: DBUser[];
  students: DBStudent[];
  classrooms: DBClassroom[];
  subjectsList: DBSubject[];
  schedulePeriods: SchedulePeriod[];
  settingsList: SystemSetting[];
  startDate: string;
  endDate: string;
  isGradingActive: boolean;
  navItems: { key: Tab; label: string; sub: string; icon: string }[];
  setActiveTab: (tab: Tab) => void;
}

export default function DashboardTab({
  adminYear,
  adminTerm,
  users,
  students,
  classrooms,
  subjectsList,
  schedulePeriods,
  settingsList,
  startDate,
  endDate,
  isGradingActive,
  navItems,
  setActiveTab,
}: DashboardTabProps) {
  return (
    <div className="p-8 animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-foreground">แดชบอร์ดภาพรวม</h2>
        <p className="text-muted-foreground text-sm mt-1">
          สรุปข้อมูลสำคัญของระบบ ประจำปีการศึกษา {adminYear} ภาคเรียนที่ {adminTerm}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard
          label="ผู้ใช้งานทั้งหมด"
          value={users.length}
          sub="บัญชีผู้ใช้งานในระบบ"
          color="indigo"
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
        <StatCard
          label="นักเรียน"
          value={users.filter((u) => u.role === "student").length}
          sub={`ทะเบียนนักเรียนทั้งหมด ${students.length} คน`}
          color="green"
          icon="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
        />
        <StatCard
          label="ครูผู้สอน"
          value={users.filter((u) => u.role === "teacher").length}
          sub="บัญชีครูผู้สอน"
          color="blue"
          icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-3 0h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
        />
        <StatCard
          label="ผู้ดูแลระบบ"
          value={users.filter((u) => u.role === "admin").length}
          sub="บัญชีแอดมิน"
          color="red"
          icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
        <StatCard
          label="ชั้นเรียน (เทอมนี้)"
          value={classrooms.length}
          sub="ห้องเรียนในปีการศึกษาปัจจุบัน"
          color="purple"
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16M9 7h1m4 0h1m-6 4h1m4 0h1m-5 9v-4a1 1 0 011-1h1a1 1 0 011 1v4"
        />
        <StatCard
          label="วิชาเรียน (เทอมนี้)"
          value={subjectsList.length}
          sub="รายวิชาที่เปิดสอน"
          color="amber"
          icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
        <StatCard
          label="คาบเรียนต่อวัน"
          value={schedulePeriods.length}
          sub="คาบที่กำหนดไว้ในตารางสอน"
          color="indigo"
          icon="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
        <StatCard
          label="ปีการศึกษาทั้งหมด"
          value={settingsList.length}
          sub="จำนวนปีการศึกษา/เทอมในระบบ"
          color="blue"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Term Status */}
        <div className="lg:col-span-1 rounded-3xl p-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg shadow-indigo-200/50 flex flex-col justify-between animate-gradient-shift relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-card/10 rounded-full" />
          <div className="absolute bottom-[-30px] left-[-10px] w-32 h-32 bg-card/5 rounded-full" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-1.5">
              ภาคเรียนปัจจุบัน
            </div>
            <div className="text-2xl font-extrabold leading-tight">ปีการศึกษา {adminYear}</div>
            <div className="text-lg font-bold text-indigo-100 mb-3">ภาคเรียนที่ {adminTerm}</div>
            <div className="text-sm text-indigo-100">{formatThaiDateRange(startDate, endDate)}</div>
          </div>
          <div className="mt-6">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                isGradingActive
                  ? "bg-emerald-400/20 text-emerald-50 border border-emerald-300/40"
                  : "bg-rose-400/20 text-rose-50 border border-rose-300/40"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isGradingActive ? "bg-emerald-300 animate-pulse" : "bg-rose-300"
                }`}
              />
              {isGradingActive ? "เปิดใช้งานระบบกรอกคะแนน" : "ปิดใช้งานระบบกรอกคะแนน"}
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-2">
          <h3 className="text-xs font-bold text-subtle-foreground uppercase tracking-wider mb-3">
            ทางลัดจัดการระบบ
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {navItems
              .filter((item) => item.key !== "dashboard")
              .map((item) => (
                <QuickLinkCard
                  key={item.key}
                  label={item.label}
                  sub={item.sub}
                  icon={item.icon}
                  onClick={() => setActiveTab(item.key)}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
