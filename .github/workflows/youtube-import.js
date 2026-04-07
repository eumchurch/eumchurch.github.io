const fs = require("fs");
const path = require("path");
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const playlistItemsUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
const TIMEZONE_OFFSET = 1000 * 60 * 60 * 17;
const A_DAY_OFFSET = 1000 * 60 * 60 * 24;

const SERMON_PLAYLISTS = [
  "PLzCVCPy03Qq1ySW_mrIsXdrrDw35NBRyE", // 2020~2024
  "PLzCVCPy03Qq3HzyPBLCTU53sMtG-Da2_P", // 2025
  "PLzCVCPy03Qq2NcJoys243dkOL7PJtuLX1", // 2026
];

const QT_PLAYLISTS = [
  "PLzCVCPy03Qq2itb1HzvL5CV-TwTCRfFRA", // 2020~2024
  "PLzCVCPy03Qq1UV8gBxaIj2YQ3G4-Zj_Zy", // 2025
  "PLzCVCPy03Qq3Xafno_2tZP5fWfqH1x_0r", // 2026
];

// 한국어 성경 책 이름 (긴 이름 우선 — 정규식 alternation에서 부분 일치 방지)
const BIBLE_BOOKS = [
  // 전체 이름
  '데살로니가전서', '데살로니가후서', '예레미야애가',
  '고린도전서', '고린도후서', '갈라디아서', '빌레몬서',
  '디모데전서', '디모데후서', '베드로전서', '베드로후서',
  '요한계시록', '야고보서', '히브리서', '에베소서', '빌립보서', '골로새서',
  '요한일서', '요한이서', '요한삼서',
  '요한복음', '마태복음', '마가복음', '누가복음', '사도행전',
  '예레미야', '사무엘상', '사무엘하', '열왕기상', '열왕기하',
  '역대상', '역대하', '느헤미야', '출애굽기', '전도서',
  '창세기', '레위기', '민수기', '신명기', '여호수아', '사사기',
  '에스더', '에스라', '이사야', '에스겔', '다니엘', '호세아',
  '하박국', '스바냐', '스가랴', '말라기', '로마서', '유다서', '디도서',
  '욥기', '시편', '잠언', '아가', '요엘', '아모스', '오바댜', '요나',
  '미가', '나훔', '학개', '룻기',
  // 약어 (긴 것 우선)
  '살전', '살후', '삼상', '삼하', '왕상', '왕하', '대상', '대하',
  '고전', '고후', '딤전', '딤후', '벧전', '벧후', '요일', '요이', '요삼',
  '창', '출', '레', '민', '신', '수', '삿', '룻', '스', '느', '에',
  '욥', '시', '잠', '전', '아', '사', '렘', '애', '겔', '단', '호',
  '욜', '암', '옵', '욘', '미', '나', '합', '습', '학', '슥', '말',
  '마', '막', '눅', '요', '행', '롬', '갈', '엡', '빌', '골', '몬',
  '히', '약', '유', '계',
];

// 성경 구절 정규식
// 커버 범위:
//   마태복음 11장 / 시편 118편          (절 없음)
//   로마서 12:1                          (단일 절)
//   로마서 12:1-8                        (절 범위)
//   로마서 12:1-12:10                    (장:절 범위)
//   로마서 12:1 - 12:10                  (범위 사이 공백)
//   로마서 12:1~12:10                    (~ 사용)
//   로마서12:1                           (띄어쓰기 없음)
const BIBLE_PATTERN = new RegExp(
  `(${BIBLE_BOOKS.join('|')})` +
  `\\s*\\d+\\s*(?:장|편)?` +
  `(?:\\s*:\\s*\\d+(?:\\s*[-~]\\s*(?:\\d+:\\d+|\\d+))?)?`
);

function findBibleRef(text) {
  if (!text) return null;
  const m = BIBLE_PATTERN.exec(text);
  return m ? m[0].trim() : null;
}

function convertPostDate(publishedAt, needsSunday) {
  let publishedKST = new Date(new Date(publishedAt).getTime() + TIMEZONE_OFFSET);
  if (needsSunday) {
    publishedKST = new Date(publishedKST.getTime() - publishedKST.getDay() * A_DAY_OFFSET);
  }
  const year = publishedKST.getFullYear();
  const month = String(publishedKST.getMonth() + 1).padStart(2, '0');
  const date = String(publishedKST.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

function getYearKST(publishedAt) {
  return new Date(new Date(publishedAt).getTime() + TIMEZONE_OFFSET).getFullYear();
}

// 제목에서 월/일 추출, 연도는 publishedAt 기준으로 사용
// publishedAt이 없으면 현재 연도 사용
function parseDateFromTitle(title, publishedAt) {
  const year = publishedAt ? getYearKST(publishedAt) : new Date().getFullYear();
  const full = title.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (full) return `${full[1]}-${full[2].padStart(2,'0')}-${full[3].padStart(2,'0')}`;
  const short = title.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (short) return `${year}-${short[1].padStart(2,'0')}-${short[2].padStart(2,'0')}`;
  return null;
}

function createFile(date, title, subtitle, category, youtube, contents) {
  const fm = `---
layout: post
date: ${date}
title: "${title}"
category: "${category}"
subtitle: "${subtitle}"
youtube: "${youtube}"
---

<div class="youtube margin-large">
    <iframe src="https://www.youtube.com/embed/${youtube}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

`;
  fs.writeFileSync(
    path.join("_posts/" + category, date + "-" + category + ".md"),
    fm + contents
  );
}

async function fetchAllItems(playlistId) {
  let items = [];
  let pageToken = null;
  do {
    const params = { key: GOOGLE_API_KEY, playlistId, maxResults: 50, part: "snippet,status" };
    if (pageToken) params.pageToken = pageToken;
    const res = await fetch(`${playlistItemsUrl}?${new URLSearchParams(params)}`);
    const data = await res.json();
    if (data.error) throw new Error(`API error [${playlistId}]: ${JSON.stringify(data.error)}`);
    if (data.items) items = items.concat(data.items);
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return items;
}

async function getSermons() {
  const category = "sermon";
  fs.mkdirSync("_posts/" + category, { recursive: true });

  for (const playlistId of SERMON_PLAYLISTS) {
    console.log(`Fetching sermon playlist: ${playlistId}`);
    const items = await fetchAllItems(playlistId);
    console.log(`  ${items.length} items found`);

    for (const item of items) {
      if (item?.["status"]?.["privacyStatus"] !== "public") continue;

      const snippet = item?.["snippet"];
      if (!snippet) continue;

      const publishedAt = snippet?.["publishedAt"];
      const youtube = snippet?.["resourceId"]?.["videoId"];
      const desc = snippet?.["description"] || "";
      const mediaTitle = snippet?.["title"] || "";

      // 날짜: 제목에서 월/일 추출(연도는 publishedAt 기준), 없으면 publishedAt으로 일요일 보정
      const date = parseDateFromTitle(mediaTitle, publishedAt)
        ?? (publishedAt ? convertPostDate(publishedAt, true) : null);
      if (!date) throw new Error("date missing: " + mediaTitle);

      let title = "";
      let subtitle = "";
      let description = "";

      const parts = desc.split("\n\n").map(p => p.trim()).filter(p => p);

      // description 앞 3개 파트에서 성경구절 찾기
      let bibleIdx = -1;
      for (let i = 0; i < Math.min(parts.length, 3); i++) {
        if (findBibleRef(parts[i])) { bibleIdx = i; break; }
      }

      if (bibleIdx !== -1) {
        // title: 성경구절 파트에서 추출
        title = findBibleRef(parts[bibleIdx]);
        // subtitle: 성경구절이 아닌 다른 파트
        for (let i = 0; i < Math.min(parts.length, 3); i++) {
          if (i !== bibleIdx && parts[i]) { subtitle = parts[i]; break; }
        }
        // 본문: 3번째 파트 이후
        if (parts.length > 2) {
          description = parts.slice(2).map(p => p.replaceAll("\n", "\n\n")).join("\n\n") + "\n\n";
        }
      } else {
        // description에 없으면 mediaTitle에서 성경구절 찾기
        title = findBibleRef(desc) || findBibleRef(mediaTitle) || "";

        // subtitle: mediaTitle 괄호 안에서 성경구절이 아닌 부분
        for (const pm of mediaTitle.matchAll(/\(([^)]+)\)/g)) {
          const inner = pm[1].trim();
          if (!findBibleRef(inner) && inner) { subtitle = inner; break; }
        }

        // description 전체를 본문으로
        if (parts.length > 0) {
          description = parts.map(p => p.replaceAll("\n", "\n\n")).join("\n\n") + "\n\n";
        }
      }

      createFile(date, title, subtitle, category, youtube, description);
    }
  }
}

async function getQts() {
  const category = "qt";
  fs.mkdirSync("_posts/" + category, { recursive: true });

  for (const playlistId of QT_PLAYLISTS) {
    console.log(`Fetching QT playlist: ${playlistId}`);
    const items = await fetchAllItems(playlistId);
    console.log(`  ${items.length} items found`);

    for (const item of items) {
      if (item?.["status"]?.["privacyStatus"] !== "public") continue;

      const snippet = item?.["snippet"];
      if (!snippet) continue;

      const publishedAt = snippet?.["publishedAt"];
      const youtube = snippet?.["resourceId"]?.["videoId"];
      const mediaTitle = snippet?.["title"] || "";
      const desc = snippet?.["description"] || "";

      // 날짜: 제목에서 월/일 추출(연도는 publishedAt 기준), 없으면 publishedAt 사용
      const date = parseDateFromTitle(mediaTitle, publishedAt)
        ?? (publishedAt ? convertPostDate(publishedAt, false) : null);
      if (!date) throw new Error("Failed to parse QT date: " + mediaTitle);

      // title: description에서 먼저, 없으면 mediaTitle 괄호 안, 없으면 mediaTitle 전체에서
      let title = findBibleRef(desc) || "";
      if (!title) {
        for (const pm of mediaTitle.matchAll(/\(([^)]+)\)/g)) {
          const ref = findBibleRef(pm[1]);
          if (ref) { title = ref; break; }
        }
      }
      if (!title) title = findBibleRef(mediaTitle) || "";

      createFile(date, title, "", category, youtube, "");
    }
  }
}

(async () => {
  await getSermons();
  await getQts();
})();
