export async function get(pathname: string, query?: object, token?: string) {
  const headers = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (query) {
    pathname += `?${Object.entries(query)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&")}`;
  }

  const resp = await fetch(pathname, {
    method: "GET",
    headers,
  });

  if (resp.status !== 200) {
    const message = await resp.text().catch(() => void 0);
    throw new Error(`${resp.status} ${resp.statusText}` + (message ? ` - ${message}` : ""));
  }
  return await resp.json();
}

export async function post(pathname: string, body?: object, token?: string) {
  const headers = {
    ContentType: "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(pathname, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
  });

  if (resp.status !== 200) {
    const message = await resp.text().catch(() => void 0);
    throw new Error(`${resp.status} ${resp.statusText}` + (message ? ` - ${message}` : ""));
  }
  return await resp.json();
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
