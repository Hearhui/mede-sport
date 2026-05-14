"use client";

import React, { useState, useEffect } from "react";

type User = { id: number; email: string; name: string; role: string; isActive: boolean; createdAt: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPw, setChangingPw] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => { setUsers(d.users); setLoading(false); });
  }, []);

  async function changePassword(id: number) {
    if (!newPassword || newPassword.length < 6) { setPwMsg("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, newPassword }),
    });
    if (res.ok) {
      setPwMsg("เปลี่ยนรหัสผ่านเรียบร้อย");
      setTimeout(() => { setChangingPw(null); setNewPassword(""); setPwMsg(""); }, 1500);
    } else {
      const data = await res.json();
      setPwMsg(data.error || "เกิดข้อผิดพลาด");
    }
  }

  async function updateUser(id: number, data: Partial<User>) {
    await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    setUsers(users.map((u) => u.id === id ? { ...u, ...data } : u));
  }

  const roleLabels: Record<string, string> = { ADMIN: "ผู้ดูแลระบบ", MANAGER: "ผู้จัดการ", STAFF: "พนักงาน" };
  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700", MANAGER: "bg-blue-100 text-blue-700", STAFF: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">จัดการผู้ใช้งาน</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">ชื่อ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">อีเมล</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">บทบาท</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">สถานะ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">วันที่สมัคร</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">กำลังโหลด...</td></tr>}
            {users.map((u) => (
              <React.Fragment key={u.id}>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })}
                    className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${roleColors[u.role]}`}>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                    <option value="MANAGER">ผู้จัดการ</option>
                    <option value="STAFF">พนักงาน</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                    className={`text-xs px-3 py-1 rounded-full font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {u.isActive ? "ใช้งาน" : "ปิดการใช้งาน"}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("th-TH")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { setChangingPw(changingPw === u.id ? null : u.id); setNewPassword(""); setPwMsg(""); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    {changingPw === u.id ? "ยกเลิก" : "เปลี่ยนรหัส"}
                  </button>
                </td>
              </tr>
              {changingPw === u.id && (
                <tr className="bg-blue-50">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">รหัสผ่านใหม่สำหรับ {u.name}:</span>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-60" />
                      <button onClick={() => changePassword(u.id)}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        บันทึก
                      </button>
                      {pwMsg && <span className={`text-sm ${pwMsg.includes("เรียบร้อย") ? "text-green-600" : "text-red-500"}`}>{pwMsg}</span>}
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
