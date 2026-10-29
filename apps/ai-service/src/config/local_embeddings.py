import hashlib
import math
import unicodedata
from typing import Dict, List, Tuple
from langchain_core.embeddings import Embeddings

EMBEDDING_DIM = 768

# Bilingual Amharic <-> English semantic concept bridge so cross-lingual and
# morphological queries map into shared high-signal coordinates alongside
# Unicode word unigrams, word bigrams, and character 3-grams.
CONCEPT_GROUPS: List[Tuple[str, List[str]]] = [
    (
        "concept:overview",
        [
            "ማውጫ", "መግቢያ", "ምዕራፍ", "ማጠቃለያ", "መጽሐፍ", "ትምህርት",
            "table of contents", "introduction", "chapter", "chapters",
            "summary", "summarize", "overview", "about", "book", "pdf", "document", "topic", "topics",
        ],
    ),
    (
        "concept:heretics",
        [
            "መናፍቃን", "መናፍቅ", "ኑፋቄ", "ክህደት", "ተሐድሶ", "ፕሮቴስታንት", "ምላሽ",
            "heretic", "heretics", "heresy", "apologetics", "protestant", "protestantism", "reformation", "tehadso",
        ],
    ),
    (
        "concept:religion_church_history",
        [
            "ሃይማኖት", "ሐይማኖት", "እምነት", "ቤተክርስቲያን", "ቤተ ክርስቲያን", "ኦርቶዶክስ", "ተዋሕዶ", "ታሪክ", "አዕማደ", "ምስጢራት",
            "religion", "church", "history", "orthodox", "tewahedo", "christian", "christianity", "schism", "council", "patristic",
        ],
    ),
    (
        "concept:christology",
        [
            "ኢየሱስ", "ክርስቶስ", "ጌታ", "አምላክ", "ፈራጅ", "ፈራጅነት", "ጠበቃ", "መንገድ", "ሥጋዌ", "ማስታረቅ", "አስታረቀው",
            "jesus", "christ", "messiah", "lord", "god", "savior", "judge", "judgment", "advocate", "way", "incarnation", "reconcile", "reconciliation",
        ],
    ),
    (
        "concept:intercession_saints",
        [
            "ቅዱሳን", "ቅዱስ", "አማላጅነት", "ምልጃ", "አማላጅ", "ጻድቃን", "ሰማዕታት", "ቃል ኪዳን", "መታሰቢያ", "ባለሟል",
            "saint", "saints", "holy", "intercession", "intercede", "mediation", "mediator", "righteous", "martyrs", "memorial",
        ],
    ),
    (
        "concept:angels",
        [
            "መላእክት", "መልአክ", "ሚካኤል", "ገብርኤል", "ተራዳኢነት",
            "angel", "angels", "archangel", "michael", "gabriel",
        ],
    ),
    (
        "concept:mary_mariology",
        [
            "እመቤታችን", "ማርያም", "ድንግል", "ድንግልና", "ድንግልናዋ", "ወላዲተ", "ጽዮን", "ዮሴፍ", "እናት",
            "mary", "virgin", "virginity", "mother of god", "theotokos", "zion", "joseph", "st mary", "saint mary",
        ],
    ),
    (
        "concept:prostration_worship",
        [
            "ስግደት", "አክብሮት", "አምልኮ", "ምሥጋና", "መስገድ",
            "prostration", "bow", "bowing", "worship", "veneration", "honor",
        ],
    ),
    (
        "concept:holy_icons",
        [
            "ሥዕላት", "ስዕላት", "ሥዕል", "ስዕል", "ቅዱሳት ሥዕላት",
            "icon", "icons", "sacred art", "image", "images", "painting", "paintings",
        ],
    ),
    (
        "concept:sanctuary_temple",
        [
            "ቤተ መቅደስ", "መቅደስ", "ቤተመቅደስ",
            "temple", "sanctuary", "tabernacle", "house of god",
        ],
    ),
    (
        "concept:tabot_ark",
        [
            "ታቦት", "ጽላት", "ታቦቱ", "ጽላቱ", "ንግሥ", "ጣኦት",
            "tabot", "tsilat", "ark", "ark of the covenant", "tablet", "tablets", "idol", "idols",
        ],
    ),
    (
        "concept:fasting",
        [
            "ፆም", "ጾም", "መጾም", "የማህበር ፆም", "የግል ጾም",
            "fast", "fasting", "lent", "abstinence", "diet",
        ],
    ),
    (
        "concept:salvation_grace_works",
        [
            "ጸጋ", "በጸጋው", "መዳን", "ድህነት", "ሥራ", "ስራ", "ሕግጋት", "ጽድቅ",
            "grace", "salvation", "saved", "save", "faith", "works", "deeds", "justification", "righteousness",
        ],
    ),
    (
        "concept:bible_canon",
        [
            "መጽሐፍ ቅዱስ", "ቅዱሳት መጻሕፍት", "66", "81", "ብሉይ", "ሐዲስ", "ቀኖና",
            "bible", "scripture", "scriptures", "canon", "books", "old testament", "new testament", "apocrypha", "deuterocanonical",
        ],
    ),
    (
        "concept:jehovah_witnesses_arianism",
        [
            "ይሖዋ", "ምስክሮች", "አርዮስ", "አርዮሳውያን", "ነፍስ",
            "jehovah", "witnesses", "arian", "arianism", "arius", "soul",
        ],
    ),
    (
        "concept:islam_quran",
        [
            "ቁርአን", "ቁርዓን", "እስልምና", "ሙስሊም", "ሙስሊሞች", "መሐመድ",
            "quran", "koran", "islam", "muslim", "muslims", "muhammad", "mohammed",
        ],
    ),
    (
        "concept:trinity_sacraments",
        [
            "ሥላሴ", "አብ", "ወልድ", "መንፈስ ቅዱስ", "ጥምቀት", "ቁርባን", "ትንሳኤ",
            "trinity", "father", "son", "holy spirit", "baptism", "eucharist", "communion", "resurrection",
        ],
    ),
]


def _extract_words(text: str) -> List[str]:
    """Extracts lowercase Unicode word tokens (letters, combining marks, digits) of length >= 2."""
    lowered = text.lower()
    words: List[str] = []
    current: List[str] = []
    for ch in lowered:
        cat = unicodedata.category(ch)
        if cat and cat[0] in ("L", "M", "N"):
            current.append(ch)
        else:
            if len(current) >= 2:
                words.append("".join(current))
            current = []
    if len(current) >= 2:
        words.append("".join(current))
    return words


def _extract_features(text: str) -> Dict[str, float]:
    """Builds a raw count dictionary from words, bigrams, char 3-grams, and bilingual concepts."""
    features: Dict[str, float] = {}
    if not text:
        return features

    words = _extract_words(text)
    if not words:
        return features

    joined_words = " " + " ".join(words) + " "

    # 1. Word unigrams & character 3-grams
    for w in words:
        w_key = f"w:{w}"
        features[w_key] = features.get(w_key, 0.0) + 1.0

        if len(w) >= 3:
            padded = f"^{w}$"
            max_len = min(len(padded), 24)
            for i in range(max_len - 2):
                c3 = f"c3:{padded[i:i+3]}"
                features[c3] = features.get(c3, 0.0) + 1.0

    # 2. Word bigrams
    for i in range(len(words) - 1):
        b_key = f"b:{words[i]}_{words[i+1]}"
        features[b_key] = features.get(b_key, 0.0) + 1.0

    # 3. Bilingual semantic concept bridge (4 sub-keys per concept, weighted by occurrence count)
    for concept_id, triggers in CONCEPT_GROUPS:
        occ = 0
        for trigger in triggers:
            occ += joined_words.count(trigger)
        if occ > 0:
            for k in range(4):
                features[f"{concept_id}:{k}"] = float(occ)

    return features


def compute_local_embedding(text: str) -> List[float]:
    """
    Computes a deterministic, L2-normalized 768-dimensional embedding vector using
    4-way SHA-256 CountSketch signed projections with sublinear TF weighting.
    """
    vec = [0.0] * EMBEDDING_DIM
    features = _extract_features(text)
    if not features:
        vec[0] = 1.0
        return vec

    for feat, count in features.items():
        if count <= 0:
            continue
        if feat.startswith("concept:"):
            weight = 6.0 * math.sqrt(count)
        elif feat.startswith("w:"):
            weight = 2.2 * (1.0 + math.log(count))
        elif feat.startswith("b:"):
            weight = 2.5 * (1.0 + math.log(count))
        else:
            weight = 0.35 * (1.0 + math.log(count))

        digest = hashlib.sha256(feat.encode("utf-8")).digest()
        for j in range(4):
            offset = j * 4
            u32 = int.from_bytes(digest[offset : offset + 4], byteorder="big", signed=False)
            idx = u32 % EMBEDDING_DIM
            sign = 1.0 if ((u32 >> 31) & 1) == 0 else -1.0
            vec[idx] += sign * weight

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0.0:
        inv_norm = 1.0 / norm
        vec = [v * inv_norm for v in vec]
    else:
        vec[0] = 1.0

    return vec


class LocalMultilingualEmbeddings(Embeddings):
    """
    Zero-latency, rate-limit-free 768-dimensional local multilingual embedding model
    supporting English, Amharic (Ethiopic), and arbitrary Unicode scripts.
    """

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [compute_local_embedding(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return compute_local_embedding(text)
