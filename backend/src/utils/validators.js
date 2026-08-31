export const isValidUrl = (longUrl) => {
  try {
    const parsed = new URL(longUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidAlias = (alias) => {
  const ALIAS_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
  return ALIAS_REGEX.test(alias);
};

// Why these two checks specifically:

// isValidUrl uses Node's built-in URL class instead of a hand-rolled regex — it's more reliable and it's already available, no extra package needed. Checking the protocol matters because otherwise someone could pass javascript:alert(1) or ftp://... and your redirect would happily send users there.
// isValidAlias restricts custom aliases to alphanumeric + hyphen/underscore, 3–20 characters. This prevents someone from submitting an alias with slashes, spaces, or emoji that would break your URL structure or look broken in a shared link.