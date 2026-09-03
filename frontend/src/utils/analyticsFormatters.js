// Utility helpers for Analytics: Country Flags, Country Names, Referrers, and Device Parsing

const COUNTRY_NAMES = {
  US: "United States",
  IN: "India",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  JP: "Japan",
  BR: "Brazil",
  SG: "Singapore",
  CN: "China",
  NL: "Netherlands",
  ES: "Spain",
  IT: "Italy",
  MX: "Mexico",
  RU: "Russia",
  KR: "South Korea",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  ID: "Indonesia",
  ZA: "South Africa",
  NG: "Nigeria",
  PK: "Pakistan",
  TR: "Turkey",
  EG: "Egypt",
  SE: "Sweden",
  PL: "Poland",
  CH: "Switzerland",
  IE: "Ireland",
  NZ: "New Zealand",
  PH: "Philippines",
  VN: "Vietnam",
  TH: "Thailand",
  MY: "Malaysia",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  IL: "Israel",
  UA: "Ukraine",
  RO: "Romania",
  CZ: "Czech Republic",
  GR: "Greece",
  PT: "Portugal",
  AT: "Austria",
  BE: "Belgium",
  DK: "Denmark",
  FI: "Finland",
  NO: "Norway",
  HK: "Hong Kong",
  TW: "Taiwan",
  BD: "Bangladesh",
  KE: "Kenya",
};

/**
 * Returns a flag emoji for an ISO2 country code.
 * Falls back to 🌐 for unknown or invalid codes.
 */
export function getCountryFlag(code) {
  if (!code || typeof code !== "string") return "🌐";
  const upper = code.trim().toUpperCase();
  if (upper === "UNKNOWN" || upper.length !== 2) return "🌐";

  try {
    const codePoints = upper
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

/**
 * Returns human-readable country name from ISO2 or input string
 */
export function getCountryName(code) {
  if (!code || typeof code !== "string") return "Unknown Country";
  const upper = code.trim().toUpperCase();
  if (upper === "UNKNOWN") return "Unknown Country";
  return COUNTRY_NAMES[upper] || code;
}

/**
 * Parses and beautifies a referrer string
 */
export function getReferrerDetails(referrer) {
  if (!referrer || referrer === "direct" || referrer === "unknown") {
    return {
      displayName: "Direct / Bookmark / QR",
      domain: "direct",
      isDirect: true,
      category: "Direct",
    };
  }

  try {
    let urlStr = referrer;
    if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
      urlStr = "https://" + urlStr;
    }
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (host.includes("twitter.com") || host === "t.co" || host === "x.com") {
      return { displayName: "Twitter / X", domain: host, isDirect: false, category: "Social" };
    }
    if (host.includes("linkedin.com") || host === "lnkd.in") {
      return { displayName: "LinkedIn", domain: host, isDirect: false, category: "Professional" };
    }
    if (host.includes("google.")) {
      return { displayName: "Google Search", domain: host, isDirect: false, category: "Search" };
    }
    if (host.includes("github.com")) {
      return { displayName: "GitHub", domain: host, isDirect: false, category: "Developer" };
    }
    if (host.includes("reddit.com") || host === "redd.it") {
      return { displayName: "Reddit", domain: host, isDirect: false, category: "Social" };
    }
    if (host.includes("youtube.com") || host === "youtu.be") {
      return { displayName: "YouTube", domain: host, isDirect: false, category: "Video" };
    }
    if (host.includes("facebook.com") || host === "fb.com") {
      return { displayName: "Facebook", domain: host, isDirect: false, category: "Social" };
    }
    if (host.includes("instagram.com")) {
      return { displayName: "Instagram", domain: host, isDirect: false, category: "Social" };
    }
    if (host.includes("localhost") || host === "127.0.0.1") {
      return { displayName: "Localhost (Dev)", domain: host, isDirect: false, category: "Internal" };
    }

    return { displayName: host, domain: host, isDirect: false, category: "Web" };
  } catch {
    return { displayName: referrer, domain: referrer, isDirect: false, category: "Web" };
  }
}

/**
 * Parses user agent to detect Device Type, Operating System, and Browser
 */
export function getDeviceDetails(uaString) {
  if (!uaString || uaString === "unknown") {
    return {
      type: "Desktop",
      os: "Unknown OS",
      browser: "Unknown Browser",
      label: "Desktop / Direct",
      deviceCategory: "desktop",
    };
  }

  const ua = uaString.toLowerCase();

  // Detect bots
  if (/bot|crawl|spider|slurp|facebookexternalhit|curl|wget|python|postman/i.test(ua)) {
    return {
      type: "Bot",
      os: "Crawler",
      browser: "Automated",
      label: "Crawler / Bot",
      deviceCategory: "bot",
    };
  }

  // Detect Device Category & OS
  let type = "Desktop";
  let os = "Other";
  let deviceCategory = "desktop";

  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    type = "Tablet";
    deviceCategory = "tablet";
    os = /ipad/i.test(ua) ? "iPadOS" : "Android Tablet";
  } else if (/mobile|iphone|ipod|android/i.test(ua)) {
    type = "Mobile";
    deviceCategory = "mobile";
    if (/iphone|ipod/i.test(ua)) os = "iOS";
    else if (/android/i.test(ua)) os = "Android";
    else os = "Mobile OS";
  } else {
    // Desktop OS
    if (/windows nt 10.0/i.test(ua)) os = "Windows 10/11";
    else if (/windows nt/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
    else if (/linux/i.test(ua)) os = "Linux";
    else os = "Desktop OS";
  }

  // Detect Browser
  let browser = "Browser";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  return {
    type,
    os,
    browser,
    label: `${type} (${os}) • ${browser}`,
    deviceCategory,
  };
}
