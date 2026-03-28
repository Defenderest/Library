import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.LOAD_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const sleepSeconds = Math.max(0, Number(__ENV.LOAD_SLEEP_MS || "250") / 1000);

const queries = ["книга", "історія", "роман", "дизайн", "clean code", "prisma", "архітектура"];

export const options = {
  scenarios: {
    public_read_smoke: {
      executor: "constant-vus",
      vus: Number(__ENV.LOAD_VUS || 6),
      duration: __ENV.LOAD_DURATION || "20s",
      gracefulStop: "3s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1200"],
    "http_req_duration{kind:page}": ["p(95)<1500"],
    "http_req_duration{kind:api}": ["p(95)<800"],
    checks: ["rate>0.99"],
  },
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function hasJsonContentType(response) {
  const contentType = response.headers["Content-Type"] || "";
  return String(contentType).toLowerCase().includes("application/json");
}

export default function () {
  const query = encodeURIComponent(randomItem(queries));
  const randomPage = 1 + Math.floor(Math.random() * 2);

  const responses = http.batch([
    {
      method: "GET",
      url: `${baseUrl}/`,
      params: { tags: { endpoint: "home", kind: "page" } },
    },
    {
      method: "GET",
      url: `${baseUrl}/books?page=${randomPage}&q=${query}`,
      params: { tags: { endpoint: "books", kind: "page" } },
    },
    {
      method: "GET",
      url: `${baseUrl}/authors`,
      params: { tags: { endpoint: "authors", kind: "page" } },
    },
    {
      method: "GET",
      url: `${baseUrl}/api/search/suggestions?q=${query}&limit=8`,
      params: { tags: { endpoint: "search_suggestions", kind: "api" } },
    },
    {
      method: "GET",
      url: `${baseUrl}/api/bootstrap/session`,
      params: { tags: { endpoint: "bootstrap_session", kind: "api" } },
    },
  ]);

  check(responses[0], {
    "home: status 200": (response) => response.status === 200,
  });

  check(responses[1], {
    "books: status 200": (response) => response.status === 200,
  });

  check(responses[2], {
    "authors: status 200": (response) => response.status === 200,
  });

  check(responses[3], {
    "search suggestions: status 200": (response) => response.status === 200,
    "search suggestions: returns json payload": (response) => hasJsonContentType(response),
  });

  check(responses[4], {
    "bootstrap session: status 200": (response) => response.status === 200,
    "bootstrap session: returns json payload": (response) => hasJsonContentType(response),
  });

  sleep(sleepSeconds);
}
