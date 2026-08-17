const EXPLICIT_ENTERTAINMENT = /\b(movie|movies|film|films|cinema|web\s*series|series|tv\s*show|television|drama|short\s*film|trailer|teaser|episode|season|ott|streaming|imdb|rating|review|cast|director|actor|actress|box\s*office)\b/i;

const KNOWN_TITLES = new Set([
  "akira", "antony", "arinthum ariyamalum", "athiradi", "bawaal", "boiler room", "boyz", "charlie bartlett", "de dhakka", "deool", "devs", "dhootha", "gatta kusthi", "guru", "her", "hotspot", "jigarthanda doublex", "kaantha", "kantara", "kantara chapter 1", "king of kotha", "mad", "naa saami ranga", "rocky", "safia safdar", "seven", "shehzada", "thirteen", "13 thirteen", "the apprentice", "tinker tailor soldier spy", "uppena", "yashoda", "yodha", "zero",
]);

export function isLikelyEntertainmentQuery(rawQuery) {
  const query = rawQuery.trim().replace(/[?:!.,]+$/g, "").toLowerCase();
  if (query.length < 2 || query.length > 255) return false;
  if (EXPLICIT_ENTERTAINMENT.test(query)) return true;
  return KNOWN_TITLES.has(query);
}
