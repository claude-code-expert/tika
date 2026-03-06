export const fetcher = <T>(url: string): Promise<T> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`fetch error: ${r.status}`);
    return r.json();
  });
