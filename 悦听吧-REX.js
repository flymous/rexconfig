// 悦听吧 Forward / Rex source
// Site: http://yuetingba.cn/
// Detail pages expose the full episode queue, so Rex can auto-play the next
// episode. Playback resolves through /api/app/docs-listen/{tingId}/play-info,
// which returns a short-lived MP3 URL.

var YTB_SITE = "http://yuetingba.cn";
var YTB_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/142.0.0.0 Safari/537.36";
var YTB_TIMEOUT = 20000;
var YTB_PAGE_SIZE = 200;
var YTB_MIN_CHAPTERS = 10;
var YTB_DEFAULT_CHAPTERS = 3000;
var YTB_MAX_CHAPTERS = 3000;
var YTB_IMAGE_PROXY = "https://images.weserv.nl/";
// 调试开关：保留常量详情分支用于排查 Rex 模块管道，默认关闭。
var YTB_DIAGNOSTIC_CONSTANT_DETAIL = false;

var ytbRuntime = {
  maxChapters: YTB_DEFAULT_CHAPTERS
};

var WidgetMetadata = {
  id: "forward.yuetingba",
  title: "悦听吧",
  description:
    "悦听吧有声小说；支持分类、搜索、详情和 MP3 播放，详情页提供连续分集队列，可自动播放下一集。",
  author: "Walkman",
  site: YTB_SITE + "/",
  iconurl: YTB_SITE + "/custom/favicon.ico",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 300,
  modules: [
    {
      id: "latestAll",
      title: "首页推荐",
      functionName: "latestAll",
      type: "video",
      cacheDuration: 300,
      params: []
    },
    {
      id: "latestBooks",
      title: "最新有声",
      functionName: "latestBooks",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "recommendBooks",
      title: "热门推荐",
      functionName: "recommendBooks",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryFantasy",
      title: "玄幻",
      functionName: "categoryFantasy",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryUrban",
      title: "都市",
      functionName: "categoryUrban",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryHistory",
      title: "历史",
      functionName: "categoryHistory",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryClassic",
      title: "名著",
      functionName: "categoryClassic",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryFemale",
      title: "女频",
      functionName: "categoryFemale",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categorySciFi",
      title: "科幻",
      functionName: "categorySciFi",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryWuxia",
      title: "武侠",
      functionName: "categoryWuxia",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryStorytelling",
      title: "评书",
      functionName: "categoryStorytelling",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categorySocial",
      title: "社科",
      functionName: "categorySocial",
      type: "video",
      cacheDuration: 300,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "loadResource",
      title: "悦听吧音频",
      description: "解析当前章节的 MP3 直链；详情页分集队列支持自动下一集",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: []
    }
  ],
  search: {
    title: "搜索 悦听吧",
    functionName: "searchYtb",
    type: "video",
    params: [
      {
        name: "keyword",
        title: "书名、作者或主播",
        type: "input",
        value: "",
        placeholders: [
          { title: "庆余年", value: "庆余年" },
          { title: "盗墓笔记", value: "盗墓笔记" },
          { title: "猫腻", value: "猫腻" }
        ]
      },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

function ytbText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function ytbPage(value) {
  var page = parseInt(ytbText(value || 1), 10);
  if (!isFinite(page) || page < 1) page = 1;
  return Math.min(page, 5000);
}

function ytbDecodeEntities(value) {
  return ytbText(value)
    .replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/&#(\d+);/g, function (_, number) {
      return String.fromCharCode(parseInt(number, 10));
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&ensp;/gi, " ")
    .replace(/&emsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function ytbStripTags(value) {
  return ytbDecodeEntities(
    ytbText(value)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function ytbAttr(source, name) {
  var escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var match = ytbText(source).match(
    new RegExp("\\b" + escaped + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i")
  );
  if (!match) return "";
  return ytbDecodeEntities(match[1] || match[2] || match[3] || "");
}

function ytbFirstMatch(source, pattern) {
  var match = ytbText(source).match(pattern);
  return match ? match[1] || "" : "";
}

function ytbAbsolute(value) {
  var url = ytbText(value);
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf("//") === 0) return "http:" + url;
  if (url.charAt(0) === "/") return YTB_SITE + url;
  return YTB_SITE + "/" + url.replace(/^\.?\//, "");
}

function ytbImage(value) {
  var url = ytbAbsolute(value);
  if (!url) return "";
  return YTB_IMAGE_PROXY +
    "?url=" + encodeURIComponent(url.replace(/^https?:\/\//i, "")) +
    "&w=1280&h=720&fit=cover&output=webp&q=86";
}

function ytbApplyParams(params) {
  params = params || {};
  var limit = parseInt(
    ytbText(
      params.max_chapters !== undefined
        ? params.max_chapters
        : String(ytbRuntime.maxChapters || YTB_DEFAULT_CHAPTERS)
    ),
    10
  );
  if (!isFinite(limit) || limit <= 0) {
    ytbRuntime.maxChapters = YTB_MAX_CHAPTERS;
  } else {
    ytbRuntime.maxChapters = Math.max(
      YTB_MIN_CHAPTERS,
      Math.min(YTB_MAX_CHAPTERS, limit)
    );
  }
  return params;
}

function ytbHeaders(referer) {
  return {
    "User-Agent": YTB_USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.6",
    Referer: ytbText(referer) || YTB_SITE + "/"
  };
}

function ytbResponseStatus(response) {
  return Number(
    (response && (response.statusCode || response.status || response.code)) || 200
  );
}

async function ytbRequest(url, referer, extraHeaders) {
  var headers = ytbHeaders(referer);
  extraHeaders = extraHeaders || {};
  Object.keys(extraHeaders).forEach(function (key) {
    headers[key] = extraHeaders[key];
  });
  var response = await Widget.http.get(url, {
    headers: headers,
    timeout: YTB_TIMEOUT
  });
  var status = ytbResponseStatus(response);
  if (status < 200 || status >= 300) {
    throw new Error("悦听吧 HTTP " + status + ": " + url);
  }
  return response && response.data !== undefined ? response.data : response;
}

async function ytbGetText(url, referer) {
  var data = await ytbRequest(url, referer);
  return typeof data === "string" ? data : JSON.stringify(data || "");
}

async function ytbGetJSON(url, referer, extraHeaders) {
  var data = await ytbRequest(url, referer, extraHeaders);
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new Error("悦听吧接口返回了非 JSON 内容");
    }
  }
  return data || {};
}

function ytbParseCards(html, category) {
  var chunks = ytbText(html).split(
    /<div\b[^>]*class="[^"]*\bsection-box-list-item\b[^"]*"[^>]*>/i
  );
  var items = [];
  var seen = {};
  for (var index = 1; index < chunks.length; index += 1) {
    var block = chunks[index];
    var hrefMatch = block.match(
      /href="[^"]*\/book\/detail\/([0-9a-f-]{36})\/\d+"/i
    );
    if (!hrefMatch || seen[hrefMatch[1]]) continue;
    var bookId = hrefMatch[1];
    seen[bookId] = true;

    var title = ytbStripTags(
      ytbFirstMatch(
        block,
        /<div\b[^>]*box-list-item-text-title[^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/i
      )
    );
    if (!title) continue;

    var poster = ytbAbsolute(
      ytbAttr(
        ytbFirstMatch(
          block,
          /<div\b[^>]*box-list-item-img[^>]*>[\s\S]*?(<img\b[^>]*>)/i
        ),
        "src"
      )
    );
    var author = ytbStripTags(
      ytbFirstMatch(
        block,
        /<a\b[^>]*href="[^"]*\/search\?type=2[^"]*"[^>]*>([\s\S]*?)<\/a>/i
      )
    );
    var speaker = ytbStripTags(
      ytbFirstMatch(
        block,
        /<a\b[^>]*href="[^"]*\/search\?type=3[^"]*"[^>]*>([\s\S]*?)<\/a>/i
      )
    );
    var intro = ytbStripTags(
      ytbFirstMatch(
        block,
        /<div\b[^>]*box-list-item-text-intro[^>]*>([\s\S]*?)<\/div>/i
      )
    );
    var detailURL = YTB_SITE + "/book/detail/" + bookId + "/0";
    var backdrop = ytbImage(poster);
    items.push({
      id: "yuetingba:" + bookId,
      type: "url",
      title: title,
      originalTitle: title,
      description: intro || [category, author ? "作者：" + author : "", speaker ? "主播：" + speaker : ""]
        .filter(Boolean)
        .join(" · "),
      posterPath: poster,
      detailPoster: poster,
      backdropPath: backdrop,
      backdropPaths: backdrop ? [backdrop] : [],
      coverUrl: backdrop || poster,
      rating: 0,
      mediaType: "tv",
      genreTitle: ytbText(category),
      year: "",
      country: "",
      language: "国语",
      link: "yuetingba:" + bookId,
      externalUrl: detailURL,
      source: "悦听吧",
      ytbBookId: bookId,
      ytbAuthor: author,
      ytbSpeaker: speaker
    });
  }
  return items;
}

function ytbParsePlayURLs(html, bookId) {
  var source = ytbText(html);
  var episodes = [];
  var byId = {};
  var marker = /href="[^"]*\/book\/ting\/([0-9a-f-]{36})[^"]*"/gi;
  var match;
  while ((match = marker.exec(source))) {
    var tingId = match[1];
    var tagStart = source.lastIndexOf("<a", match.index);
    var tagEnd = source.indexOf(">", match.index);
    if (tagStart < 0 || tagEnd < 0) continue;
    var close = source.indexOf("</a>", tagEnd);
    if (close < 0) continue;
    var attrs = source.slice(tagStart, tagEnd);
    var title =
      ytbStripTags(source.slice(tagEnd + 1, close)) ||
      ytbDecodeEntities(ytbAttr(attrs, "title"));
    if (!byId[tingId]) {
      byId[tingId] = {
        tingId: tingId,
        title: title
      };
      episodes.push(byId[tingId]);
    } else if (title && title.length > ytbText(byId[tingId].title).length) {
      byId[tingId].title = title;
    }
    marker.lastIndex = close + 4;
  }
  return episodes.map(function (episode, index) {
    var title = ytbText(episode.title) || "第" + (index + 1) + "集";
    var playURL = YTB_SITE + "/book/ting/" + episode.tingId;
    var episodeLink = "yuetingba:ting:" + episode.tingId;
    return {
      id: playURL,
      type: "url",
      title: title,
      mediaType: "tv",
      episode: index + 1,
      link: playURL,
      externalUrl: playURL,
      description: title,
      source: "悦听吧",
      ytbBookId: bookId,
      ytbTingId: episode.tingId,
      ytbPlayURL: playURL,
      ytbInternalLink: episodeLink
    };
  });
}

function ytbBookIdFromValue(value) {
  var raw = ytbText(value);
  var detail = raw.match(/\/book\/detail\/([0-9a-f-]{36})/i);
  if (detail) return detail[1];
  var own = raw.match(/^yuetingba:book:([0-9a-f-]{36})$/i);
  if (own) return own[1];
  var shortOwn = raw.match(/^yuetingba:([0-9a-f-]{36})$/i);
  if (shortOwn) return shortOwn[1];
  var ting = raw.match(/\/book\/ting\/([0-9a-f-]{36})/i);
  if (ting) return ting[1];
  return "";
}

async function latestAll(params) {
  ytbApplyParams(params);
  var html = await ytbGetText(YTB_SITE + "/", YTB_SITE + "/");
  var items = ytbParseCards(html, "");
  if (items.length) return items;
  return latestBooks({ page: 1 });
}

async function ytbLoadTop(kind, page) {
  var html = await ytbGetText(
    YTB_SITE + "/top/" + kind + "/" + ytbPage(page),
    YTB_SITE + "/"
  );
  return ytbParseCards(html, kind === "recommend" ? "热门推荐" : "最新更新");
}

async function latestBooks(params) {
  ytbApplyParams(params);
  return ytbLoadTop("latest", params && params.page);
}

async function recommendBooks(params) {
  ytbApplyParams(params);
  return ytbLoadTop("recommend", params && params.page);
}

async function ytbLoadCategory(params, slug, title) {
  ytbApplyParams(params);
  var page = ytbPage(params && params.page);
  var html = await ytbGetText(
    YTB_SITE + "/book/" + slug + "/" + page,
    YTB_SITE + "/"
  );
  var items = ytbParseCards(html, title);
  if (items.length && items.length < 12) {
    try {
      var nextHTML = await ytbGetText(
        YTB_SITE + "/book/" + slug + "/" + (page + 1),
        YTB_SITE + "/book/" + slug + "/" + page
      );
      var seen = {};
      items.forEach(function (item) {
        seen[item.ytbBookId] = true;
      });
      ytbParseCards(nextHTML, title).forEach(function (item) {
        if (seen[item.ytbBookId]) return;
        seen[item.ytbBookId] = true;
        items.push(item);
      });
    } catch (error) {
      console.log("[forward.yuetingba] 分类补页失败，保留当前页:", error.message);
    }
  }
  return items;
}

async function categoryFantasy(params) {
  return ytbLoadCategory(params, "1", "玄幻");
}

async function categoryUrban(params) {
  return ytbLoadCategory(params, "4", "都市");
}

async function categoryHistory(params) {
  return ytbLoadCategory(params, "2", "历史");
}

async function categoryClassic(params) {
  return ytbLoadCategory(params, "6", "名著");
}

async function categoryFemale(params) {
  return ytbLoadCategory(params, "7", "女频");
}

async function categorySciFi(params) {
  return ytbLoadCategory(params, "5", "科幻");
}

async function categoryWuxia(params) {
  return ytbLoadCategory(params, "3", "武侠");
}

async function categoryStorytelling(params) {
  return ytbLoadCategory(params, "a", "评书");
}

async function categorySocial(params) {
  return ytbLoadCategory(params, "8", "社科");
}

async function searchYtb(params) {
  params = ytbApplyParams(params || {});
  var keyword = ytbText(
    params.keyword || params.query || params.title || params.name
  );
  if (!keyword) return [];
  var page = ytbPage(params.page);
  var url =
    YTB_SITE +
    "/search?name=" + encodeURIComponent(keyword) +
    "&type=1&pageIndex=" + page;
  var html = await ytbGetText(url, YTB_SITE + "/");
  return ytbParseCards(html, "");
}

async function loadDetail(source) {
  if (YTB_DIAGNOSTIC_CONSTANT_DETAIL) {
    if (source && typeof source === "object") ytbApplyParams(source);
    var diagnosticTitle = "悦听吧诊断";
    try {
      var diagnosticHTML = await ytbGetText(
        YTB_SITE + "/book/detail/3a233ba8-7391-4116-55db-7e06a5de6864/0",
        YTB_SITE + "/"
      );
      var parseStart = Date.now();
      var parsedEpisodes = ytbParsePlayURLs(
        diagnosticHTML,
        "3a233ba8-7391-4116-55db-7e06a5de6864"
      );
      var stageTimes = [];
      var stageStart = Date.now();
      ytbStripTags(
        ytbFirstMatch(
          diagnosticHTML,
          /<h1\b[^>]*class="[^"]*\bbook-detail-title\b[^"]*"[^>]*>([\s\S]*?)<\/h1>/i
        )
      );
      stageTimes.push("title=" + (Date.now() - stageStart));
      stageStart = Date.now();
      ytbStripTags(
        ytbFirstMatch(
          diagnosticHTML,
          /作\s*者：[\s\S]*?<a\b[^>]*href="[^"]*\/search\?type=2[^"]*"[^>]*>([\s\S]*?)<\/a>/i
        )
      );
      stageTimes.push("author=" + (Date.now() - stageStart));
      stageStart = Date.now();
      ytbStripTags(
        ytbFirstMatch(
          diagnosticHTML,
          /演\s*播：[\s\S]*?<a\b[^>]*href="[^"]*\/search\?type=3[^"]*"[^>]*>([\s\S]*?)<\/a>/i
        )
      );
      stageTimes.push("speaker=" + (Date.now() - stageStart));
      stageStart = Date.now();
      ytbStripTags(
        ytbFirstMatch(
          diagnosticHTML,
          /分\s*类：\s*<\/span>\s*<span\b[^>]*text-desc-content[^>]*>([\s\S]*?)<\/span>/i
        )
      );
      stageTimes.push("category=" + (Date.now() - stageStart));
      stageStart = Date.now();
      ytbStripTags(
        ytbFirstMatch(
          diagnosticHTML,
          /内容简介：[\s\S]*?<div\b[^>]*text-desc-content[^>]*>\s*<p>([\s\S]*?)<\/p>/i
        )
      );
      stageTimes.push("desc=" + (Date.now() - stageStart));
      diagnosticTitle =
        "悦听吧诊断 len=" + diagnosticHTML.length +
        " parse=" + parsedEpisodes.length +
        " ms=" + (Date.now() - parseStart) +
        " " + stageTimes.join(",") +
        " srcType=" + typeof source +
        " keys=" + (
          source && typeof source === "object"
            ? Object.keys(source).join("|").slice(0, 120)
            : ""
        ) +
        " link=" + (
          source && typeof source === "object"
            ? String(source.link || source.externalUrl || source.id || "").slice(0, 80)
            : String(source || "").slice(0, 80)
        );
    } catch (diagnosticError) {
      diagnosticTitle = "悦听吧诊断 err=" + diagnosticError.message;
    }
    return {
      id: "test:1",
      type: "url",
      title: diagnosticTitle,
      originalTitle: diagnosticTitle,
      description: "constant detail diagnostic",
      posterPath: "",
      detailPoster: "",
      backdropPath: "",
      backdropPaths: [],
      coverUrl: "",
      rating: 0,
      mediaType: "tv",
      genreTitle: "Test",
      genreItems: [],
      peoples: [],
      year: "",
      country: "",
      language: "国语",
      episodeCount: 3,
      episodeItems: [1, 2, 3].map(function (number) {
        return {
          id: "test:" + number,
          type: "url",
          title: "第" + number + "集",
          mediaType: "tv",
          episode: number,
          link: "test:" + number,
          externalUrl: "test:" + number,
          description: "第" + number + "集",
          source: "悦听吧"
        };
      }),
      videoUrl: "",
      playerType: "",
      link: "test:1",
      externalUrl: "test:1",
      source: "悦听吧"
    };
  }
  var value = source && typeof source === "object"
    ? source.link || source.externalUrl || source.id || ""
    : source;
  if (source && typeof source === "object") ytbApplyParams(source);
  var bookId = ytbBookIdFromValue(value);
  if (!bookId) throw new Error("无法识别悦听吧书籍 ID");

  var detailURL = YTB_SITE + "/book/detail/" + bookId + "/0";
  var html = await ytbGetText(detailURL, YTB_SITE + "/");
  var title =
    ytbStripTags(
      ytbFirstMatch(
        html,
        /<h1\b[^>]*class="[^"]*\bbook-detail-title\b[^"]*"[^>]*>([\s\S]*?)<\/h1>/i
      )
    ) ||
    ytbStripTags(
      ytbFirstMatch(html, /<h2\b[^>]*class="[^"]*hidden-xs[^"]*"[^>]*>([\s\S]*?)<\/h2>/i)
    );
  if (!title) throw new Error("悦听吧详情页解析失败");

  var coverTag = ytbFirstMatch(
    html,
    /<div\b[^>]*class="[^"]*\bbooks-detail-img\b[^"]*"[^>]*>[\s\S]*?(<img\b[^>]*>)/i
  );
  var poster = ytbAbsolute(ytbAttr(coverTag, "src"));
  var backdrop = ytbImage(poster);
  var author = ytbStripTags(
    ytbFirstMatch(
      html,
      /作\s*者：[\s\S]*?<a\b[^>]*href="[^"]*\/search\?type=2[^"]*"[^>]*>([\s\S]*?)<\/a>/i
    )
  );
  var speaker = ytbStripTags(
    ytbFirstMatch(
      html,
      /演\s*播：[\s\S]*?<a\b[^>]*href="[^"]*\/search\?type=3[^"]*"[^>]*>([\s\S]*?)<\/a>/i
    )
  );
  var category = ytbStripTags(
    ytbFirstMatch(
      html,
      /分\s*类：\s*<\/span>\s*<span\b[^>]*text-desc-content[^>]*>([\s\S]*?)<\/span>/i
    )
  );
  var status = ytbStripTags(
    ytbFirstMatch(
      html,
      /状\s*态：\s*<\/span>\s*<span\b[^>]*text-desc-content[^>]*>([\s\S]*?)<\/span>/i
    )
  );
  var countText = ytbStripTags(
    ytbFirstMatch(
      html,
      /集\s*数：\s*<\/span>\s*<span\b[^>]*text-desc-content[^>]*>([\s\S]*?)<\/span>/i
    )
  );
  var totalMatch = html.match(/（共\s*(\d+)\s*集）/);
  var totalEpisodes =
    (totalMatch && parseInt(totalMatch[1], 10)) ||
    (countText.match(/\d+/) ? parseInt(countText.match(/\d+/)[0], 10) : 0);

  var description = ytbStripTags(
    ytbFirstMatch(
      html,
      /内容简介：[\s\S]*?<div\b[^>]*text-desc-content[^>]*>\s*<p>([\s\S]*?)<\/p>/i
    )
  );
  var tags = [];
  var tagPattern = /<a\b[^>]*href="[^"]*tags=\d+[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  var tagMatch;
  while ((tagMatch = tagPattern.exec(html))) {
    var tag = ytbStripTags(tagMatch[1]);
    if (tag && tags.indexOf(tag) < 0) tags.push(tag);
  }

  var episodes = ytbParsePlayURLs(html, bookId);
  var limit = ytbRuntime.maxChapters || YTB_DEFAULT_CHAPTERS;
  var offset = 0;
  while (episodes.length && episodes.length < limit && episodes.length < totalEpisodes) {
    offset += YTB_PAGE_SIZE;
    var pageURL = YTB_SITE + "/book/detail/" + bookId + "/" + offset;
    var pageHTML;
    try {
      pageHTML = await ytbGetText(pageURL, detailURL);
    } catch (error) {
      console.log("[forward.yuetingba] 分集页读取失败，保留已加载队列:", error.message);
      break;
    }
    var nextEpisodes = ytbParsePlayURLs(pageHTML, bookId);
    if (!nextEpisodes.length) break;
    var existing = {};
    episodes.forEach(function (episode) {
      existing[episode.ytbTingId] = true;
    });
    var added = 0;
    nextEpisodes.forEach(function (episode) {
      if (existing[episode.ytbTingId]) return;
      existing[episode.ytbTingId] = true;
      episode.episode = episodes.length + 1;
      episodes.push(episode);
      added += 1;
    });
    if (!added) break;
  }
  episodes = episodes.slice(0, limit);
  var firstPlayback = null;
  if (episodes.length) {
    try {
      firstPlayback = await ytbPlayInfo(episodes[0].ytbTingId);
    } catch (error) {
      console.log("[forward.yuetingba] 详情首集预取失败，仍保留分集队列:", error.message);
    }
  }
  var publicEpisodes = episodes.map(function (episode, index) {
    return {
      id: episode.link,
      type: "url",
      title: episode.title,
      mediaType: "tv",
      episode: index + 1,
      link: episode.link,
      externalUrl: episode.link,
      description: episode.title
    };
  });

  var people = [];
  if (author) {
    people.push({
      id: "yuetingba-author-" + bookId + "-" + author,
      title: author,
      role: "作者"
    });
  }
  if (speaker) {
    people.push({
      id: "yuetingba-speaker-" + bookId + "-" + speaker,
      title: speaker,
      role: "演播"
    });
  }

  return {
    id: detailURL,
    type: "url",
    title: title,
    originalTitle: title,
    description: description,
    releaseDate: "",
    posterPath: poster,
    detailPoster: poster,
    backdropPath: backdrop,
    backdropPaths: backdrop ? [backdrop] : [],
    coverUrl: backdrop || poster,
    rating: 0,
    mediaType: "tv",
    genreTitle: [category].concat(tags).filter(Boolean).join(", "),
    genreItems: [category].concat(tags).filter(Boolean).map(function (tag, index) {
      return { id: "yuetingba-genre-" + index + "-" + tag, title: tag };
    }),
    peoples: people,
    year: "",
    country: "",
    language: "国语",
    episodeCount: totalEpisodes || episodes.length,
    episodeItems: publicEpisodes,
    videoUrl: firstPlayback && firstPlayback.audioUrl ? firstPlayback.audioUrl : "",
    playerType: firstPlayback && firstPlayback.audioUrl ? "app" : "",
    link: detailURL,
    externalUrl: detailURL,
    source: "悦听吧",
    ytbBookId: bookId,
    ytbAuthor: author,
    ytbSpeaker: speaker,
    ytbStatus: status,
    ytbFirstDirectUrl: firstPlayback && firstPlayback.audioUrl ? firstPlayback.audioUrl : ""
  };
}

function ytbTingIdFromValue(value) {
  var raw = ytbText(value);
  var play = raw.match(/\/book\/ting\/([0-9a-f-]{36})/i);
  if (play) return play[1];
  var own = raw.match(/^yuetingba:ting:([0-9a-f-]{36})$/i);
  if (own) return own[1];
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
    return raw;
  }
  return "";
}

async function ytbPlayInfo(tingId) {
  var apiURL =
    YTB_SITE +
    "/api/app/docs-listen/" +
    encodeURIComponent(tingId) +
    "/play-info";
  try {
    var info = await ytbGetJSON(apiURL, YTB_SITE + "/book/ting/" + tingId);
    if (info && info.audioUrl) return info;
  } catch (error) {
    console.log("[forward.yuetingba] 站内播放接口失败，改走播放页:", error.message);
  }

  var playURL = YTB_SITE + "/book/ting/" + tingId;
  var html = await ytbGetText(playURL, YTB_SITE + "/");
  var playsURL = ytbAttr(
    ytbFirstMatch(html, /(<div\b[^>]*\bid="tpCard"[^>]*>)/i),
    "data-plays-url"
  );
  if (!playsURL) {
    throw new Error("悦听吧播放页未找到音频服务地址");
  }
  var data = await ytbGetJSON(
    playsURL.replace(/\/+$/, "") +
      "/api/app/docs-listen/" +
      encodeURIComponent(tingId) +
      "/play-info",
    playURL,
    { Host: "yuetingba.cn" }
  );
  if (!data || !data.audioUrl) {
    throw new Error("悦听吧未返回有效音频地址");
  }
  return data;
}

async function loadResource(params) {
  params = ytbApplyParams(params || {});
  var candidates = [
    params.link,
    params.videoUrl,
    params.playUrl,
    params.url,
    params.externalUrl,
    params.id
  ];
  var raw = "";
  for (var index = 0; index < candidates.length; index += 1) {
    var value = candidates[index];
    if (value && typeof value === "object") {
      value = ytbText(value.link || value.videoUrl || value.externalUrl || value.id || value.url);
    } else {
      value = ytbText(value);
    }
    if (value) {
      raw = value;
      break;
    }
  }

  if (/^https?:\/\/[^\s]+\.(?:mp3|m4a)(?:\?|$)/i.test(raw)) {
    return [
      {
        name: ytbText(params.title || params.name) || "悦听吧音频",
        description: "来源：悦听吧\n详情页直链",
        url: raw,
        playerType: "app"
      }
    ];
  }

  var tingId = ytbTingIdFromValue(raw);
  var bookId = ytbBookIdFromValue(raw);
  if (!tingId && bookId) {
    var detailHTML = await ytbGetText(
      YTB_SITE + "/book/detail/" + bookId + "/0",
      YTB_SITE + "/"
    );
    var firstTing = detailHTML.match(/\/book\/ting\/([0-9a-f-]{36})/i);
    tingId = firstTing ? firstTing[1] : "";
  }
  if (!tingId) throw new Error("无法定位悦听吧播放章节");

  var info = await ytbPlayInfo(tingId);
  var audioURL = ytbText(info.audioUrl);
  if (!/^https?:\/\//i.test(audioURL)) {
    throw new Error("悦听吧返回的音频地址无效");
  }
  var bookName = ytbText(info.bookName);
  var tingTitle = ytbText(info.tingTitle);
  var name = [bookName, tingTitle].filter(Boolean).join(" · ") || "悦听吧音频";
  var nextId = ytbText(info.nextTingId);

  return [
    {
      name: name,
      description: [
        "来源：悦听吧",
        bookName ? "书名：" + bookName : "",
        info.speakerNames ? "演播：" + info.speakerNames : "",
        nextId ? "下一集已排队，播放结束后自动继续" : "已到最后一集"
      ].filter(Boolean).join("\n"),
      url: audioURL,
      playerType: "app",
      source: "悦听吧",
      ytbTingId: tingId,
      ytbBookId: ytbText(info.bookId),
      ytbNextTingId: nextId
    }
  ];
}
