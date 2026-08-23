export type Role = "student" | "admin";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: Role;
  created_at: string;
};
