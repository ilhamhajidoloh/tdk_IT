# ฟีเจอร์กำหนดการเฉพาะครู (Teacher-Only Calendar Events)

## คำอธิบาย
ฟีเจอร์นี้ช่วยให้แอดมินสามารถเพิ่มกำหนดการประจำปีที่แสดงเฉพาะกับครูเท่านั้น โดยกำหนดการเหล่านี้จะไม่แสดงในฝั่งนักเรียน ผู้ปกครอง หรือหน้า home สาธารณะ

## วิธีการใช้งาน

### สำหรับแอดมิน

1. เข้าสู่ระบบในฐานะ Admin หรือ Super Admin
2. ไปที่แท็บ "ปฏิทินประจำปี" (Calendar Tab)
3. คลิกปุ่ม "เพิ่มกำหนดการ"
4. กรอกข้อมูลกำหนดการ:
   - หัวข้อ
   - รายละเอียด
   - วันที่
   - ประเภท
   - **แสดงให้**: เลือก "เฉพาะครู" หรือ "ทุกคน"
   - ปีการศึกษา
5. คลิก "บันทึก"

### การแสดงผล

- **ทุกคน (all)**: แสดงในทุกฝั่ง (ครู, นักเรียน, ผู้ปกครอง, หน้า home)
- **เฉพาะครู (teacher_only)**: แสดงเฉพาะในหน้าครูเท่านั้น

## ตัวอย่างการใช้งาน

### กำหนดการเฉพาะครู
- ประชุมครู
- อบรมครู
- วันส่งเอกสาร/รายงานของครู
- วันประเมินครู
- กำหนดส่งผลการเรียนของนักเรียน

### กำหนดการแสดงทุกคน
- วันเปิดเทอม / วันปิดเทอม
- วันสอบกลางภาค / ปลายภาค
- วันหยุดนักขัตฤกษ์
- กิจกรรมนักเรียน
- วันกีฬาสี

## การติดตั้ง Database

รันสคริปต์ SQL เพื่อเพิ่มคอลัมน์ `visibility` ในตาราง `calendar_events`:

```bash
psql -U your_username -d your_database -f scripts/add_calendar_visibility.sql
```

หรือรันคำสั่ง SQL โดยตรง:

```sql
ALTER TABLE calendar_events
ADD COLUMN visibility STRING DEFAULT 'all';

UPDATE calendar_events
SET visibility = 'all'
WHERE visibility IS NULL;
```

## Technical Details

### API Changes

#### GET `/api/calendar-events`
- เพิ่ม query parameter `userRole` เพื่อกรองกำหนดการตาม role
- ตัวอย่าง: `/api/calendar-events?userRole=teacher&schoolId=xxx&academicYear=2568`

#### POST `/api/calendar-events`
- เพิ่ม field `visibility` ใน request body
- ค่าที่รับ: `"all"` (default) หรือ `"teacher_only"`

#### PUT `/api/calendar-events`
- เพิ่ม field `visibility` ใน request body
- สามารถแก้ไขค่า visibility ของกำหนดการที่มีอยู่แล้วได้

### Component Changes

#### CalendarTimeline Component
- เพิ่ม prop `userRole?: string`
- ส่ง userRole ไปยัง API เพื่อกรองกำหนดการที่เหมาะสม

#### CalendarTab Component (Admin)
- เพิ่ม dropdown "แสดงให้" ในฟอร์มเพิ่ม/แก้ไขกำหนดการ
- เพิ่ม field `visibility` ใน CalendarEvent type

### User Role Mapping

| User Role    | แสดงกำหนดการ                           |
| ------------ | --------------------------------------- |
| teacher      | all + teacher_only                      |
| student      | all เท่านั้น                           |
| parent       | all เท่านั้น                           |
| guest        | all เท่านั้น                           |
| admin        | ทั้งหมด (ไม่กรอง)                      |
| super_admin  | ทั้งหมด (ไม่กรอง)                      |

## การทดสอบ

1. สร้างกำหนดการ 2 รายการ:
   - รายการ 1: visibility = "all"
   - รายการ 2: visibility = "teacher_only"

2. ตรวจสอบการแสดงผล:
   - หน้าครู (`/teacher`): ควรเห็นทั้ง 2 รายการ
   - หน้านักเรียน (`/student`): ควรเห็นเฉพาะรายการ 1
   - หน้า home (`/home`): ควรเห็นเฉพาะรายการ 1

## Notes

- กำหนดการที่สร้างก่อนการอัปเดตนี้จะมี visibility = "all" โดยอัตโนมัติ
- แอดมินสามารถแก้ไข visibility ของกำหนดการเดิมได้
- การเปลี่ยน visibility จะมีผลทันทีโดยไม่ต้อง restart server
