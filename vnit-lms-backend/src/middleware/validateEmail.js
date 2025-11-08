export const emailAllowed = (email, role) => {
  if (role === "student") return /@students\.vnit\.ac\.in$/i.test(email);

  if (role === "professor") {
    const match = email.match(/@([a-z]+)\.vnit\.ac\.in$/i);
    if (!match) return false;

    const dept = match[1].toLowerCase();
    const allowed = (process.env.ALLOWED_DEPARTMENTS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase());

    return allowed.includes(dept);
  }

  if (role === "admin") return false; // always manual creation

  return false;
};
