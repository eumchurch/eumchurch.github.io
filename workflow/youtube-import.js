const fs = require("fs");
const path = require("path");
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const playlistItemsUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
const PLAYLIST_ID_SERMON = "PLzCVCPy03Qq3HzyPBLCTU53sMtG-Da2_P";
const PLAYLIST_ID_QT = "PLzCVCPy03Qq1UV8gBxaIj2YQ3G4-Zj_Zy";
const CHANNEL_ID = "UC2pp2CNwey9Yc79XcxJyHGw";
const TIMEZONE_OFFSET = 1000 * 60 * 60 * 17;
const A_DAY_OFFSET = 1000 * 60 * 60 * 24;

function convertPostDate(publishedAt, needsSunday) {
  let publishedDate = new Date(publishedAt);
  let publishedKST = new Date(publishedDate.getTime() + TIMEZONE_OFFSET);
  if (needsSunday) {
    publishedKST = new Date(publishedKST.getTime() - publishedKST.getDay() * A_DAY_OFFSET);
  }
  
  let year = publishedKST.getFullYear();
  let month = publishedKST.getMonth() + 1;
  if (month < 10) {
      month = "0" + month;
  }
  let date = publishedKST.getDate();
  if (date < 10) {
      date = "0" + date;
  }
  return year + "-" + month + "-" + date;
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

  fs.writeFile(path.join("_posts/" + category, date + "-" + category + ".md"), fm + contents, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

async function callApi(playlistId, callBack) {

  const params = {
      key: GOOGLE_API_KEY,
      playlistId: playlistId,
      maxResults: 20,
      part: "snippet"
  };
  const queryString = new URLSearchParams(params).toString();  // url에 쓰기 적합한 querySting으로 return 해준다. 
  const requrl = `${playlistItemsUrl}?${queryString}`; 

  const res = await fetch(requrl);
  const data = await res.json();

  let items = data?.["items"];

  callBack(items);
}

async function checkSermons() {

  const params = {
    key: GOOGLE_API_KEY,
    channelId: CHANNEL_ID,
    q: "설교",
    order: "date",
    part: "snippet",
    maxResults: 12
  };
  const queryString = new URLSearchParams(params).toString();
  const requrl = `${searchUrl}?${queryString}`;

  const res = await fetch(requrl);
  const data = await res.json();
  let items = data?.["items"];
  if (items) {
    let firstItem = items[0];
    if (firstItem) {
      let firstVideoId = firstItem?.["id"]?.["videoId"];
      console.log(firstVideoId);
    }
  }
}

function getSermons() {
  // 주일설교
  let category = "sermon"
  fs.mkdirSync("_posts/" + category, { recursive: true });

  let items = callApi(PLAYLIST_ID_SERMON, function(items) {
    if (items) {
      for (const item of items) {
        let snippet = item?.["snippet"];
        if (snippet) {
          
          let date = "";
          let title = "";
          let subtitle = "";
          let description = "";
          let desc = snippet?.["description"];
          let publishedAt = snippet?.["publishedAt"];
          let youtube = snippet?.["resourceId"]?.["videoId"];

          if (publishedAt) {
            date = convertPostDate(publishedAt, true);
          } else {
            throw new Error("An error occured parsing sermon date; " + publishedAt);
          }

          let array = desc.split("\n\n");
          if (array.length >= 3) {
            title = array[1];
            subtitle = array[0];
            
            for (let i=2; i<array.length; i++) {
              let string = array[i];
              description += (string.replaceAll("\n", "\n\n") + "\n\n");
            }
          } else {
            throw new Error("An error occured parsing youtube sermon description; " + description);
          }

          createFile(date, title, subtitle, category, youtube, description);
        }
      }
    }
  });
}

function getQts() {
  // 주일설교
  let category = "qt"
  fs.mkdirSync("_posts/" + category, { recursive: true });

  let items = callApi(PLAYLIST_ID_QT, function(items) {
    if (items) {
      for (const item of items) {
        let snippet = item?.["snippet"];
        if (snippet) {

          var date = "";
          let title = snippet?.["title"];
          if (title == "Private video") {
            continue;
          }
          let publishedAt = snippet?.["publishedAt"];
          let youtube = snippet?.["resourceId"]?.["videoId"];

          // 정규식을 이용해 월과 일을 추출
          const match = title.match(/(\d{1,2})월\s+(\d{1,2})일/);
          if (match) {
            const year = new Date().getFullYear();
            const month = match[1].padStart(2, '0'); // 한 자리 수일 경우 0 추가
            const day = match[2].padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            date = formattedDate;
          } else {
            // 패턴에 맞지 않으면 skip (에러 없음)
            throw new Error("An error occured parsing youtube qt title 1; " + title);
          }
          
          let array = title.split("(");
          if (array.length == 2) {
            array = array[1].split(")");
          } else if (array.length == 3) {
            array = array[2].split(")");
          } else {
            throw new Error("An error occured parsing youtube qt title 1; " + title);
          }
          if (array.length >= 1) {
            title = array[0];
          } else {
            throw new Error("An error occured parsing youtube qt title 2; " + title);
          }

          createFile(date, title, "", category, youtube, "");
        }
      }
    }
  });
}

checkSermons();
getSermons();
getQts();
