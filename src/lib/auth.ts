import "server-only";

export function assertAdminPassword(value: unknown) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return;
  if (value !== expected) {
    throw new Error("관리자 비밀번호가 올바르지 않습니다.");
  }
}
