#!/usr/bin/env python3
"""
NISMSTUDY — one-shot PocketBase setup.

Creates every collection with its access rules, then seeds courses and sample
questions. Safe to re-run: collections and seed rows are dropped and rebuilt.

    export PB_URL=http://127.0.0.1:8090
    export PB_EMAIL=you@example.com
    export PB_PASSWORD=your-superuser-password
    python3 setup.py

Create the superuser first:
    ./pocketbase superuser upsert you@example.com your-password
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get("PB_URL", "http://127.0.0.1:8090").rstrip("/")
EMAIL = os.environ.get("PB_EMAIL", "")
PASSWORD = os.environ.get("PB_PASSWORD", "")

if not EMAIL or not PASSWORD:
    sys.exit("Set PB_EMAIL and PB_PASSWORD (the PocketBase superuser).")

TOKEN = None


def call(method, path, payload=None, auth=True):
    headers = {"Content-Type": "application/json"}
    if auth and TOKEN:
        headers["Authorization"] = TOKEN
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read() or "{}")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"FAIL {method} {path}\n{e.read().decode()}")


TOKEN = call("POST", "/api/collections/_superusers/auth-with-password",
             {"identity": EMAIL, "password": PASSWORD}, auth=False)["token"]
print("authenticated as superuser")


def drop(name):
    try:
        cid = call("GET", f"/api/collections/{name}")["id"]
        call("DELETE", f"/api/collections/{cid}")
        print("  dropped", name)
    except SystemExit:
        pass


# dependency order matters on the way down as well as up
for n in ["mock_attempts", "payment_records", "quizzes", "exam_access",
          "home_support_content", "courses"]:
    drop(n)

# --- users: profile fields + passwordless OTP login -------------------------
users = call("GET", "/api/collections/users")
have = {f["name"] for f in users["fields"]}
for f in [{"name": "full_name", "type": "text"},
          {"name": "mobile", "type": "text"},
          {"name": "role", "type": "select", "maxSelect": 1,
           "values": ["student", "admin", "super_admin"]}]:
    if f["name"] not in have:
        users["fields"].append(f)
users["otp"] = {"enabled": True, "duration": 900, "length": 8}
call("PATCH", f"/api/collections/{users['id']}", users)
users_id = users["id"]
print("users: profile fields added, OTP login enabled")

# PocketBase >= 0.23 does NOT create `created`/`updated` automatically.
# Every sort in app-pb.js references them, so they must be declared.
AUTODATE = [
    {"name": "created", "type": "autodate", "onCreate": True, "onUpdate": False},
    {"name": "updated", "type": "autodate", "onCreate": True, "onUpdate": True},
]


def rel(name, cid):
    return {"name": name, "type": "relation", "required": True,
            "collectionId": cid, "maxSelect": 1, "cascadeDelete": True}


OWN = "user = @request.auth.id"

courses_id = call("POST", "/api/collections", {
    "name": "courses", "type": "base",
    "fields": [
        {"name": "title", "type": "text"},
        {"name": "exam_name", "type": "text"},
        {"name": "description", "type": "text"},
        {"name": "price", "type": "text"},
        {"name": "payment_url", "type": "text"},
        {"name": "mock_duration_days", "type": "number"},
        {"name": "display_order", "type": "number"},
        {"name": "is_published", "type": "bool"},
    ] + AUTODATE,
    # public may read published courses; writing is superuser-only (admin UI)
    "listRule": "is_published = true", "viewRule": "is_published = true",
    "createRule": None, "updateRule": None, "deleteRule": None,
})["id"]
print("courses created")

call("POST", "/api/collections", {
    "name": "exam_access", "type": "base",
    "fields": [rel("user", users_id), rel("course", courses_id),
               {"name": "access_from", "type": "date"},
               {"name": "access_until", "type": "date"},
               {"name": "payment_ref", "type": "text"}] + AUTODATE,
    "listRule": OWN, "viewRule": OWN,
    # The browser grants access after payment, so a student must be able to
    # write their own row. See README — this is the known tradeoff.
    "createRule": OWN, "updateRule": OWN, "deleteRule": None,
    "indexes": ["CREATE UNIQUE INDEX idx_access_user_course ON exam_access (user, course)"],
})
print("exam_access created")

# Quizzes are readable ONLY by a student holding unexpired access to that course.
# ?= / ?> (any-of) are REQUIRED: with plain = the joined access rows are matched
# all-of, so a student owning two courses sees nothing. Verified non-leaking —
# valid access to A plus expired access to B exposes only A.
QUIZ_RULE = ("is_active = true"
             " && @collection.exam_access.user ?= @request.auth.id"
             " && @collection.exam_access.course ?= course"
             " && @collection.exam_access.access_until ?> @now")

call("POST", "/api/collections", {
    "name": "quizzes", "type": "base",
    "fields": [rel("course", courses_id),
               {"name": "question_text", "type": "text", "required": True},
               {"name": "option_a", "type": "text"},
               {"name": "option_b", "type": "text"},
               {"name": "option_c", "type": "text"},
               {"name": "option_d", "type": "text"},
               {"name": "correct_option", "type": "select", "maxSelect": 1,
                "values": ["A", "B", "C", "D"]},
               {"name": "explanation", "type": "text"},
               {"name": "is_active", "type": "bool"},
               {"name": "display_order", "type": "number"}] + AUTODATE,
    "listRule": QUIZ_RULE, "viewRule": QUIZ_RULE,
    "createRule": None, "updateRule": None, "deleteRule": None,
})
print("quizzes created (access-gated)")

call("POST", "/api/collections", {
    "name": "payment_records", "type": "base",
    "fields": [rel("user", users_id), rel("course", courses_id),
               {"name": "payment_ref", "type": "text"},
               {"name": "amount_label", "type": "text"},
               {"name": "status", "type": "text"},
               {"name": "raw_payload", "type": "json", "maxSize": 100000}] + AUTODATE,
    "listRule": OWN, "viewRule": OWN, "createRule": OWN,
    "updateRule": None, "deleteRule": None,
    "indexes": ["CREATE UNIQUE INDEX idx_payment_ref ON payment_records (payment_ref)"],
})
print("payment_records created")

call("POST", "/api/collections", {
    "name": "mock_attempts", "type": "base",
    "fields": [rel("user", users_id), rel("course", courses_id),
               {"name": "score", "type": "number"},
               {"name": "total_questions", "type": "number"},
               {"name": "answers", "type": "json", "maxSize": 200000}] + AUTODATE,
    "listRule": OWN, "viewRule": OWN, "createRule": OWN,
    "updateRule": None, "deleteRule": None,
})
print("mock_attempts created")

call("POST", "/api/collections", {
    "name": "home_support_content", "type": "base",
    "fields": [{"name": "title", "type": "text"},
               {"name": "body", "type": "text"},
               {"name": "is_active", "type": "bool"}] + AUTODATE,
    "listRule": "is_active = true", "viewRule": "is_active = true",
    "createRule": None, "updateRule": None, "deleteRule": None,
})
print("home_support_content created")

# --- seed -------------------------------------------------------------------
seed_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed.json")
if not os.path.exists(seed_path):
    print("\nno seed.json found — collections are ready but empty")
    raise SystemExit(0)

seed = json.load(open(seed_path))
nq = 0
for c in seed["courses"]:
    rec = call("POST", "/api/collections/courses/records", {
        "title": c["name"], "exam_name": c["name"], "description": c["description"],
        "price": "329", "mock_duration_days": 15,
        "display_order": c["order"], "is_published": True,
    })
    for i, q in enumerate(c["questions"], start=1):
        call("POST", "/api/collections/quizzes/records", {
            "course": rec["id"], "question_text": q[0],
            "option_a": q[1], "option_b": q[2], "option_c": q[3], "option_d": q[4],
            "correct_option": q[5], "explanation": q[6],
            "is_active": True, "display_order": i,
        })
        nq += 1

call("POST", "/api/collections/home_support_content/records", seed["support"])
print(f"\nseeded {len(seed['courses'])} courses, {nq} questions")
print("DONE — open the admin UI at", BASE + "/_/")
