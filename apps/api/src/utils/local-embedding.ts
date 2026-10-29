import { createHash } from 'crypto';

export const EMBEDDING_DIM = 768;

const CONCEPT_GROUPS: ReadonlyArray<readonly [string, ReadonlyArray<string>]> = [
  [
    'concept:overview',
    [
      'ማውጫ', 'መግቢያ', 'ምዕራፍ', 'ማጠቃለያ', 'መጽሐፍ', 'ትምህርት',
      'table of contents', 'introduction', 'chapter', 'chapters',
      'summary', 'summarize', 'overview', 'about', 'book', 'pdf', 'document', 'topic', 'topics',
    ],
  ],
  [
    'concept:heretics',
    [
      'መናፍቃን', 'መናፍቅ', 'ኑፋቄ', 'ክህደት', 'ተሐድሶ', 'ፕሮቴስታንት', 'ምላሽ',
      'heretic', 'heretics', 'heresy', 'apologetics', 'protestant', 'protestantism', 'reformation', 'tehadso',
    ],
  ],
  [
    'concept:religion_church_history',
    [
      'ሃይማኖት', 'ሐይማኖት', 'እምነት', 'ቤተክርስቲያን', 'ቤተ ክርስቲያን', 'ኦርቶዶክስ', 'ተዋሕዶ', 'ታሪክ', 'አዕማደ', 'ምስጢራት',
      'religion', 'church', 'history', 'orthodox', 'tewahedo', 'christian', 'christianity', 'schism', 'council', 'patristic',
    ],
  ],
  [
    'concept:christology',
    [
      'ኢየሱስ', 'ክርስቶስ', 'ጌታ', 'አምላክ', 'ፈራጅ', 'ፈራጅነት', 'ጠበቃ', 'መንገድ', 'ሥጋዌ', 'ማስታረቅ', 'አስታረቀው',
      'jesus', 'christ', 'messiah', 'lord', 'god', 'savior', 'judge', 'judgment', 'advocate', 'way', 'incarnation', 'reconcile', 'reconciliation',
    ],
  ],
  [
    'concept:intercession_saints',
    [
      'ቅዱሳን', 'ቅዱስ', 'አማላጅነት', 'ምልጃ', 'አማላጅ', 'ጻድቃን', 'ሰማዕታት', 'ቃል ኪዳን', 'መታሰቢያ', 'ባለሟል',
      'saint', 'saints', 'holy', 'intercession', 'intercede', 'mediation', 'mediator', 'righteous', 'martyrs', 'memorial',
    ],
  ],
  [
    'concept:angels',
    [
      'መላእክት', 'መልአክ', 'ሚካኤል', 'ገብርኤል', 'ተራዳኢነት',
      'angel', 'angels', 'archangel', 'michael', 'gabriel',
    ],
  ],
  [
    'concept:mary_mariology',
    [
      'እመቤታችን', 'ማርያም', 'ድንግል', 'ድንግልና', 'ድንግልናዋ', 'ወላዲተ', 'ጽዮን', 'ዮሴፍ', 'እናት',
      'mary', 'virgin', 'virginity', 'mother of god', 'theotokos', 'zion', 'joseph', 'st mary', 'saint mary',
    ],
  ],
  [
    'concept:prostration_worship',
    [
      'ስግደት', 'አክብሮት', 'አምልኮ', 'ምሥጋና', 'መስገድ',
      'prostration', 'bow', 'bowing', 'worship', 'veneration', 'honor',
    ],
  ],
  [
    'concept:holy_icons',
    [
      'ሥዕላት', 'ስዕላት', 'ሥዕል', 'ስዕል', 'ቅዱሳት ሥዕላት',
      'icon', 'icons', 'sacred art', 'image', 'images', 'painting', 'paintings',
    ],
  ],
  [
    'concept:sanctuary_temple',
    [
      'ቤተ መቅደስ', 'መቅደስ', 'ቤተመቅደስ',
      'temple', 'sanctuary', 'tabernacle', 'house of god',
    ],
  ],
  [
    'concept:tabot_ark',
    [
      'ታቦት', 'ጽላት', 'ታቦቱ', 'ጽላቱ', 'ንግሥ', 'ጣኦት',
      'tabot', 'tsilat', 'ark', 'ark of the covenant', 'tablet', 'tablets', 'idol', 'idols',
    ],
  ],
  [
    'concept:fasting',
    [
      'ፆም', 'ጾም', 'መጾም', 'የማህበር ፆም', 'የግል ጾም',
      'fast', 'fasting', 'lent', 'abstinence', 'diet',
    ],
  ],
  [
    'concept:salvation_grace_works',
    [
      'ጸጋ', 'በጸጋው', 'መዳን', 'ድህነት', 'ሥራ', 'ስራ', 'ሕግጋት', 'ጽድቅ',
      'grace', 'salvation', 'saved', 'save', 'faith', 'works', 'deeds', 'justification', 'righteousness',
    ],
  ],
  [
    'concept:bible_canon',
    [
      'መጽሐፍ ቅዱስ', 'ቅዱሳት መጻሕፍት', '66', '81', 'ብሉይ', 'ሐዲስ', 'ቀኖና',
      'bible', 'scripture', 'scriptures', 'canon', 'books', 'old testament', 'new testament', 'apocrypha', 'deuterocanonical',
    ],
  ],
  [
    'concept:jehovah_witnesses_arianism',
    [
      'ይሖዋ', 'ምስክሮች', 'አርዮስ', 'አርዮሳውያን', 'ነፍስ',
      'jehovah', 'witnesses', 'arian', 'arianism', 'arius', 'soul',
    ],
  ],
  [
    'concept:islam_quran',
    [
      'ቁርአን', 'ቁርዓን', 'እስልምና', 'ሙስሊም', 'ሙስሊሞች', 'መሐመድ',
      'quran', 'koran', 'islam', 'muslim', 'muslims', 'muhammad', 'mohammed',
    ],
  ],
  [
    'concept:trinity_sacraments',
    [
      'ሥላሴ', 'አብ', 'ወልድ', 'መንፈስ ቅዱስ', 'ጥምቀት', 'ቁርባን', 'ትንሳኤ',
      'trinity', 'father', 'son', 'holy spirit', 'baptism', 'eucharist', 'communion', 'resurrection',
    ],
  ],
];

const WORD_REGEX = /[\p{L}\p{M}\p{N}]{2,}/gu;

export function extractWords(text: string): string[] {
  if (!text) return [];
  const matches = text.toLowerCase().match(WORD_REGEX);
  return matches ? Array.from(matches) : [];
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while (true) {
    const idx = haystack.indexOf(needle, pos);
    if (idx === -1) break;
    count += 1;
    pos = idx + needle.length;
  }
  return count;
}

function extractFeatures(text: string): Map<string, number> {
  const features = new Map<string, number>();
  if (!text) return features;

  const words = extractWords(text);
  if (words.length === 0) return features;

  const joinedWords = ' ' + words.join(' ') + ' ';

  // 1. Word unigrams & character 3-grams (using Unicode code-point slicing to match Python str slicing)
  for (const w of words) {
    const wKey = `w:${w}`;
    features.set(wKey, (features.get(wKey) ?? 0) + 1.0);

    const chars = Array.from(w);
    if (chars.length >= 3) {
      const padded = ['^', ...chars, '$'];
      const maxLen = Math.min(padded.length, 24);
      for (let i = 0; i < maxLen - 2; i++) {
        const c3 = `c3:${padded.slice(i, i + 3).join('')}`;
        features.set(c3, (features.get(c3) ?? 0) + 1.0);
      }
    }
  }

  // 2. Word bigrams
  for (let i = 0; i < words.length - 1; i++) {
    const bKey = `b:${words[i]}_${words[i + 1]}`;
    features.set(bKey, (features.get(bKey) ?? 0) + 1.0);
  }

  // 3. Bilingual semantic concept bridge (4 sub-keys per concept, weighted by occurrence count)
  for (const [conceptId, triggers] of CONCEPT_GROUPS) {
    let occ = 0;
    for (const trigger of triggers) {
      occ += countOccurrences(joinedWords, trigger);
    }
    if (occ > 0) {
      for (let k = 0; k < 4; k++) {
        features.set(`${conceptId}:${k}`, occ);
      }
    }
  }

  return features;
}

/**
 * Computes a deterministic, L2-normalized 768-dimensional embedding vector
 * bit-for-bit identical to `compute_local_embedding` in `apps/ai-service`.
 */
export function computeLocalEmbedding(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM).fill(0.0);
  const features = extractFeatures(text);
  if (features.size === 0) {
    vec[0] = 1.0;
    return vec;
  }

  for (const [feat, count] of features.entries()) {
    if (count <= 0) continue;
    let weight: number;
    if (feat.startsWith('concept:')) {
      weight = 6.0 * Math.sqrt(count);
    } else if (feat.startsWith('w:')) {
      weight = 2.2 * (1.0 + Math.log(count));
    } else if (feat.startsWith('b:')) {
      weight = 2.5 * (1.0 + Math.log(count));
    } else {
      weight = 0.35 * (1.0 + Math.log(count));
    }

    const digest = createHash('sha256').update(feat, 'utf8').digest();
    for (let j = 0; j < 4; j++) {
      const u32 = digest.readUInt32BE(j * 4);
      const idx = u32 % EMBEDDING_DIM;
      const sign = ((u32 >>> 31) & 1) === 0 ? 1.0 : -1.0;
      vec[idx] += sign * weight;
    }
  }

  let sumSq = 0.0;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0.0) {
    const invNorm = 1.0 / norm;
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      vec[i] *= invNorm;
    }
  } else {
    vec[0] = 1.0;
  }

  return vec;
}
