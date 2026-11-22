export function allowLocalBootstrap(env: Record<string, string | undefined>) {
  return (
    env.LOCAL_BOOTSTRAP === "true" &&
    env.LOCAL_DATABASE === "true" &&
    !env.DATABASE_URL &&
    env.NODE_ENV !== "production"
  );
}
