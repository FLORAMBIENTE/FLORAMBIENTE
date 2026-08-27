const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
};

const BLOCKED_TERMS = [
  "cazzo", "merda", "vaffanculo", "stronzo", "stronza", "idiota"
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function normalizeText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function containsBlockedLanguage(text) {
  const normalized = text.toLocaleLowerCase("it-IT");
  return BLOCKED_TERMS.some(term => normalized.includes(term));
}

function isAuthorized(request, env) {
  const configuredToken = env.REVIEWS_ADMIN_TOKEN;
  if (!configuredToken) return false;
  return request.headers.get("Authorization") === `Bearer ${configuredToken}`;
}

async function listApproved(env) {
  const result = await env.REVIEWS_DB.prepare(
    `SELECT id, name, rating, review, approved_at
     FROM reviews
     WHERE status = 'approved'
     ORDER BY approved_at DESC, id DESC
     LIMIT 100`
  ).all();
  return json({ reviews: result.results || [] });
}

async function submitReview(request, env) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return json({ error: "Formato della richiesta non valido." }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Dati non validi." }, 400);
  }

  const name = normalizeText(body.name, 60);
  const review = normalizeText(body.review, 600);
  const rating = Number(body.rating);

  if (name.length < 2 || review.length < 20 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: "Controlla nome, valutazione e testo della recensione." }, 400);
  }

  if (containsBlockedLanguage(`${name} ${review}`)) {
    return json({ error: "Il testo contiene espressioni inappropriate. Modificalo e riprova." }, 400);
  }

  await env.REVIEWS_DB.prepare(
    `INSERT INTO reviews (name, rating, review, status)
     VALUES (?, ?, ?, 'pending')`
  ).bind(name, rating, review).run();

  return json({ ok: true, status: "pending" }, 201);
}

async function listAdminReviews(request, env) {
  if (!isAuthorized(request, env)) return json({ error: "Accesso non autorizzato." }, 401);

  const url = new URL(request.url);
  const requestedStatus = url.searchParams.get("status") || "pending";
  const allowed = new Set(["pending", "approved", "rejected", "all"]);
  const status = allowed.has(requestedStatus) ? requestedStatus : "pending";

  const query = status === "all"
    ? `SELECT id, name, rating, review, status, created_at, approved_at FROM reviews ORDER BY id DESC LIMIT 250`
    : `SELECT id, name, rating, review, status, created_at, approved_at FROM reviews WHERE status = ? ORDER BY id DESC LIMIT 250`;

  const result = status === "all"
    ? await env.REVIEWS_DB.prepare(query).all()
    : await env.REVIEWS_DB.prepare(query).bind(status).all();

  return json({ reviews: result.results || [] });
}

async function moderateReview(request, env, id) {
  if (!isAuthorized(request, env)) return json({ error: "Accesso non autorizzato." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Dati non validi." }, 400);
  }

  const action = body.action;
  if (!Number.isInteger(id) || id < 1 || !["approve", "reject"].includes(action)) {
    return json({ error: "Operazione non valida." }, 400);
  }

  if (action === "approve") {
    await env.REVIEWS_DB.prepare(
      `UPDATE reviews SET status = 'approved', approved_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(id).run();
  } else {
    await env.REVIEWS_DB.prepare(
      `UPDATE reviews SET status = 'rejected', approved_at = NULL WHERE id = ?`
    ).bind(id).run();
  }

  return json({ ok: true, status: action === "approve" ? "approved" : "rejected" });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/reviews" && request.method === "GET") {
        return await listApproved(env);
      }

      if (url.pathname === "/api/reviews" && request.method === "POST") {
        return await submitReview(request, env);
      }

      if (url.pathname === "/api/admin/reviews" && request.method === "GET") {
        return await listAdminReviews(request, env);
      }

      const moderationMatch = url.pathname.match(/^\/api\/admin\/reviews\/(\d+)$/);
      if (moderationMatch && request.method === "PATCH") {
        return await moderateReview(request, env, Number(moderationMatch[1]));
      }

      if (url.pathname.startsWith("/api/")) {
        return json({ error: "Risorsa non trovata." }, 404);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Reviews API error", error);
      return json({ error: "Servizio temporaneamente non disponibile." }, 500);
    }
  }
};
