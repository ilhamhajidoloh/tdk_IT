import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";
import bcrypt from "bcrypt";
import pool from "@/app/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("กรุณากรอก Username และ Password");
        }

        try {
          const result = await pool.query(
            "SELECT id, username, password, role, student_id, homeroom_classroom_id, subjects, email FROM users WHERE username = $1 OR student_id = $1",
            [credentials.username]
          );

          const user = result.rows[0];

          if (!user) {
            throw new Error("ไม่พบชื่อผู้ใช้นี้");
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error("รหัสผ่านไม่ถูกต้อง");
          }

          return {
            id: user.id.toString(),
            name: user.username,
            role: user.role,
            student_id: user.student_id,
            homeroom_classroom_id: user.homeroom_classroom_id,
            subjects: user.subjects,
            email: user.email,
          };
          
        } catch (error: any) {
          throw new Error(error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
      authorization: { params: { scope: "profile openid email" } },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 วัน
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        if (!profile?.email) return false;
        const result = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [profile.email]);
        if (result.rows.length === 0) {
          return `/?error=${encodeURIComponent("ไม่พบบัญชีผู้ใช้สำหรับอีเมลนี้ในระบบ กรุณาติดต่อแอดมิน")}`;
        }
      }
      if (account?.provider === "line") {
        if (!profile?.email) {
          return `/?error=${encodeURIComponent("บัญชี LINE ของคุณไม่มีอีเมล กรุณาผูกอีเมลกับ LINE ก่อน แล้วลองใหม่อีกครั้ง")}`;
        }
        const result = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [profile.email]);
        if (result.rows.length === 0) {
          return `/?error=${encodeURIComponent("ไม่พบบัญชีผู้ใช้สำหรับอีเมลนี้ในระบบ กรุณาติดต่อแอดมิน")}`;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (account?.provider === "google" || account?.provider === "line") {
        const result = await pool.query(
          "SELECT id, username, role, student_id, homeroom_classroom_id, subjects, email FROM users WHERE LOWER(email) = LOWER($1)",
          [token.email]
        );
        if (result.rows[0]) {
          const u = result.rows[0];
          token.id = u.id.toString();
          token.role = u.role;
          token.name = u.username;
          token.student_id = u.student_id;
          token.homeroom_classroom_id = u.homeroom_classroom_id;
          token.subjects = u.subjects;
          token.email = u.email;
        }
      } else if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.student_id = (user as any).student_id;
        token.homeroom_classroom_id = (user as any).homeroom_classroom_id;
        token.subjects = (user as any).subjects;
        token.email = (user as any).email;
      } else if (trigger === "update" && token.id) {
        // เรียกผ่าน session.update() เมื่อข้อมูลผู้ใช้ในฐานข้อมูลเปลี่ยน (เช่น เชื่อมอีเมล Google)
        // เพื่อดึงข้อมูลล่าสุดมาใส่ใน token โดยไม่ต้องให้ผู้ใช้ล็อกอินใหม่
        const result = await pool.query(
          "SELECT username, role, student_id, homeroom_classroom_id, subjects, email FROM users WHERE id = $1",
          [token.id]
        );
        if (result.rows[0]) {
          const u = result.rows[0];
          token.name = u.username;
          token.role = u.role;
          token.student_id = u.student_id;
          token.homeroom_classroom_id = u.homeroom_classroom_id;
          token.subjects = u.subjects;
          token.email = u.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).student_id = token.student_id;
        (session.user as any).homeroom_classroom_id = token.homeroom_classroom_id;
        (session.user as any).subjects = token.subjects;
        (session.user as any).email = token.email ?? session.user.email;
      }
      return session;
    }
  },
  pages: {
    signIn: '/', 
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
