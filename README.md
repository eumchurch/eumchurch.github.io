# 이음교회 홈페이지
https://2eumchurch.com  
서울특별시 마포구 백범로 1길 3 2층  

## jekyll 동작 개요
html 및 md 파일 상단에 layout, date, category, title, subtitle 혹은 새롭게 정의된 필드를 추가하여 파일에 다른 레이아웃을 입히거나 페이지 속성을 지정할 수 있다. 파일을 작성 후 배포하면 정의된 스타일에 따라 jekyll 엔진이 5-10분을 주기마다 md 및 html 파일을 새로운 html 파일로 변환한다.  
`sample` [2020-01-12-visions.md](https://github.com/eumchurch/eumchurch.github.io/blob/main/_posts/introduction/2020-01-12-visions.md)

`Github pages`는 `jekyll` 블로그 작성을 손쉽게 할 수 있도록 돕고, 호스팅까지 맡는다. 그리고 홈페이지 디자인을 쉽게 하기 위해 오픈소스를 사용했다.

https://jekynewage.github.io/  
https://github.com/jekynewage/jekynewage.github.io  

### Layouts
[/_layouts/](https://github.com/eumchurch/eumchurch.github.io/tree/main/_layouts)  
[front](https://github.com/eumchurch/eumchurch.github.io/blob/main/_layouts/front.html) - 메인페이지 레이아웃  
[default](https://github.com/eumchurch/eumchurch.github.io/blob/main/_layouts/default.html) - 포스트 및 목록의 레이아웃  
[post](https://github.com/eumchurch/eumchurch.github.io/blob/main/_layouts/post.html) - 포스트 및 목록의 레이아웃 -> [default](https://github.com/eumchurch/eumchurch.github.io/blob/main/_layouts/default.html)를 통해 노출  
  
## 폴더 및 파일
랜딩페이지 [/_layouts/front.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_layouts/front.html) -> [/index.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/index.html)를 통해 노출, 컨텐츠 내용은 [_includes](https://github.com/eumchurch/eumchurch.github.io/tree/main/_includes) 안에 있다.  
레이아웃 [/_layouts/](https://github.com/eumchurch/eumchurch.github.io/tree/main/_layouts)  
포스트 [/_posts/](https://github.com/eumchurch/eumchurch.github.io/tree/main/_posts) 각 카테고리 폴더 사용   
css [/css/](https://github.com/eumchurch/eumchurch.github.io/tree/main/css)  
font css [/font-awesome/css/](https://github.com/eumchurch/eumchurch.github.io/tree/main/font-awesome/css)  
이미지 [/img/](https://github.com/eumchurch/eumchurch.github.io/tree/main/img)  
주일설교 목록 [/list/sermon.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/list/sermon.html)  
큐티 목록 [/list/daily-qt.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/list/daily-qt.html)  
사역 목록 [/list/ministry.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/list/ministry.html)  
주보 목록 [/list/bulletin.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/list/bulletin.html) 주보는 현재 미노출  


# 랜딩페이지 상세
[/_layouts/front.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_layouts/front.html)  

### Head
[/_includes/head.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_includes/head.html)  
페이지 타이틀, 검색 태그, og 태그, 폰트 정보 기록
[front.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_layouts/front.html), [default.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_layouts/front.html)를 보면 상단에 head를 똑같이 import하고 있는 것을 볼 수 있다. 홈, 블로그, 게시판에 동일한 head를 사용하고 있지만, 원하는대로 분리할 수 있다.

### Navigation
[/_includes/nav-main.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_includes/nav-main.html)

### 홈
[/_includes/header.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_includes/header.html)  
로고와 간단한 소개, 비전이 안내되어 있다.

### 교단 안내
[/_includes/bodyinfo.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_includes/bodyinfo.html)

### 말씀과 묵상
[/_includes/message.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_includes/message.html)  
컨텐츠 상세로 이동하거나 [주일설교 목록](https://github.com/eumchurch/eumchurch.github.io/blob/main/list/sermon.html), [큐티 목록](https://github.com/eumchurch/eumchurch.github.io/blob/main/list/daily-qt.html)으로 이동한다.

### 비전과 사역
[/_includes/visions.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_includes/visions.html)  
컨텐츠를 클릭하면 [비전 소개 페이지](https://github.com/eumchurch/eumchurch.github.io/blob/main/_posts/introduction/2020-01-12-visions.md)로 이동하며, 각 컨텐츠가 있는 책갈피로 이동한다.

### 히스토리
[/_includes/news.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_includes/news.html)  
컨텐츠를 클릭하면 [ministry 카테고리](https://github.com/eumchurch/eumchurch.github.io/tree/main/_posts/ministry) 내 각 컨텐츠로 이동한다.

### 찾아오시는 길
[/_includes/contact.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_includes/contact.html)
지도 설정은 [scripts.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_includes/scripts.html) 파일에 있다.

### 오픈소스 안내
[/includes/footer.html](https://github.com/eumchurch/eumchurch.github.io/blob/main/_includes/footer.html)

## 참고 페이지

Github pages https://pages.github.com/
Sample page https://jekynewage.github.io
Jekyll https://jekyllrb-ko.github.io/
Liquid https://shopify.github.io/liquid/
