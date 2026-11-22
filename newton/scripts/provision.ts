import { randomUUID } from "node:crypto";
import { hash, argon2id } from "argon2";
import { query } from "../src/lib/db";
import { allowLocalBootstrap } from "../src/lib/bootstrap";
async function main() {
  if ((await query("SELECT id FROM admin_users LIMIT 1")).length)
    throw new Error(
      "Administrator already provisioned. Use the admin security page.",
    );
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const minimum = allowLocalBootstrap(process.env) ? 8 : 16;
  if (
    !username ||
    !/^[a-zA-Z0-9_.-]{3,50}$/.test(username) ||
    !password ||
    password.length < minimum ||
    password.length > 128
  )
    throw new Error(
      `Provide a valid ADMIN_USERNAME and an ADMIN_PASSWORD of ${minimum}–128 characters through the environment. Production requires a strong unique password.`,
    );
  await query(
    "INSERT INTO admin_users(id,username,password_hash,role,must_change_password) VALUES ($1,$2,$3,$4,true)",
    [
      randomUUID(),
      username,
      await hash(password, {
        type: argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      }),
      "owner",
    ],
  );
  console.log(
    "Administrator provisioned; password change required on first login. Remove provisioning variables.",
  );
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
