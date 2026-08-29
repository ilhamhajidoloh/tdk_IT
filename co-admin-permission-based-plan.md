# แผนเพิ่มฟีเจอร์ Co-admin แบบ Permission-Based

> สถานะ: เอกสารวางแผน
>
> แนวทางที่เลือก: **A - เก็บสิทธิ์รายคนใน `users.admin_permissions` แบบ JSONB**
>
> เป้าหมาย: ให้ครูสามารถเป็น Co-admin ได้ โดย Admin กำหนดสิทธิ์เป็นรายบุคคล และ Co-admin เห็นหรือทำงานได้เฉพาะส่วนที่ได้รับอนุญาต

## สารบัญ

1. [แนวคิดและขอบเขต](#แนวคิดและขอบเขต)
2. [รายการสิทธิ์](#รายการสิทธิ์)
3. [รูปแบบข้อมูลและฐานข้อมูล](#รูปแบบข้อมูลและฐานข้อมูล)
4. [สถาปัตยกรรม Permission System](#สถาปัตยกรรม-permission-system)
5. [แผนดำเนินการ](#แผนดำเนินการ)
6. [API และหน้าจอที่ต้องเพิ่ม](#api-และหน้าจอที่ต้องเพิ่ม)
7. [Flow การใช้งาน](#flow-การใช้งาน)
8. [รายการไฟล์](#รายการไฟล์)
9. [การทดสอบและความปลอดภัย](#การทดสอบและความปลอดภัย)
10. [ระยะเวลาและฟีเจอร์เพิ่มเติม](#ระยะเวลาและฟีเจอร์เพิ่มเติม)

---

## แนวคิดและขอบเขต

### หลักการ

- **Co-admin = ครู + สิทธิ์สำหรับงานผู้ดูแลระบบที่ Admin มอบให้**
- ครูที่ถูกแต่งตั้งเป็น Co-admin เริ่มจากไม่มีสิทธิ์ใด ๆ (`blank slate`)
- Admin เปิดหรือปิดสิทธิ์เป็นรายรายการให้ Co-admin แต่ละคนได้
- Co-admin แต่ละคนมีชุดสิทธิ์ที่แตกต่างกันได้
- Co-admin เข้า `/admin` ได้ แต่เห็นเฉพาะเมนู แท็บ ปุ่ม และข้อมูลที่มีสิทธิ์
- ผู้ใช้ role `admin` เป็น Full Admin และผ่านการตรวจสิทธิ์ทุกข้อโดยอัตโนมัติ
- สิทธิ์ `co_admins.manage` เป็นของ Full Admin เท่านั้น ไม่สามารถมอบให้ Co-admin ได้

### ขอบเขตของงาน

ระบบต้องตรวจสิทธิ์ทั้ง 2 ระดับเสมอ:

1. **Frontend**: ซ่อนเมนู แท็บ ปุ่ม และแสดงข้อความไม่มีสิทธิ์เมื่อจำเป็น
2. **Backend API**: ปฏิเสธคำขอที่ไม่ได้รับอนุญาตด้วย HTTP `403` แม้ผู้ใช้จะเรียก API โดยตรง

> การซ่อน UI เพียงอย่างเดียวไม่ใช่การป้องกันสิทธิ์ ต้องมีการตรวจสอบที่ API ทุก route ที่เกี่ยวข้อง

---

## รายการสิทธิ์

### 1. ผู้ใช้งาน (`users`)

| Permission | ความหมาย |
| --- | --- |
| `users.view` | ดูรายการผู้ใช้ |
| `users.create` | เพิ่มผู้ใช้ใหม่ |
| `users.edit` | แก้ไขข้อมูลผู้ใช้ |
| `users.delete` | ลบผู้ใช้ |
| `users.manage_roles` | เปลี่ยน role ผู้ใช้ |

### 2. นักเรียน (`students`)

| Permission | ความหมาย |
| --- | --- |
| `students.view` | ดูรายการนักเรียน |
| `students.create` | เพิ่มนักเรียน |
| `students.edit` | แก้ไขข้อมูลนักเรียน |
| `students.delete` | ลบนักเรียน |
| `students.import` | นำเข้านักเรียนจาก Excel |
| `students.promote` | เลื่อนชั้นนักเรียน |

### 3. ห้องเรียน (`classrooms`)

| Permission | ความหมาย |
| --- | --- |
| `classrooms.view` | ดูรายการห้องเรียน |
| `classrooms.create` | สร้างห้องเรียนใหม่ |
| `classrooms.edit` | แก้ไขห้องเรียน |
| `classrooms.delete` | ลบห้องเรียน |
| `classrooms.manage_students` | จัดนักเรียนเข้าห้อง |

### 4. วิชา (`subjects`)

| Permission | ความหมาย |
| --- | --- |
| `subjects.view` | ดูรายการวิชา |
| `subjects.create` | สร้างวิชาใหม่ |
| `subjects.edit` | แก้ไขวิชา |
| `subjects.delete` | ลบวิชา |
| `subjects.assign_teachers` | มอบหมายครูสอน |

### 5. ตารางเรียน (`schedules`)

| Permission | ความหมาย |
| --- | --- |
| `schedules.view` | ดูตารางเรียน |
| `schedules.create` | สร้างตารางเรียน |
| `schedules.edit` | แก้ไขตารางเรียน |
| `schedules.delete` | ลบตารางเรียน |

### 6. เช็คชื่อ (`attendance`)

| Permission | ความหมาย |
| --- | --- |
| `attendance.view` | ดูข้อมูลเช็คชื่อ |
| `attendance.edit` | แก้ไขการเช็คชื่อ |
| `attendance.reports` | ดูรายงานสถิติการเข้าเรียน |

### 7. คะแนนและการประเมิน (`scores`)

| Permission | ความหมาย |
| --- | --- |
| `scores.view` | ดูคะแนนนักเรียน |
| `scores.edit` | แก้ไขคะแนน |
| `scores.import` | นำเข้าคะแนนจาก Excel |
| `scores.reports` | ดูรายงานผลการเรียน |

### 8. ข่าวสาร (`news`)

| Permission | ความหมาย |
| --- | --- |
| `news.view` | ดูข่าวสาร |
| `news.create` | สร้างข่าวสารใหม่ |
| `news.edit` | แก้ไขข่าวสาร |
| `news.delete` | ลบข่าวสาร |

### 9. จดหมายและเอกสาร (`correspondence`)

| Permission | ความหมาย |
| --- | --- |
| `correspondence.view` | ดูจดหมาย |
| `correspondence.create` | สร้างจดหมาย |
| `correspondence.edit` | แก้ไขจดหมาย |
| `correspondence.delete` | ลบจดหมาย |

### 10. เวรยาม (`duties`)

| Permission | ความหมาย |
| --- | --- |
| `duties.view` | ดูตารางเวร |
| `duties.edit` | แก้ไขตารางเวร |

### 11. รายงานและสถิติ (`analytics`)

| Permission | ความหมาย |
| --- | --- |
| `analytics.view` | ดู Dashboard และสถิติ |
| `analytics.export` | ส่งออกข้อมูลสถิติ |

### 12. ตั้งค่าระบบ (`settings`)

| Permission | ความหมาย |
| --- | --- |
| `settings.view` | ดูการตั้งค่า |
| `settings.edit` | แก้ไขการตั้งค่าระบบ |
| `settings.academic_year` | จัดการปีการศึกษาและเทอม |

### 13. จัดการ Co-admin (`co_admins`)

| Permission | ความหมาย | ผู้ใช้ที่มีสิทธิ์ |
| --- | --- | --- |
| `co_admins.manage` | เพิ่ม ลบ และกำหนดสิทธิ์ Co-admin | Full Admin เท่านั้น |

### กลุ่มสิทธิ์ที่ควรระวัง

สิทธิ์ต่อไปนี้ควรมีป้ายเตือนในหน้ากำหนดสิทธิ์ เพราะมีผลกระทบสูง:

- `users.delete`, `users.manage_roles`
- `students.delete`, `students.promote`
- `classrooms.delete`
- `subjects.delete`
- `schedules.delete`
- `news.delete`
- `settings.edit`, `settings.academic_year`

---

## รูปแบบข้อมูลและฐานข้อมูล

### แนวทาง A: JSONB column (แนวทางที่แนะนำ)

เพิ่มข้อมูล 2 field ใน `public.users`:

```sql
ALTER TABLE public.users
ADD COLUMN is_co_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_permissions JSONB DEFAULT NULL;

CREATE INDEX idx_users_is_co_admin ON public.users(is_co_admin)
WHERE is_co_admin = TRUE;

CREATE INDEX idx_users_permissions ON public.users
USING GIN (admin_permissions);
```

ตัวอย่าง `admin_permissions`:

```json
{
  "users": { "view": true },
  "students": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": false
  },
  "classrooms": {
    "view": true,
    "edit": true,
    "delete": false
  }
}
```

ตัวอย่าง Co-admin สำหรับข่าวสารและเช็คชื่อ:

```json
{
  "news": { "view": true, "create": true, "edit": true, "delete": true },
  "attendance": { "view": true, "edit": true, "reports": true }
}
```

**ข้อดี**

- ยืดหยุ่น เพิ่มสิทธิ์ใหม่ได้ง่าย
- เก็บสิทธิ์ราย Co-admin ได้โดยไม่เพิ่มตารางใหม่
- ใช้ PostgreSQL JSONB operators เพื่อ query ได้

**ข้อควรระวัง**

- API ต้อง validate JSON ทุกครั้งก่อนบันทึก
- Query สำหรับรายงานหรือ audit ซับซ้อนกว่า relational design

### แนวทาง B: ตาราง Permission แยก (ทางเลือก)

ใช้ `permission_definitions` เพื่อเก็บคำจำกัดความของสิทธิ์ และ `user_permissions` เป็นตาราง many-to-many ระหว่างผู้ใช้กับสิทธิ์

```sql
CREATE TABLE public.permission_definitions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT
);

CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES public.permission_definitions(id),
  granted_by UUID REFERENCES public.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user ON public.user_permissions(user_id);
```

**ข้อดี**: เป็น relational standard, query ง่าย และมีข้อมูลว่าใครมอบสิทธิ์เมื่อใด

**ข้อเสีย**: ต้องเพิ่ม 2 ตาราง และการดึงสิทธิ์ต้อง join มากขึ้น

### ข้อตกลงข้อมูลที่ต้องยึด

- `is_co_admin = false` หมายถึงครูปกติ ไม่เข้า `/admin`
- `is_co_admin = true` และ `admin_permissions = null` หรือ `{}` หมายถึง Co-admin ที่ยังไม่มีสิทธิ์
- ค่า `true` เท่านั้นที่อนุญาต; key ที่ไม่มี หรือเป็น `false` ต้องถือว่าไม่ได้รับสิทธิ์
- Full Admin ไม่ต้องพึ่ง `admin_permissions`
- เมื่อถอด Co-admin ให้ตั้ง `is_co_admin = false` และล้าง `admin_permissions` เป็น `null`

---

## สถาปัตยกรรม Permission System

### Types

สร้าง `app/lib/permissions/types.ts` เพื่อเป็น source of truth ของ:

- `PermissionCategory`
- `PermissionAction`
- `Permission` ในรูปแบบ `` `${category}.${action}` ``
- `AdminPermissions` สำหรับโครงสร้าง JSONB
- `CoAdminUser` สำหรับข้อมูล Co-admin ที่ส่งไปแสดงผล

> `PermissionAction` ต้องครอบคลุม action พิเศษทั้งหมดด้วย เช่น `manage_roles`, `promote`, `manage_students`, `assign_teachers`, `academic_year` และ `manage` ไม่ควรจำกัดเฉพาะ CRUD เพื่อให้ TypeScript ตรวจได้ถูกต้อง

### Definitions

สร้าง `app/lib/permissions/definitions.ts` สำหรับ metadata ของทุก permission:

- ชื่อหมวดหมู่และข้อความภาษาไทย
- label ของแต่ละสิทธิ์
- icon จาก Lucide ที่ใช้ใน UI
- flag `dangerous` สำหรับสิทธิ์ที่มีความเสี่ยง

ไฟล์นี้ใช้ร่วมกันใน modal กำหนดสิทธิ์, preset และ validation ของ API เพื่อป้องกัน key ที่ไม่รู้จักถูกบันทึกลงฐานข้อมูล

### Checker

สร้าง `app/lib/permissions/checker.ts` พร้อม helper หลัก:

| Helper | หน้าที่ |
| --- | --- |
| `hasPermission()` | ตรวจสิทธิ์เดี่ยว โดย Full Admin ผ่านเสมอ |
| `hasAnyPermission()` | ผ่านเมื่อมีสิทธิ์อย่างน้อยหนึ่งข้อ |
| `hasAllPermissions()` | ผ่านเมื่อมีครบทุกข้อ |
| `isFullAdmin()` | ตรวจ role `admin` |
| `canAccessAdmin()` | ตรวจว่าเป็น Full Admin หรือ Co-admin |

หลักการตรวจสิทธิ์:

```text
ถ้า role === 'admin'                 -> true
ถ้าไม่ใช่ Co-admin หรือไม่มีข้อมูล   -> false
แยก permission เป็น category/action -> permissions[category]?.[action] === true
```

### Presets

สร้าง `app/lib/permissions/presets.ts` สำหรับชุดสิทธิ์ที่เลือกได้เร็วใน modal เช่น:

- ผู้จัดการวิชาการ
- ผู้ดูแลนักเรียน
- ผู้ดูแลตารางเรียน
- ผู้ดูแลข่าวสาร
- ผู้ดูแลการเช็คชื่อ
- กำหนดเอง (เริ่มจากไม่มีสิทธิ์)

Preset เป็นเพียงจุดเริ่มต้น ผู้ใช้ยังแก้ไข toggle รายสิทธิ์ได้ก่อนบันทึก

### Middleware และ Session

- สร้าง `requirePermission(...permissions)` ใน `app/lib/permissions/middleware.ts`
- middleware ต้องอ่าน session ปัจจุบันและคืน `403 Forbidden` เมื่อผู้ใช้ไม่มีสิทธิ์
- เพิ่ม `is_co_admin` และ `admin_permissions` เข้า callback/session ของ NextAuth ใน `app/api/auth/[...nextauth]/route.ts`
- อัปเดต type และ state ที่เกี่ยวข้องใน `app/lib/useAuth.ts` และ `app/lib/schoolContext.ts`
- `schoolContext` ควร expose อย่างน้อย `isCoAdmin` และ `canAccessAdmin`

---

## แผนดำเนินการ

### Phase 1: Database และ Core Types

- [ ] เพิ่ม `is_co_admin` และ `admin_permissions` ใน schema/migration
- [ ] เพิ่ม partial index สำหรับ Co-admin และ GIN index สำหรับ JSONB
- [ ] สร้าง types สำหรับ permission และ Co-admin
- [ ] กำหนด validation ที่อนุญาตเฉพาะ permission จาก definitions

### Phase 2: Permission System Core

- [ ] สร้าง permission definitions พร้อม label, icon และสถานะ dangerous
- [ ] สร้าง checker: single, any, all, full-admin และ access-admin
- [ ] สร้าง presets ที่สอดคล้องกับบทบาทงานจริง
- [ ] สร้าง middleware `requirePermission()`

### Phase 3: ป้องกัน API ที่มีอยู่

- [ ] ระบุ API route ทุกตัวที่เป็นงาน admin
- [ ] ใส่ `requirePermission()` ตาม action ของ endpoint
- [ ] แยกสิทธิ์ตาม HTTP method เช่น `GET` ใช้ `.view`, `POST` ใช้ `.create`, `PATCH/PUT` ใช้ `.edit`, `DELETE` ใช้ `.delete`
- [ ] ตรวจสิทธิ์พิเศษสำหรับ import, export, reports, promote, assign teachers และ manage students

ตัวอย่าง mapping สำหรับนักเรียน:

| Method / งาน | Permission |
| --- | --- |
| `GET /api/students` | `students.view` |
| `POST /api/students` | `students.create` |
| `PATCH /api/students/:id` | `students.edit` |
| `DELETE /api/students/:id` | `students.delete` |
| import Excel | `students.import` |
| เลื่อนชั้น | `students.promote` |

### Phase 4: API จัดการ Co-admin

- [ ] เพิ่ม `GET /api/admin/co-admins` เพื่อดู Co-admin ทั้งหมด
- [ ] เพิ่ม `POST /api/admin/co-admins` เพื่อแต่งตั้งครูเป็น Co-admin และบันทึกสิทธิ์
- [ ] เพิ่ม `PATCH /api/admin/co-admins/[id]` เพื่อแก้ไขสิทธิ์
- [ ] เพิ่ม `DELETE /api/admin/co-admins/[id]` เพื่อถอดสิทธิ์ Co-admin
- [ ] ทุก endpoint ในกลุ่มนี้ต้องอนุญาตเฉพาะ Full Admin

กติกาของ API:

- ผู้ที่จะเป็น Co-admin ต้องเป็นผู้ใช้ role `teacher`
- ต้อง reject permission key ที่ไม่อยู่ใน definitions
- ต้องไม่ให้ payload มอบ `co_admins.manage`
- การลบ Co-admin คือการคืนเป็นครูปกติ ไม่ใช่ลบบัญชีครู
- ควรตอบข้อมูลที่ผ่านการ sanitize แล้ว ไม่ส่งข้อมูลลับหรือ hash กลับไปยัง client

### Phase 5: หน้าจอจัดการสิทธิ์ Co-admin

- [ ] สร้าง `CoAdminPermissionModal`
- [ ] สร้าง `CoAdminsTab`
- [ ] เพิ่มแท็บ `Co-admins` ใน `/admin` เฉพาะ Full Admin

รายละเอียด modal:

- เพิ่มใหม่: เลือกครูจาก dropdown
- แก้ไข: แสดงครูเป้าหมายและ permission ปัจจุบัน
- เลือก preset ได้
- แสดงหมวดสิทธิ์เป็นกลุ่ม และเปิด/ปิดรายสิทธิ์ด้วย toggle/checkbox
- มีคำเตือนชัดเจนสำหรับสิทธิ์ `dangerous`
- มี action บันทึกและยกเลิก พร้อม loading/error state

รายละเอียด tab รายการ Co-admin:

- แสดงชื่อผู้ใช้ ชื่อ-นามสกุล และสรุปจำนวนสิทธิ์ที่เปิด
- มีปุ่มแก้ไขสิทธิ์
- มีปุ่มถอดสิทธิ์ พร้อม confirmation ก่อนทำรายการ
- รองรับ empty state และ refresh หลัง mutation

### Phase 6: Permission-Based UI ใน Admin

- [ ] สร้าง `usePermissions()` ใน `app/lib/hooks/usePermissions.ts`
- [ ] สร้าง `PermissionGate` สำหรับ render children ตามสิทธิ์
- [ ] สร้าง `PermissionDenied` สำหรับกรณีเข้าถึงส่วนที่ไม่มีสิทธิ์
- [ ] ปรับ `app/admin/page.tsx` ให้ filter แท็บตาม `.view`
- [ ] ปรับปุ่ม action ในทุกแท็บให้ตรวจ `.create`, `.edit`, `.delete` และสิทธิ์พิเศษ

ตัวอย่างแนวคิดการใช้:

```tsx
<PermissionGate permission="students.create">
  <AddStudentButton />
</PermissionGate>

<PermissionGate
  permission="students.delete"
  fallback={<PermissionDenied action="ลบนักเรียน" />}
>
  <DeleteStudentButton />
</PermissionGate>
```

### Phase 7: ประสบการณ์ของ Co-admin

- [ ] สร้าง `PermissionBanner` สำหรับแจ้งว่าผู้ใช้กำลังทำงานในฐานะ Co-admin
- [ ] ให้ banner มีลิงก์กลับหน้าครู `/teacher`
- [ ] เมื่อ Co-admin login ให้ redirect ไป `/admin`; ครูปกติไป `/teacher`
- [ ] เมนูและแท็บต้องไม่แสดงเมื่อไม่มีสิทธิ์เข้าดู
- [ ] URL ที่เข้าถึงได้แต่ไม่มีสิทธิ์เฉพาะ action ต้องแสดง `PermissionDenied` หรือ redirect ที่เหมาะสม
- [ ] หลัง Admin เปลี่ยนสิทธิ์ ผู้ใช้ต้อง refresh session หรือ login ใหม่เพื่อรับข้อมูลสิทธิ์ล่าสุด

---

## API และหน้าจอที่ต้องเพิ่ม

### API ใหม่

| Route | Method | หน้าที่ | สิทธิ์ |
| --- | --- | --- | --- |
| `/api/admin/co-admins` | `GET` | รายการ Co-admin | Full Admin |
| `/api/admin/co-admins` | `POST` | แต่งตั้ง Co-admin และกำหนดสิทธิ์ | Full Admin |
| `/api/admin/co-admins/[id]` | `PATCH` | เปลี่ยนชุดสิทธิ์ | Full Admin |
| `/api/admin/co-admins/[id]` | `DELETE` | ถอด Co-admin | Full Admin |

### Component ใหม่

| Component | หน้าที่ |
| --- | --- |
| `CoAdminPermissionModal` | เลือกครู, preset และกำหนดสิทธิ์รายรายการ |
| `CoAdminsTab` | รายการ Co-admin พร้อมแก้ไขและถอดสิทธิ์ |
| `PermissionGate` | ป้องกัน UI ตามสิทธิ์ |
| `PermissionDenied` | สถานะไม่มีสิทธิ์เข้าถึง |
| `PermissionBanner` | แจ้งสถานะ Co-admin ในหน้า admin |
| `usePermissions` | hook รวมการตรวจ permission ฝั่ง client |

---

## Flow การใช้งาน

### 1. Admin เพิ่ม Co-admin

1. Admin เข้า `/admin` และเลือกแท็บ **Co-admin**
2. กดเพิ่ม Co-admin
3. เลือกครูจาก dropdown
4. เลือก preset หรือกำหนดสิทธิ์ทีละรายการ
5. กดบันทึกสิทธิ์
6. ระบบตั้ง `is_co_admin = true` และบันทึก `admin_permissions`

### 2. Co-admin เข้าใช้งาน

1. ครู login ด้วย username/password ตามปกติ
2. ระบบตรวจพบ `is_co_admin = true` แล้ว redirect ไป `/admin`
3. แสดง banner ว่าใช้งานในฐานะ Co-admin
4. แสดงเฉพาะเมนู แท็บ ข้อมูล และปุ่มที่ได้รับสิทธิ์
5. การพยายามใช้ API หรือหน้าที่ไม่มีสิทธิ์ต้องถูกปฏิเสธ

### 3. Admin แก้ไขสิทธิ์

1. Admin เปิดรายการ Co-admin
2. กดแก้ไขสิทธิ์ของผู้ใช้เป้าหมาย
3. เปิดหรือปิดสิทธิ์ตามต้องการ
4. กดบันทึก
5. Co-admin refresh session หรือ login ใหม่เพื่อใช้สิทธิ์ชุดใหม่

### 4. Admin ถอด Co-admin

1. Admin กดถอดสิทธิ์ในรายการ Co-admin
2. ยืนยันรายการ
3. ระบบตั้ง `is_co_admin = false` และล้าง `admin_permissions`
4. ผู้ใช้นั้นกลับเป็นครูปกติและไม่สามารถเข้า `/admin` ได้

---

## รายการไฟล์

### Database

| ไฟล์ | การเปลี่ยนแปลง |
| --- | --- |
| `schema_dump.sql` หรือ migration ใหม่ | เพิ่ม `is_co_admin`, `admin_permissions` และ indexes |

### Permission system: ไฟล์ใหม่

```text
app/lib/permissions/types.ts
app/lib/permissions/definitions.ts
app/lib/permissions/presets.ts
app/lib/permissions/checker.ts
app/lib/permissions/middleware.ts
app/lib/hooks/usePermissions.ts
app/components/PermissionGate.tsx
app/components/PermissionDenied.tsx
app/admin/components/modals/CoAdminPermissionModal.tsx
app/admin/components/tabs/CoAdminsTab.tsx
app/admin/components/PermissionBanner.tsx
```

### Core libraries: ไฟล์ที่ต้องแก้

```text
app/lib/schoolContext.ts
app/api/auth/[...nextauth]/route.ts
app/lib/useAuth.ts
```

### API routes

```text
app/api/admin/co-admins/route.ts
app/api/admin/co-admins/[id]/route.ts
```

นอกจาก API ใหม่ ต้องแก้ API เดิมที่เป็นงาน admin ทั้งหมด โดยเพิ่ม `requirePermission()` ให้ตรงกับ operation ของแต่ละ route

### Frontend ที่ต้องแก้

```text
app/admin/page.tsx
app/admin/components/AdminHeader.tsx
app/login/page.tsx
```

รวมถึง component ในแต่ละแท็บ admin ที่มีการสร้าง แก้ไข ลบ นำเข้า ส่งออก หรือดูรายงาน เพื่อครอบด้วย `PermissionGate` ตามสิทธิ์ที่เกี่ยวข้อง

---

## การทดสอบและความปลอดภัย

### Test checklist

- [ ] Full Admin ผ่านทุก permission โดยไม่ต้องมี `admin_permissions`
- [ ] ครูปกติเข้า `/admin` ไม่ได้
- [ ] Co-admin ที่ไม่มีสิทธิ์ใด ๆ เข้า `/admin` ได้ตาม policy แต่ไม่เห็นเมนูงานใด
- [ ] Co-admin เห็นเฉพาะแท็บที่มี `.view`
- [ ] ปุ่ม create/edit/delete/import/export/reports ถูกซ่อนหรือ disabled ตามสิทธิ์
- [ ] API ทุก method คืน `403` เมื่อไม่มีสิทธิ์ แม้เรียกตรง
- [ ] API สำหรับ Co-admin management ปฏิเสธผู้ที่ไม่ใช่ Full Admin
- [ ] payload ที่มี permission ไม่รู้จักหรือ `co_admins.manage` ถูก reject
- [ ] การแก้สิทธิ์มีผลหลัง refresh session/login ใหม่
- [ ] การถอด Co-admin ทำให้กลับไปหน้าครูและเข้า admin ไม่ได้
- [ ] ทดสอบ permission `false`, key ที่หายไป, `null`, JSON ไม่ถูกต้อง และ session หมดอายุ

### Security checklist

- ตรวจสิทธิ์บน server ก่อนอ่านหรือแก้ไขข้อมูลเสมอ
- อย่าเชื่อค่า permission ที่ส่งมาจาก client
- ใช้ permission definitions ฝั่ง server เป็น allow-list
- จำกัด route จัดการ Co-admin ให้ Full Admin เท่านั้น
- บันทึก audit log สำหรับ action สำคัญเมื่อพร้อมใช้งาน
- หลีกเลี่ยงการส่งข้อมูลอ่อนไหวจาก `users` ไปยัง UI รายการ Co-admin

---

## ระยะเวลาและฟีเจอร์เพิ่มเติม

### ประมาณการเวลา

| งาน | เวลาโดยประมาณ |
| --- | --- |
| Database และ types | 2 ชั่วโมง |
| Permission system core | 4-5 ชั่วโมง |
| Backend API และเพิ่ม checks ใน API เดิม | 4-5 ชั่วโมง |
| Frontend core | 3-4 ชั่วโมง |
| UI จัดการ Co-admin | 3-4 ชั่วโมง |
| Integration และ testing | 2-3 ชั่วโมง |
| **รวม** | **15-20 ชั่วโมง** |

### ฟีเจอร์เพิ่มเติมในอนาคต

#### Audit log

บันทึกว่า Co-admin ทำ action อะไรกับทรัพยากรใด เมื่อใด และมีรายละเอียดประกอบ เช่น `created_student` หรือ `deleted_user`

```sql
CREATE TABLE public.co_admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  co_admin_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Permission expiry

รองรับสิทธิ์ชั่วคราวโดยเก็บวันหมดอายุ เช่น:

```json
{
  "students": {
    "view": true,
    "edit": { "granted": true, "expires_at": "2026-12-31" }
  }
}
```

> หากใช้รูปแบบนี้ ต้องปรับ type, checker และ validation ให้รองรับทั้ง boolean และ object ก่อนเปิดใช้งานจริง

#### Permission request

ให้ Co-admin ส่งคำขอสิทธิ์เพิ่มเติม และให้ Admin อนุมัติหรือปฏิเสธจากหน้าจัดการ Co-admin

---

## ลำดับเริ่มทำงานที่แนะนำ

1. ทำ migration และ session fields ให้เรียบร้อยก่อน
2. สร้าง definitions, checker และ middleware พร้อม tests
3. ป้องกัน API เดิมให้ครบก่อนเปิด UI ใหม่
4. เพิ่ม API จัดการ Co-admin
5. เพิ่ม modal/tab สำหรับ Full Admin
6. ปรับ admin UI ตาม permission และเพิ่ม banner
7. ทดสอบทุก role และทุก action ที่มีความเสี่ยง

เอกสารนี้ใช้เป็นแผนงานอ้างอิงก่อนเริ่ม implementation ของระบบ Co-admin แบบ permission-based.
