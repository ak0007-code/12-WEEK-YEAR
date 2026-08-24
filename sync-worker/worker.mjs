import { buildRepositoryUpdate } from "./core.mjs";

const API_VERSION = "2026-03-10";
const SESSION_TTL = 60 * 60 * 24 * 30;

function cors(env) {
  return {
    "Access-Control-Allow-Origin": env.FRONTEND_URL.replace(/\/$/, ""),
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(env, value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors(env), "Content-Type": "application/json; charset=utf-8" }
  });
}

function randomToken(bytes = 32) {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...values)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function githubHeaders(token) {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "12-week-year-sync"
  };
}

async function github(token, path, init = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { ...githubHeaders(token), ...init.headers }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 300)}`);
  }
  return response.status === 204 ? null : response.json();
}

function decodeBase64(value) {
  const bytes = Uint8Array.from(atob(value.replaceAll("\n", "")), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function authenticate(request, env) {
  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  const sessionId = authorization.slice(7);
  const key = `session:${sessionId}`;
  const stored = await env.OAUTH_SESSIONS.get(key);
  if (!stored) return null;
  const session = JSON.parse(stored);
  if (session.expiresAt && session.refreshToken && Date.now() >= session.expiresAt - 60_000) {
    const refreshResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: session.refreshToken
      })
    });
    const refreshed = await refreshResponse.json();
    if (!refreshResponse.ok || !refreshed.access_token) {
      await env.OAUTH_SESSIONS.delete(key);
      return null;
    }
    session.token = refreshed.access_token;
    session.refreshToken = refreshed.refresh_token ?? session.refreshToken;
    session.expiresAt = Date.now() + refreshed.expires_in * 1000;
    await env.OAUTH_SESSIONS.put(key, JSON.stringify(session), { expirationTtl: SESSION_TTL });
  }
  return { sessionId, ...session };
}

async function startLogin(env) {
  const state = randomToken();
  const verifier = randomToken(48);
  await env.OAUTH_SESSIONS.put(`oauth:${state}`, verifier, { expirationTtl: 600 });
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.PUBLIC_BASE_URL.replace(/\/$/, "")}/auth/callback`,
    scope: "public_repo",
    state,
    code_challenge: await sha256Base64Url(verifier),
    code_challenge_method: "S256",
    allow_signup: "false"
  });
  return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 302);
}

async function finishLogin(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const verifier = state && await env.OAUTH_SESSIONS.get(`oauth:${state}`);
  if (!state || !code || !verifier) return new Response("Invalid or expired OAuth state", { status: 400 });
  await env.OAUTH_SESSIONS.delete(`oauth:${state}`);

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${env.PUBLIC_BASE_URL.replace(/\/$/, "")}/auth/callback`,
      code_verifier: verifier
    })
  });
  const tokenResult = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenResult.access_token) return new Response("GitHub authorization failed", { status: 401 });

  const user = await github(tokenResult.access_token, "/user");
  if (user.login !== env.ALLOWED_LOGIN) return new Response("This GitHub account is not allowed", { status: 403 });

  const sessionId = randomToken(48);
  await env.OAUTH_SESSIONS.put(
    `session:${sessionId}`,
    JSON.stringify({
      token: tokenResult.access_token,
      refreshToken: tokenResult.refresh_token,
      expiresAt: tokenResult.expires_in ? Date.now() + tokenResult.expires_in * 1000 : null,
      login: user.login
    }),
    { expirationTtl: SESSION_TTL }
  );
  return Response.redirect(`${env.FRONTEND_URL.replace(/\/$/, "")}/#session=${encodeURIComponent(sessionId)}`, 302);
}

async function syncRepository(session, payload, env) {
  if (!Number.isInteger(payload?.week) || !payload.state) throw new TypeError("invalid sync payload");
  const owner = env.REPO_OWNER;
  const repo = env.REPO_NAME;
  const branch = env.REPO_BRANCH || "main";
  const planPath = `plans/week-${String(payload.week).padStart(2, "0")}.json`;
  const base = `/repos/${owner}/${repo}`;

  const ref = await github(session.token, `${base}/git/ref/heads/${branch}`);
  const headSha = ref.object.sha;
  const [commit, readmeFile, planFile] = await Promise.all([
    github(session.token, `${base}/git/commits/${headSha}`),
    github(session.token, `${base}/contents/README.md?ref=${headSha}`),
    github(session.token, `${base}/contents/${planPath}?ref=${headSha}`)
  ]);
  const readme = decodeBase64(readmeFile.content);
  const planText = decodeBase64(planFile.content);
  const plan = JSON.parse(planText);
  if (plan.week !== payload.week || plan.status !== "active") throw new TypeError("only the active week can be synced");

  const updated = buildRepositoryUpdate(readme, plan, payload.state);
  if (updated.readme === readme && updated.plan === planText) return { changed: false, commit: headSha };

  const [readmeBlob, planBlob] = await Promise.all([
    github(session.token, `${base}/git/blobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: updated.readme, encoding: "utf-8" })
    }),
    github(session.token, `${base}/git/blobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: updated.plan, encoding: "utf-8" })
    })
  ]);
  const tree = await github(session.token, `${base}/git/trees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base_tree: commit.tree.sha,
      tree: [
        { path: "README.md", mode: "100644", type: "blob", sha: readmeBlob.sha },
        { path: planPath, mode: "100644", type: "blob", sha: planBlob.sha }
      ]
    })
  });
  const nextCommit = await github(session.token, `${base}/git/commits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Update Week ${payload.week} checklist`,
      tree: tree.sha,
      parents: [headSha]
    })
  });
  await github(session.token, `${base}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: nextCommit.sha, force: false })
  });
  return { changed: true, commit: nextCommit.sha };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(env) });
    if (request.method === "GET" && url.pathname === "/auth/login") return startLogin(env);
    if (request.method === "GET" && url.pathname === "/auth/callback") return finishLogin(request, env);

    const session = await authenticate(request, env);
    if (request.method === "GET" && url.pathname === "/api/status") {
      return session ? json(env, { connected: true, login: session.login }) : json(env, { connected: false }, 401);
    }
    if (request.method === "POST" && url.pathname === "/api/logout") {
      if (session) await env.OAUTH_SESSIONS.delete(`session:${session.sessionId}`);
      return json(env, { connected: false });
    }
    if (request.method === "POST" && url.pathname === "/api/sync") {
      if (!session) return json(env, { error: "GitHub connection required" }, 401);
      try {
        return json(env, await syncRepository(session, await request.json(), env));
      } catch (error) {
        const status = error instanceof TypeError ? 400 : 409;
        return json(env, { error: error.message }, status);
      }
    }
    return json(env, { error: "Not found" }, 404);
  }
};
