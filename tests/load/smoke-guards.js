import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.LOAD_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const sleepSeconds = Math.max(0, Number(__ENV.LOAD_SLEEP_MS || "250") / 1000);
const guardedStatuses = http.expectedStatuses(401);
const publicStatuses = http.expectedStatuses(200);

export const options = {
  scenarios: {
    api_guard_smoke: {
      executor: "constant-vus",
      vus: Number(__ENV.LOAD_VUS || 6),
      duration: __ENV.LOAD_DURATION || "20s",
      gracefulStop: "3s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
    "http_req_duration{kind:guarded}": ["p(95)<800"],
    "http_req_duration{kind:public}": ["p(95)<700"],
    checks: ["rate>0.99"],
  },
};

export default function () {
  const responses = http.batch([
    {
      method: "GET",
      url: `${baseUrl}/api/cart`,
      params: {
        responseCallback: guardedStatuses,
        tags: { endpoint: "cart_get", kind: "guarded" },
      },
    },
    {
      method: "POST",
      url: `${baseUrl}/api/cart/items`,
      body: JSON.stringify({ bookId: 1, quantity: 1 }),
      params: {
        headers: { "Content-Type": "application/json" },
        responseCallback: guardedStatuses,
        tags: { endpoint: "cart_add", kind: "guarded" },
      },
    },
    {
      method: "POST",
      url: `${baseUrl}/api/checkout/order`,
      body: JSON.stringify({ city: "Київ", street: "Хрещатик", house: "1", paymentMethod: "Готівка" }),
      params: {
        headers: { "Content-Type": "application/json" },
        responseCallback: guardedStatuses,
        tags: { endpoint: "checkout_order", kind: "guarded" },
      },
    },
    {
      method: "GET",
      url: `${baseUrl}/api/admin/users`,
      params: {
        responseCallback: guardedStatuses,
        tags: { endpoint: "admin_users", kind: "guarded" },
      },
    },
    {
      method: "GET",
      url: `${baseUrl}/api/search/suggestions?q=книга&limit=5`,
      params: {
        responseCallback: publicStatuses,
        tags: { endpoint: "search_suggestions", kind: "public" },
      },
    },
  ]);

  check(responses[0], {
    "GET /api/cart returns 401": (response) => response.status === 401,
  });

  check(responses[1], {
    "POST /api/cart/items returns 401": (response) => response.status === 401,
  });

  check(responses[2], {
    "POST /api/checkout/order returns 401": (response) => response.status === 401,
  });

  check(responses[3], {
    "GET /api/admin/users returns 401": (response) => response.status === 401,
  });

  check(responses[4], {
    "GET /api/search/suggestions returns 200": (response) => response.status === 200,
  });

  sleep(sleepSeconds);
}
