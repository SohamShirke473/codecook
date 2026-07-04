export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "CodeCook API",
    version: "0.1.0",
    description: "LeetCode-style backend with code execution via Piston, BullMQ queues, Redis leaderboard, and PostgreSQL + Drizzle ORM.",
  },
  servers: [
    { url: "https://codecookapi.shirkesoham.tech", description: "Production" },
    { url: "http://localhost:8080", description: "Development" },
  ],
  paths: {
    "/health": { get: { summary: "Health check", tags: ["Health"], responses: { "200": { description: "All services healthy" }, "503": { description: "Degraded" } } } },

    "/api/v1/auth/register": { post: { summary: "Register a new user", tags: ["Auth"], requestBody: { content: { "application/json": { schema: { type: "object", properties: { email: { type: "string", format: "email" }, password: { type: "string", minLength: 6 }, name: { type: "string" } }, required: ["email", "password"] } } } }, responses: { "201": { description: "User registered" }, "400": { description: "Validation error / user exists" } } } },
    "/api/v1/auth/login": { post: { summary: "Login", tags: ["Auth"], requestBody: { content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email", "password"] } } } }, responses: { "200": { description: "Login successful (sets JWT cookie)" }, "401": { description: "Invalid credentials" } } } },
    "/api/v1/auth/logout": { post: { summary: "Logout (clears both cookies, invalidates refresh token)", tags: ["Auth"], responses: { "200": { description: "Logged out" } } } },
    "/api/v1/auth/refresh": { post: { summary: "Refresh access token using refresh cookie (rotation)", tags: ["Auth"], responses: { "200": { description: "New tokens issued" }, "401": { description: "Invalid/expired refresh token" } } } },
    "/api/v1/auth/check": { get: { summary: "Check current auth status", tags: ["Auth"], security: [{ cookieAuth: [] }], responses: { "200": { description: "Authenticated" }, "401": { description: "Unauthorized" } } } },

    "/api/v1/problems": { get: { summary: "List problems (paginated, filterable)", tags: ["Problems"], parameters: [
      { in: "query", name: "page", schema: { type: "integer", default: 1 } },
      { in: "query", name: "limit", schema: { type: "integer", default: 20 } },
      { in: "query", name: "difficulty", schema: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] } },
      { in: "query", name: "tag", schema: { type: "string" } },
      { in: "query", name: "search", schema: { type: "string", description: "Full-text search on title + description" } },
    ], responses: { "200": { description: "Paginated problem list" } } },
      post: { summary: "Create a problem (admin only)", tags: ["Problems"], security: [{ cookieAuth: [] }], responses: { "201": { description: "Problem created" }, "403": { description: "Not admin" } } } },
    "/api/v1/problems/{id}": { get: { summary: "Get problem by ID", tags: ["Problems"], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Problem detail" }, "404": { description: "Not found" } } },
      put: { summary: "Update problem (admin only)", tags: ["Problems"], security: [{ cookieAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Updated" }, "403": { description: "Not admin" } } },
      delete: { summary: "Delete problem (admin only)", tags: ["Problems"], security: [{ cookieAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Deleted" }, "403": { description: "Not admin" } } } },

    "/api/v1/submissions": { post: { summary: "Submit code for a problem (queues via BullMQ)", tags: ["Submissions"], security: [{ cookieAuth: [] }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { problemId: { type: "string", format: "uuid" }, sourceCode: { type: "string" }, language: { type: "string" }, languageVersion: { type: "string" } }, required: ["problemId", "sourceCode", "language", "languageVersion"] } } } }, responses: { "201": { description: "Queued (PENDING)" } } },
      get: { summary: "List user's submissions", tags: ["Submissions"], security: [{ cookieAuth: [] }], parameters: [{ in: "query", name: "page", schema: { type: "integer", default: 1 } }, { in: "query", name: "limit", schema: { type: "integer", default: 20 } }], responses: { "200": { description: "Paginated submissions" } } } },
    "/api/v1/submissions/{id}": { get: { summary: "Get submission with test case results", tags: ["Submissions"], security: [{ cookieAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Submission with results" }, "404": { description: "Not found" } } } },

    "/api/v1/playlists": { get: { summary: "List user's playlists (with problem count)", tags: ["Playlists"], security: [{ cookieAuth: [] }], responses: { "200": { description: "Playlist list" } } },
      post: { summary: "Create a playlist", tags: ["Playlists"], security: [{ cookieAuth: [] }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name"] } } } }, responses: { "201": { description: "Created" } } } },
    "/api/v1/playlists/{id}": { get: { summary: "Get playlist with problems", tags: ["Playlists"], security: [{ cookieAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Playlist with problems" } } },
      put: { summary: "Update playlist", tags: ["Playlists"], security: [{ cookieAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete playlist", tags: ["Playlists"], security: [{ cookieAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Deleted" } } } },
    "/api/v1/playlists/{id}/problems": { post: { summary: "Add problem to playlist", tags: ["Playlists"], security: [{ cookieAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { problemId: { type: "string", format: "uuid" } }, required: ["problemId"] } } } }, responses: { "201": { description: "Added" } } } },
    "/api/v1/playlists/{id}/problems/{problemId}": { delete: { summary: "Remove problem from playlist", tags: ["Playlists"], security: [{ cookieAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }, { in: "path", name: "problemId", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Removed" } } } },

    "/api/v1/leaderboard": { get: { summary: "Global leaderboard (top users by problems solved)", tags: ["Leaderboard"], parameters: [{ in: "query", name: "limit", schema: { type: "integer", default: 20 } }], responses: { "200": { description: "Ranked list" } } } },
    "/api/v1/leaderboard/me": { get: { summary: "Current user's rank and score", tags: ["Leaderboard"], security: [{ cookieAuth: [] }], responses: { "200": { description: "User rank" } } } },

    "/api/v1/admin/stats": { get: { summary: "Dashboard statistics (admin only)", tags: ["Admin"], security: [{ cookieAuth: [] }], responses: { "200": { description: "Stats" }, "403": { description: "Not admin" } } } },
    "/api/v1/admin/users": { get: { summary: "List all users (admin only)", tags: ["Admin"], security: [{ cookieAuth: [] }], parameters: [{ in: "query", name: "page", schema: { type: "integer", default: 1 } }, { in: "query", name: "limit", schema: { type: "integer", default: 20 } }], responses: { "200": { description: "Paginated user list" }, "403": { description: "Not admin" } } } },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "jwt" },
    },
  },
};
