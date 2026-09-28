import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  FileText,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import BackButton from "../components/BackButton";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | TDK IT",
  description: "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลของแพลตฟอร์ม TDK IT",
};

const sections = [
  {
    id: "scope",
    number: "01",
    title: "ขอบเขตของนโยบาย",
    icon: FileText,
    body: [
      "นโยบายนี้ใช้กับเว็บไซต์และระบบจัดการโรงเรียน TDK IT รวมถึงหน้าเลือกโรงเรียน หน้าข้อมูลสาธารณะ พอร์ทัลสำหรับผู้ดูแล ครู นักเรียน และเจ้าหน้าที่ ตลอดจนบริการที่เชื่อมต่อกับระบบ",
      "โรงเรียนแต่ละแห่งเป็นผู้กำหนดวัตถุประสงค์และสิทธิ์การเข้าถึงข้อมูลของสมาชิกในโรงเรียน ส่วน TDK IT ทำหน้าที่ให้บริการแพลตฟอร์มและมาตรการทางเทคนิคตามนโยบายนี้",
    ],
  },
  {
    id: "data",
    number: "02",
    title: "ข้อมูลที่เราเก็บและใช้",
    icon: Database,
    body: [
      "ข้อมูลบัญชีและการยืนยันตัวตน เช่น ชื่อผู้ใช้ อีเมล บทบาท โรงเรียน และข้อมูลที่จำเป็นต่อการเข้าสู่ระบบ รวมถึงข้อมูลที่ได้รับจาก Google หรือ Facebook เมื่อคุณเลือกเชื่อมต่อบัญชีดังกล่าว",
      "ข้อมูลการศึกษาและการบริหารที่โรงเรียนบันทึกในระบบ เช่น ข้อมูลนักเรียน ห้องเรียน วิชา ตารางเรียน การเข้าเรียน คะแนน ผลการประเมิน ตารางเวร ข่าว ประกาศ วันหยุด และหนังสือราชการ/ไฟล์แนบ",
      "ข้อมูลการติดต่อและการสื่อสาร เช่น ข้อความในแชต ข้อความรับส่งเอกสาร และข้อมูลที่คุณส่งให้โรงเรียนหรือผู้ดูแลระบบ",
      "ข้อมูลทางเทคนิคที่จำเป็นต่อการให้บริการ เช่น ที่อยู่ IP ชนิดอุปกรณ์ เบราว์เซอร์ เวลาใช้งาน และบันทึกการเรียกใช้ระบบ เพื่อความปลอดภัย การแก้ไขปัญหา และการตรวจสอบการใช้งานที่ผิดปกติ",
    ],
  },
  {
    id: "purpose",
    number: "03",
    title: "วัตถุประสงค์การใช้ข้อมูล",
    icon: ShieldCheck,
    body: [
      "ให้บริการและแสดงข้อมูลตามโรงเรียนและบทบาทที่ได้รับอนุญาต เช่น ข่าว ตารางเวร ตารางเรียน คะแนน การประเมิน การเข้าเรียน และเอกสารราชการ",
      "ยืนยันตัวตน จัดการสิทธิ์ ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต และรักษาความปลอดภัยของบัญชีและข้อมูลของโรงเรียน",
      "ประมวลผลคำขอของผู้ใช้ ส่งการแจ้งเตือนที่จำเป็น สนับสนุนการใช้งานแชต และให้ความช่วยเหลือด้านเทคนิค",
      "ดูแลประสิทธิภาพ ความเสถียร และพัฒนาระบบ โดยใช้ข้อมูลรวม หรือข้อมูลที่ลดการระบุตัวบุคคลเมื่อเหมาะสม",
    ],
  },
  {
    id: "sharing",
    number: "04",
    title: "การเปิดเผยและการแบ่งปันข้อมูล",
    icon: Users,
    body: [
      "ข้อมูลจะแสดงแก่ผู้ใช้หรือบุคลากรของโรงเรียนเท่าที่จำเป็นตามบทบาทและสิทธิ์ที่โรงเรียนกำหนด ข้อมูลสาธารณะของโรงเรียนจะแสดงเฉพาะรายการที่โรงเรียนเปิดเผย เช่น ข่าว วันหยุด ตารางเวร และข้อมูลติดต่อ",
      "เราอาจใช้ผู้ให้บริการโครงสร้างพื้นฐานและบริการภายนอกที่จำเป็นต่อการให้บริการ เช่น ผู้ให้บริการฐานข้อมูล พื้นที่จัดเก็บไฟล์ และผู้ให้บริการเข้าสู่ระบบ โดยผู้ให้บริการเหล่านั้นต้องใช้ข้อมูลตามขอบเขตที่จำเป็นและมาตรการรักษาความปลอดภัยที่เหมาะสม",
      "เราอาจเปิดเผยข้อมูลเมื่อกฎหมาย คำสั่งศาล หรือเหตุฉุกเฉินด้านความปลอดภัยกำหนดให้ต้องเปิดเผย และจะจำกัดข้อมูลเท่าที่จำเป็น",
    ],
  },
  {
    id: "security",
    number: "05",
    title: "การรักษาความปลอดภัยและระยะเวลาเก็บรักษา",
    icon: LockKeyhole,
    body: [
      "เราใช้การควบคุมสิทธิ์ตามบทบาท การยืนยันตัวตน โทเคนการเข้าถึง การส่งข้อมูลผ่านช่องทางที่ปลอดภัย และการตรวจสอบการเรียกใช้ระบบเพื่อป้องกันการเข้าถึงหรือการเปลี่ยนแปลงข้อมูลโดยไม่ได้รับอนุญาต",
      "ข้อมูลจะถูกเก็บไว้ตราบเท่าที่จำเป็นต่อการให้บริการ การปฏิบัติตามกฎหมาย หรือข้อกำหนดของโรงเรียน เมื่อพ้นความจำเป็น โรงเรียนหรือผู้ดูแลระบบจะลบหรือทำให้ข้อมูลไม่สามารถระบุตัวบุคคลได้ตามกระบวนการของระบบ",
      "ไม่มีระบบใดรับประกันความปลอดภัยได้อย่างสมบูรณ์ หากพบเหตุที่อาจกระทบข้อมูล เราจะประเมินสถานการณ์และแจ้งผู้เกี่ยวข้องตามที่กฎหมายกำหนด",
    ],
  },
  {
    id: "cookies",
    number: "06",
    title: "คุกกี้และพื้นที่จัดเก็บในเบราว์เซอร์",
    icon: Database,
    body: [
      "ระบบใช้คุกกี้หรือพื้นที่จัดเก็บในเบราว์เซอร์เพื่อจดจำโรงเรียนที่เลือก ธีมการแสดงผล สถานะการติดตั้งแอป และข้อมูลที่จำเป็นต่อการเข้าสู่ระบบ ฟังก์ชันเหล่านี้ช่วยให้ระบบทำงานได้ตามที่คุณร้องขอและไม่ได้ใช้เพื่อขายข้อมูลหรือทำโฆษณาตามพฤติกรรม",
      "คุณสามารถลบหรือบล็อกข้อมูลดังกล่าวจากการตั้งค่าเบราว์เซอร์ได้ แต่อาจทำให้ต้องเลือกโรงเรียนหรือเข้าสู่ระบบใหม่ และบางฟังก์ชันอาจทำงานได้ไม่ครบถ้วน",
    ],
  },
  {
    id: "rights",
    number: "07",
    title: "สิทธิ์ของเจ้าของข้อมูล",
    icon: ShieldCheck,
    body: [
      "คุณอาจขอเข้าถึง ขอสำเนา ขอแก้ไข ขอให้ลบ ขอจำกัดการใช้ หรือคัดค้านการประมวลผลข้อมูลของคุณได้ตามกฎหมายที่ใช้บังคับ ทั้งนี้บางคำขออาจถูกจำกัดโดยหน้าที่ตามกฎหมาย ความปลอดภัย หรือสิทธิ์ของโรงเรียนและบุคคลอื่น",
      "สำหรับข้อมูลที่อยู่ภายใต้การดูแลของโรงเรียน โปรดติดต่อผู้ดูแลระบบหรือโรงเรียนต้นสังกัดก่อน เราจะประสานงานและดำเนินการตามขอบเขตหน้าที่ของผู้ให้บริการแพลตฟอร์ม",
    ],
  },
  {
    id: "contact",
    number: "08",
    title: "การติดต่อและการเปลี่ยนแปลงนโยบาย",
    icon: Mail,
    body: [
      "หากมีคำถาม แจ้งเหตุด้านความเป็นส่วนตัว หรือขอใช้สิทธิ์ โปรดติดต่อผู้ดูแลระบบของโรงเรียนผ่านข้อมูลติดต่อในหน้า ข้อมูลสถานศึกษา หรือส่งรายละเอียดมาที่ผู้ดูแลแพลตฟอร์ม TDK IT โดยระบุโรงเรียน บัญชีที่เกี่ยวข้อง และคำขอให้ชัดเจน",
      "เราอาจปรับปรุงนโยบายนี้เมื่อฟังก์ชัน กฎหมาย หรือแนวทางการรักษาความปลอดภัยเปลี่ยนแปลง วันที่ปรับปรุงล่าสุดจะแสดงไว้ด้านบน และการใช้งานต่อหลังมีการเปลี่ยนแปลงถือว่ารับทราบนโยบายฉบับปรับปรุง",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <nav className="mb-8 flex items-center justify-between">
          <BackButton />
          <Link href="/" className="text-sm font-black tracking-tight text-foreground">TDK IT</Link>
        </nav>

        <header className="mb-8 border-b border-border pb-8 sm:mb-10 sm:pb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            ความเป็นส่วนตัวและการคุ้มครองข้อมูล
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">นโยบายความเป็นส่วนตัว</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            เราออกแบบ TDK IT เพื่อช่วยให้โรงเรียนจัดการข้อมูลได้อย่างเป็นระบบ ปลอดภัย และเข้าถึงได้ตามสิทธิ์ นโยบายนี้อธิบายข้อมูลที่ระบบใช้ เหตุผลที่ใช้ และทางเลือกของคุณ
          </p>
          <p className="mt-5 text-xs font-semibold text-muted-foreground">ปรับปรุงล่าสุด: 28 กันยายน 2569</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">สารบัญ</p>
              <div className="space-y-1">
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="block rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary">
                    {section.number} {section.title}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <section key={section.id} id={section.id} className="scroll-mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-wider text-primary">{section.number}</p>
                      <h2 className="text-lg font-black sm:text-xl">{section.title}</h2>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                    {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                </section>
              );
            })}

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm leading-7 text-muted-foreground sm:p-7">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <p>เมื่อใช้ฟังก์ชันแชตหรือส่งเอกสาร โปรดหลีกเลี่ยงการส่งข้อมูลที่ไม่เกี่ยวข้องหรือข้อมูลอ่อนไหวเกินความจำเป็น หากต้องการสอบถามเพิ่มเติม ให้ติดต่อโรงเรียนหรือผู้ดูแลระบบของคุณ</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} TDK IT Multi-School Platform</span>
        </footer>
      </div>
    </main>
  );
}
