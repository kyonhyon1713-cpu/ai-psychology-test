import "server-only";

const RESULT_CARD_TTL_SECONDS = 24 * 60 * 60;
const RESULT_CARD_KEY_PREFIX = "result-card:";

interface CloudflareKvConfig {
  accountId: string;
  apiToken: string;
  namespaceId: string;
}

function getConfig(): CloudflareKvConfig | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

  if (!accountId || !apiToken || !namespaceId) {
    return null;
  }

  return { accountId, apiToken, namespaceId };
}

function getValueUrl(config: CloudflareKvConfig, id: string) {
  const key = encodeURIComponent(`${RESULT_CARD_KEY_PREFIX}${id}`);

  return `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/kv/namespaces/${config.namespaceId}/values/${key}`;
}

export function hasResultCardStorageConfig() {
  return getConfig() !== null;
}

export async function storeResultCard(id: string, image: ArrayBuffer) {
  const config = getConfig();

  if (!config) {
    throw new Error("Result card storage is not configured");
  }

  const url = new URL(getValueUrl(config, id));
  url.searchParams.set("expiration_ttl", String(RESULT_CARD_TTL_SECONDS));

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: image,
  });

  if (!response.ok) {
    console.error("Cloudflare KV result card write failed", {
      status: response.status,
      requestId: response.headers.get("cf-ray") ?? "unknown",
    });

    throw new Error("Result card write failed");
  }
}

export async function readResultCard(id: string) {
  const config = getConfig();

  if (!config) {
    throw new Error("Result card storage is not configured");
  }

  const response = await fetch(getValueUrl(config, id), {
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    console.error("Cloudflare KV result card read failed", {
      status: response.status,
      requestId: response.headers.get("cf-ray") ?? "unknown",
    });

    throw new Error("Result card read failed");
  }

  return response.arrayBuffer();
}

export const resultCardLifetimeSeconds = RESULT_CARD_TTL_SECONDS;

export function isValidResultCardId(id: string) {
  return /^[A-Za-z0-9_-]{24}$/.test(id);
}
