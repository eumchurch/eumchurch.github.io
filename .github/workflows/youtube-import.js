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

function convertPostDate(publishedAt, needsSunday) {
  let publishedDate = new Date(publishedAt);
  let publishedKST = new Date(publishedDate.getTime() + TIMEZONE_OFFSET);
  if (needsSunday) {
    publishedKST = new Date(publishedKST.getTime() - publishedKST.getDay() * A_DAY_OFFSET);
  }

  let year = publishedKST.getFullYear();
  let month = publishedKST.getMonth() + 1;
  if (month < 10) month = "0" + month;
  let date = publishedKST.getDate();
  if (date < 10) date = "0" + date;
  return year + "-" + month + "-" + date;
}

function parseDateFromTitle(title) {
  // 연도 포함: "2023년 3월 15일"
  const matchFull = title.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (matchFull) {
    const year = matchFull[1];
    const month = matchFull[2].padStart(2, '0');
    const day = matchFull[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 연도 없음: "3월 15일" → 현재 연도 사용
  const matchShort = title.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (matchShort) {
    const year = new Date().getFullYear();
    const month = matchShort[1].padStart(2, '0');
    const day = matchShort[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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

  fs.writeFileSync(path.join("_posts/" + category, date + "-" + category + ".md"), fm + contents);
}

async function fetchAllItems(playlistId) {
  let items = [];
  let pageToken = null;

  do {
    const params = {
      key: GOOGLE_API_KEY,
      playlistId: playlistId,
      maxResults: 50,
      part: "snippet",
    };
    if (pageToken) params.pageToken = pageToken;

    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`${playlistItemsUrl}?${queryString}`);
    const data = await res.json();

    if (data.error) throw new Error(`API error for playlist ${playlistId}: ${JSON.stringify(data.error)}`);
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
      const snippet = item?.["snippet"];
      if (!snippet) continue;

      const publishedAt = snippet?.["publishedAt"];
      const youtube = snippet?.["resourceId"]?.["videoId"];
      const desc = snippet?.["description"] || "";
      const mediaTitle = snippet?.["title"] || "";

      if (!publishedAt) throw new Error("publishedAt missing for sermon: " + mediaTitle);
      const date = convertPostDate(publishedAt, true);

      let title = "";
      let subtitle = "";
      let description = "";

      const array = desc.split("\n\n");
      if (array.length >= 3) {
        title = array[1];
        subtitle = array[0];
        for (let i = 2; i < array.length; i++) {
          description += array[i].replaceAll("\n", "\n\n") + "\n\n";
        }
      } else {
        const m = mediaTitle.match(/\(([^)]+)\)/);
        if (!m) throw new Error("Failed to parse sermon title: " + mediaTitle);
        const inside = m[1].trim();
        const idx = inside.lastIndexOf(",");
        title = inside.slice(0, idx).trim();
        subtitle = inside.slice(idx + 1).trim();
        if (!title || !subtitle) throw new Error("Failed to parse sermon title/subtitle: " + mediaTitle);
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
      const snippet = item?.["snippet"];
      if (!snippet) continue;

      const mediaTitle = snippet?.["title"] || "";
      if (mediaTitle === "Private video") continue;

      const publishedAt = snippet?.["publishedAt"];
      const youtube = snippet?.["resourceId"]?.["videoId"];

      // 날짜: publishedAt 우선, 없으면 제목에서 파싱
      let date = "";
      if (publishedAt) {
        date = convertPostDate(publishedAt, false);
      } else {
        date = parseDateFromTitle(mediaTitle);
        if (!date) throw new Error("Failed to parse QT date: " + mediaTitle);
      }

      // 제목: 괄호 안에서 추출 (기존 로직 유지)
      let title = "";
      const parts = mediaTitle.split("(");
      if (parts.length == 2) {
        title = parts[1].split(")")[0];
      } else if (parts.length >= 3) {
        title = parts[parts.length - 1].split(")")[0];
      } else {
        throw new Error("Failed to parse QT title: " + mediaTitle);
      }

      createFile(date, title, "", category, youtube, "");
    }
  }
}

(async () => {
  await getSermons();
  await getQts();
})();
