async function fetchDistinct(sistema, campo, filterField = null, filterValue = null) {
    let url = `${API_BASE_URL}/meta/${sistema}/distinct?campo=${campo}`;
    if (filterField && filterValue !== null && filterValue !== undefined) {
      url += `&filter_field=${filterField}&filter_value=${encodeURIComponent(filterValue)}`;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error (${response.status}): ${response.statusText} for URL ${url}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch distinct values:", error);
      // Consider user-facing error display here
      return []; // Return empty array on error to prevent further issues
    }
  }
  
  async function fetchInitialSistemas() {
    const url = `${API_BASE_URL}/meta/sistemas`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error (${response.status}): ${response.statusText} for URL ${url}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch initial sistemas:", error);
      return [];
    }
  }
  
  async function fetchSearchResults(searchBody, lite = false) {
    const url = `${API_BASE_URL}/search${lite ? "?lite=true" : ""}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchBody)
      });
      if (!response.ok) {
        const errorData = await response.text(); // Try to get more info for non-JSON errors
        throw new Error(`API Error (${response.status}): ${errorData || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch search results:", error);
      // Potentially display error to user
      return null; // Or an empty GeoJSON structure
    }
  }