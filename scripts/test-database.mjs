import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const container = "menor-pg-test";
const root = process.cwd();

const sqlFiles = [
  "supabase/tests/bootstrap.sql",
  "supabase/migrations/20261013003000_foundation.sql",
  "supabase/migrations/20261013003100_seed_development_plans.sql",
  "supabase/migrations/20261013010000_business_profile.sql",
  "supabase/migrations/20261013020000_menu_management.sql",
  "supabase/migrations/20261013030000_public_menu.sql",
  "supabase/migrations/20261013040000_theme_editor.sql",
  "supabase/migrations/20261013050000_slug_redirects.sql",
  "supabase/migrations/20261013060000_plan_entitlements.sql",
  "supabase/migrations/20261013070000_paypal_payments.sql",
  "supabase/migrations/20261013080000_email_reminders.sql",
  "supabase/migrations/20261013090000_platform_admin.sql",
  "supabase/migrations/20261013100000_analytics_seo_domains.sql",
  "supabase/tests/rls.sql",
  "supabase/tests/business-profile.sql",
  "supabase/tests/menu-management.sql",
  "supabase/tests/public-menu.sql",
  "supabase/tests/theme-editor.sql",
  "supabase/tests/slug-redirects.sql",
  "supabase/tests/plan-entitlements.sql",
  "supabase/tests/paypal-payments.sql",
  "supabase/tests/email-reminders.sql",
  "supabase/tests/platform-admin.sql",
  "supabase/tests/analytics-domains.sql",
  "supabase/rollbacks/20261013100000_analytics_seo_domains.sql",
  "supabase/rollbacks/20261013090000_platform_admin.sql",
  "supabase/rollbacks/20261013080000_email_reminders.sql",
  "supabase/rollbacks/20261013070000_paypal_payments.sql",
  "supabase/rollbacks/20261013060000_plan_entitlements.sql",
  "supabase/rollbacks/20261013050000_slug_redirects.sql",
  "supabase/rollbacks/20261013040000_theme_editor.sql",
  "supabase/rollbacks/20261013030000_public_menu.sql",
  "supabase/rollbacks/20261013020000_menu_management.sql",
  "supabase/rollbacks/20261013010000_business_profile.sql",
  "supabase/rollbacks/20261013003100_seed_development_plans.sql",
  "supabase/rollbacks/20261013003000_foundation.sql",
  "supabase/tests/assert_rolled_back.sql",
];

function run(command, args, input, quiet = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      if (!quiet) {
        process.stdout.write(chunk);
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (!quiet) {
        process.stderr.write(chunk);
      }
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`${command} ${args.join(" ")} exited with ${code}\n${stderr}`),
      );
    });

    if (input) {
      child.stdin.end(input);
    } else {
      child.stdin.end();
    }
  });
}

async function waitForPostgres() {
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    try {
      await run("docker", [
        "exec",
        container,
        "pg_isready",
        "-U",
        "postgres",
        "-d",
        "menor",
      ]);
      return;
    } catch (error) {
      if (attempt === 40) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function psqlFile(relativePath) {
  const sql = await readFile(path.join(root, relativePath));
  process.stdout.write(`\n--- ${relativePath}\n`);
  await run(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "menor",
    ],
    sql,
  );
}

try {
  await run("docker", ["rm", "-f", container], undefined, true).catch(() => {});
  await run("docker", [
    "run",
    "-d",
    "--name",
    container,
    "-e",
    "POSTGRES_PASSWORD=postgres",
    "-e",
    "POSTGRES_DB=menor",
    "postgres:16-alpine",
  ]);
  await waitForPostgres();

  for (const file of sqlFiles) {
    await psqlFile(file);
  }

  process.stdout.write("\nDatabase checks passed.\n");
} finally {
  await run("docker", ["rm", "-f", container]).catch(() => {});
}
