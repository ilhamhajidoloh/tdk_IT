export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Storing plain string for mock purposes
  role: Role;
  studentId?: string; // Only for student role
  homeroomClassroomId?: string; // Only for teacher role
  subjects?: string[]; // Only for teacher role
}

export interface Classroom {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
  classroomId: string;
}

export interface Grade {
  id: string;
  studentId: string; // The public studentId (e.g., S001)
  subject: string;
  midtermScore: number;
  finalScore: number;
  term: string;
}

const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', passwordHash: 'admin', role: 'admin' },
  { id: 'u2', username: 'teacher1', passwordHash: '1234', role: 'teacher', homeroomClassroomId: 'c1', subjects: ['Mathematics', 'Science'] },
  { id: 'u3', username: 's001', passwordHash: '1234', role: 'student', studentId: 'S001' },
];

const INITIAL_CLASSROOMS: Classroom[] = [
  { id: 'c1', name: 'M.1/1' },
  { id: 'c2', name: 'M.1/2' },
  { id: 'c3', name: 'M.2/1' },
  { id: 'c4', name: 'M.2/2' },
  { id: 'c5', name: 'M.3/1' },
];

const INITIAL_STUDENTS: Student[] = [
  { id: '1', name: 'John Doe', studentId: 'S001', classroomId: 'c1' },
  { id: '2', name: 'Jane Smith', studentId: 'S002', classroomId: 'c2' },
  { id: '3', name: 'Alice Johnson', studentId: 'S003', classroomId: 'c3' },
  { id: '4', name: 'Bob Brown', studentId: 'S004', classroomId: 'c4' },
  { id: '5', name: 'Charlie Davis', studentId: 'S005', classroomId: 'c5' },
];

const INITIAL_GRADES: Grade[] = [
  { id: 'g1', studentId: 'S001', subject: 'Mathematics', midtermScore: 40, finalScore: 45, term: '1/2026' },
  { id: 'g2', studentId: 'S001', subject: 'Science', midtermScore: 45, finalScore: 47, term: '1/2026' },
  { id: 'g3', studentId: 'S002', subject: 'Mathematics', midtermScore: 35, finalScore: 43, term: '1/2026' },
];

export const getClassrooms = (): Classroom[] => {
  if (typeof window === 'undefined') return INITIAL_CLASSROOMS;
  const stored = localStorage.getItem('mock_classrooms_v3');
  if (!stored) {
    localStorage.setItem('mock_classrooms_v3', JSON.stringify(INITIAL_CLASSROOMS));
    return INITIAL_CLASSROOMS;
  }
  return JSON.parse(stored);
};

export const getStudents = (): Student[] => {
  if (typeof window === 'undefined') return INITIAL_STUDENTS;
  const stored = localStorage.getItem('mock_students_v3');
  if (!stored) {
    localStorage.setItem('mock_students_v3', JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  }
  return JSON.parse(stored);
};

export const getGrades = (): Grade[] => {
  if (typeof window === 'undefined') return INITIAL_GRADES;
  const stored = localStorage.getItem('mock_grades_v3');
  if (!stored) {
    localStorage.setItem('mock_grades_v3', JSON.stringify(INITIAL_GRADES));
    return INITIAL_GRADES;
  }
  return JSON.parse(stored);
};

export const saveGrade = (grade: Omit<Grade, 'id'> | Grade) => {
  if (typeof window === 'undefined') return;
  const grades = getGrades();
  if ('id' in grade && grade.id) {
    // Update
    const index = grades.findIndex(g => g.id === grade.id);
    if (index !== -1) {
      grades[index] = grade as Grade;
    } else {
      grades.push(grade as Grade);
    }
  } else {
    // Create
    grades.push({ ...grade, id: 'g' + Date.now() });
  }
  localStorage.setItem('mock_grades_v3', JSON.stringify(grades));
};

export const deleteGrade = (id: string) => {
  if (typeof window === 'undefined') return;
  let grades = getGrades();
  grades = grades.filter(g => g.id !== id);
  localStorage.setItem('mock_grades_v3', JSON.stringify(grades));
};

export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return INITIAL_USERS;
  const stored = localStorage.getItem('mock_users_v3');
  if (!stored) {
    localStorage.setItem('mock_users_v3', JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(stored);
};

export const saveUser = (user: Omit<User, 'id'> | User) => {
  if (typeof window === 'undefined') return;
  const users = getUsers();
  if ('id' in user && user.id) {
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) users[index] = user as User;
    else users.push(user as User);
  } else {
    users.push({ ...user, id: 'u' + Date.now() });
  }
  localStorage.setItem('mock_users_v3', JSON.stringify(users));
};

export const deleteUser = (id: string) => {
  if (typeof window === 'undefined') return;
  let users = getUsers();
  users = users.filter(u => u.id !== id);
  localStorage.setItem('mock_users_v3', JSON.stringify(users));
};

// Simple Mock Auth
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('mock_current_user');
  if (!stored) return null;
  return JSON.parse(stored);
};

export const login = (user: User) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mock_current_user', JSON.stringify(user));
};

export const logout = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('mock_current_user');
};

export interface SystemSettings {
  academicYear: string;
  term: string;
  startDate: string;
  endDate: string;
}

const INITIAL_SETTINGS: SystemSettings = {
  academicYear: '2568',
  term: '1',
  startDate: '2026-05-01',
  endDate: '2026-10-10',
};

export const getSystemSettings = (): SystemSettings => {
  if (typeof window === 'undefined') return INITIAL_SETTINGS;
  const stored = localStorage.getItem('mock_settings_v3');
  if (!stored) {
    localStorage.setItem('mock_settings_v3', JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.academicYear || !parsed.term || !parsed.startDate || !parsed.endDate) {
      const migrated: SystemSettings = {
        academicYear: parsed.currentTerm?.includes("/") ? parsed.currentTerm.split("/")[1] : '2568',
        term: parsed.currentTerm?.includes("/") ? parsed.currentTerm.split("/")[0] : '1',
        startDate: '2026-05-01',
        endDate: '2026-10-10'
      };
      localStorage.setItem('mock_settings_v3', JSON.stringify(migrated));
      return migrated;
    }
    return parsed as SystemSettings;
  } catch (e) {
    return INITIAL_SETTINGS;
  }
};

export const saveSystemSettings = (settings: SystemSettings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mock_settings_v3', JSON.stringify(settings));
};

// =========================================
// Classrooms CRUD Helpers
// =========================================
export const saveClassroom = (classroom: Omit<Classroom, 'id'> | Classroom) => {
  if (typeof window === 'undefined') return;
  const classrooms = getClassrooms();
  if ('id' in classroom && classroom.id) {
    const index = classrooms.findIndex(c => c.id === classroom.id);
    if (index !== -1) classrooms[index] = classroom as Classroom;
  } else {
    classrooms.push({ ...classroom, id: 'c' + Date.now() });
  }
  localStorage.setItem('mock_classrooms_v3', JSON.stringify(classrooms));
};

export const deleteClassroom = (id: string) => {
  if (typeof window === 'undefined') return;
  let classrooms = getClassrooms();
  classrooms = classrooms.filter(c => c.id !== id);
  localStorage.setItem('mock_classrooms_v3', JSON.stringify(classrooms));
};

// =========================================
// Students CRUD Helpers
// =========================================
export const saveStudent = (student: Omit<Student, 'id'> | Student) => {
  if (typeof window === 'undefined') return;
  const students = getStudents();
  if ('id' in student && student.id) {
    const index = students.findIndex(s => s.id === student.id);
    if (index !== -1) students[index] = student as Student;
  } else {
    students.push({ ...student, id: 's_std' + Date.now() });
  }
  localStorage.setItem('mock_students_v3', JSON.stringify(students));
};

export const deleteStudent = (id: string) => {
  if (typeof window === 'undefined') return;
  let students = getStudents();
  students = students.filter(s => s.id !== id);
  localStorage.setItem('mock_students_v3', JSON.stringify(students));
};

// =========================================
// Subjects CRUD Helpers
// =========================================
export interface Subject {
  id: string;
  name: string;
}

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub1', name: 'Mathematics' },
  { id: 'sub2', name: 'Science' },
  { id: 'sub3', name: 'English' },
  { id: 'sub4', name: 'Thai' },
  { id: 'sub5', name: 'Social Studies' }
];

export const getSubjects = (): Subject[] => {
  if (typeof window === 'undefined') return INITIAL_SUBJECTS;
  const stored = localStorage.getItem('mock_subjects_v3');
  if (!stored) {
    localStorage.setItem('mock_subjects_v3', JSON.stringify(INITIAL_SUBJECTS));
    return INITIAL_SUBJECTS;
  }
  return JSON.parse(stored);
};

export const saveSubject = (subject: Omit<Subject, 'id'> | Subject) => {
  if (typeof window === 'undefined') return;
  const subjects = getSubjects();
  if ('id' in subject && subject.id) {
    const index = subjects.findIndex(s => s.id === subject.id);
    if (index !== -1) subjects[index] = subject as Subject;
  } else {
    subjects.push({ ...subject, id: 'sub' + Date.now() });
  }
  localStorage.setItem('mock_subjects_v3', JSON.stringify(subjects));
};

export const deleteSubject = (id: string) => {
  if (typeof window === 'undefined') return;
  let subjects = getSubjects();
  subjects = subjects.filter(s => s.id !== id);
  localStorage.setItem('mock_subjects_v3', JSON.stringify(subjects));
};
