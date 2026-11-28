const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const apiRequest = async (path, options = {}) => {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error("Unable to connect to the server. Please try again.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message || `Request failed with status ${response.status}`,
    );

    error.status = response.status;
    error.details = data?.errors ?? null;

    throw error;
  }

  return data;
};
