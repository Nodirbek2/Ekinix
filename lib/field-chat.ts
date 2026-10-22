export function validFieldConversation(
  value: unknown,
): value is { role: "user" | "assistant"; content: string }[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 8 &&
    value.at(-1)?.role === "user" &&
    value.every(
      (m) =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0 &&
        m.content.length <= (m.role === "user" ? 1200 : 1800),
    )
  );
}
