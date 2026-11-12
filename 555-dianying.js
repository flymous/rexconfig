// 555电影 Forward source
// Site: https://555dy.com/
// The content domain is discovered from the 555dy.com portal at runtime.
//
// The public domain redirects to the current MacCMS mirror. This widget reads
// list/detail pages, follows each episode page, and returns its standard HLS
// playlist directly to Forward.

var WidgetMetadata = {
  id: "forward.555dy",
  title: "555电影",
  description: "自动读取 555dy.com 发布页的最新域名，并聚合详情页中的多条 HLS 线路",
  author: "Codex",
  site: "https://555dy.com/",
  iconurl: "https://vpic.cms.qq.com/nj_vpic/3272248629/1738571699548996690/3635677961821188660",
  version: "1.1.3",
  requiredVersion: "0.0.1",
  detailCacheDuration: 600,
  globalParams: [
    {
      name: "base_url",
      title: "备用站点",
      type: "input",
      value: "",
      description: "可选。留空时自动发现；仅当门户和缓存地址都不可用时，才会尝试这里填写的站点。"
    },
    {
      name: "portal_url",
      title: "域名发布页",
      type: "input",
      value: "https://www.555dy.com/",
      description: "从这里读取 site_main、site_1、site_2、site_3 等最新站点。"
    },
    {
      name: "max_lines",
      title: "最多播放线路",
      type: "input",
      value: "8",
      description: "同一集最多返回几条线路，建议 4-10 条；有效范围 1-16。"
    },
    {
      name: "welfare_base_url",
      title: "福利分区地址",
      type: "input",
      value: "https://555kp28.com",
      description: "独立的福利分类入口。与主站同构，留空时使用默认地址；不要填写末尾斜杠。"
    },
    {
      name: "welfare_verify_lines",
      title: "福利线路预检",
      type: "enumeration",
      value: "enabled",
      enumOptions: [
        { title: "启用", value: "enabled" },
        { title: "关闭", value: "disabled" }
      ],
      description: "播放前并发检测福利 HLS，自动过滤 403/404 并优先返回可用线路。"
    },
    {
      name: "line_probe_timeout",
      title: "线路预检超时",
      type: "input",
      value: "4500",
      description: "单条福利 HLS 预检超时毫秒，建议 3000-6000。"
    }
  ],
  modules: [
    {
      id: "latestAll",
      title: "最新推荐",
      functionName: "latestAll",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "latestMovies",
      title: "最新电影",
      functionName: "latestMovies",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "latestSeries",
      title: "最新连续剧",
      functionName: "latestSeries",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "latestVariety",
      title: "最新综艺纪录",
      functionName: "latestVariety",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "latestAnime",
      title: "最新动漫",
      functionName: "latestAnime",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "latestWelfare",
      title: "福利",
      functionName: "latestWelfare",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "loadResource",
      title: "555电影播放线路",
      description: "读取当前集数对应的 HLS 线路",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: []
    }
  ],
  search: {
    title: "搜索 555电影",
    functionName: "search555",
    params: [
      {
        name: "keyword",
        title: "搜索关键词",
        type: "input",
        value: "",
        placeholders: [
          { title: "小城良方", value: "小城良方" },
          { title: "剧情", value: "剧情" }
        ]
      },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

var FD555_DEFAULT_PORTAL = "https://www.555dy.com/";
var FD555_DEFAULT_BASE = "https://www.555k02.com";
var FD555_DEFAULT_WELFARE_BASE = "https://555kp28.com";
var FD555_LEGACY_BASES = [
  "https://555k40.com",
  "https://www.555k09.com",
  "https://555dy.com"
];
var FD555_SITE_STORAGE_KEY = "forward.555dy.resolved-site.v1";
var fd555SiteState = {
  base: "",
  checkedAt: 0,
  portal: ""
};
var fd555SitePromise = null;
var FD555_TIMEOUT = 20000;
var FD555_IMAGE_PROXY = "https://images.weserv.nl/";
var FD555_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/142.0.0.0 Safari/537.36";

function fd555Text(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function fd555DecodeEntities(value) {
  return fd555Text(value)
    .replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/&#(\d+);/g, function (_, number) {
      return String.fromCharCode(parseInt(number, 10));
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&ensp;/gi, " ")
    .replace(/&emsp;/gi, " ")
    .replace(/&middot;/gi, "·")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function fd555StripTags(value) {
  return fd555DecodeEntities(
    fd555Text(value)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function fd555Attr(source, name) {
  var escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var match = fd555Text(source).match(
    new RegExp("\\b" + escaped + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i")
  );
  if (!match) return "";
  return fd555DecodeEntities(match[1] || match[2] || match[3] || "");
}

function fd555Page(value) {
  var page = parseInt(fd555Text(value || 1), 10);
  if (!isFinite(page) || page < 1) page = 1;
  return Math.min(page, 100000);
}

function fd555Base(value) {
  var base = fd555Text(value || FD555_DEFAULT_BASE);
  if (!/^https?:\/\//i.test(base)) base = "https://" + base;
  return base.replace(/\/+$/, "");
}

function fd555Origin(value) {
  var match = fd555Text(value).match(/^(https?:\/\/[^/]+)/i);
  return match ? match[1] : "";
}

function fd555Absolute(base, value) {
  var href = fd555Text(value);
  if (!href) return "";
  if (/^https?:\/\//i.test(href)) return href;
  if (href.indexOf("//") === 0) return "https:" + href;
  if (href.charAt(0) === "/") return base + href;
  return base + "/" + href.replace(/^\.?\//, "");
}

function fd555WideImage(poster) {
  var source = fd555Text(poster);
  if (!source) return "";
  var upstream = source.replace(/^https?:\/\//i, "");
  return FD555_IMAGE_PROXY +
    "?url=" + encodeURIComponent(upstream) +
    "&w=1280&h=720&fit=cover&output=webp&q=84";
}

function fd555Headers(base) {
  return {
    "User-Agent": FD555_USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
    "Referer": base + "/"
  };
}

function fd555Status(response) {
  return Number(
    (response && (response.statusCode || response.status || response.code)) || 200
  );
}

async function fd555GetText(url, base, referer, timeout) {
  var headers = fd555Headers(base);
  if (referer) headers.Referer = referer;
  var response = await Widget.http.get(url, {
    headers: headers,
    timeout: timeout || FD555_TIMEOUT
  });
  var status = fd555Status(response);
  if (status < 200 || status >= 300) {
    throw new Error("HTTP " + status + ": " + url);
  }
  var data = response && response.data !== undefined ? response.data : response;
  return typeof data === "string" ? data : fd555Text(data);
}

function fd555NormalizeSite(value) {
  var raw = fd555Text(value);
  if (!raw) return "";
  var match = raw.match(
    /^(?:https?:\/\/)?((?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:[\/?#]|$)/i
  );
  if (!match) return "";
  return "https://" + match[1].toLowerCase();
}

function fd555PushSite(list, seen, value) {
  var base = fd555NormalizeSite(value);
  if (!base || seen[base]) return;
  seen[base] = true;
  list.push(base);
}

function fd555StorageGet(key) {
  if (!Widget.storage || typeof Widget.storage.get !== "function") return null;
  try {
    var raw = Widget.storage.get(key);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    return null;
  }
}

function fd555StorageSet(key, value) {
  if (!Widget.storage || typeof Widget.storage.set !== "function") return false;
  try {
    Widget.storage.set(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function fd555RememberMainBase(base, portal) {
  var normalized = fd555NormalizeSite(base);
  if (!normalized) return "";
  var portalURL = fd555Text(portal || FD555_DEFAULT_PORTAL);
  fd555SiteState = {
    base: normalized,
    checkedAt: Date.now(),
    portal: portalURL
  };
  fd555StorageSet(FD555_SITE_STORAGE_KEY, {
    base: normalized,
    portal: portalURL,
    checkedAt: fd555SiteState.checkedAt
  });
  return normalized;
}

function fd555PortalSites(html) {
  var sites = [];
  var seen = {};
  var encoded = fd555FirstMatch(
    html,
    /<[^>]*\bid=["']domainData["'][^>]*\bdata-info=["']([^"']+)["']/i
  );
  if (!encoded) {
    encoded = fd555FirstMatch(
      html,
      /<[^>]*\bdata-info=["']([^"']+)["'][^>]*\bid=["']domainData["']/i
    );
  }
  if (encoded) {
    try {
      var info = JSON.parse(fd555Base64Decode(encoded));
      var keys = Object.keys(info || {}).filter(function (key) {
        return /^site_(?:main|\d+)$/i.test(key);
      });
      keys.sort(function (left, right) {
        if (/^site_main$/i.test(left)) return -1;
        if (/^site_main$/i.test(right)) return 1;
        var leftNumber = parseInt(left.replace(/\D+/g, ""), 10) || 0;
        var rightNumber = parseInt(right.replace(/\D+/g, ""), 10) || 0;
        return leftNumber - rightNumber;
      });
      keys.forEach(function (key) {
        fd555PushSite(sites, seen, info[key]);
      });
    } catch (error) {
      console.log("[forward.555dy] 门户域名数据解码失败:", error.message);
    }
  }
  var copied = fd555FirstMatch(
    html,
    /text\s*:\s*function\s*\([^)]*\)\s*\{[\s\S]*?return\s+["']([^"']+)["']/i
  );
  fd555PushSite(sites, seen, copied);
  return sites;
}

async function fd555ProbeSite(base, depth) {
  var current = fd555NormalizeSite(base);
  if (!current || depth > 3) return "";
  try {
    var html = await fd555GetText(
      current + "/index/home.html",
      current,
      current + "/",
      10000
    );
    if (html.length < 1000) {
      var redirect = fd555FirstMatch(
        html,
        /window\.location\s*=\s*["'](https?:\/\/[^"']+)["']/i
      );
      if (redirect) return fd555ProbeSite(redirect, depth + 1);
    }
    if (/官网永久发布页|id=["']domainData["']/i.test(html)) return "";
    if (
      /var\s+maccms/i.test(html) ||
      /module-poster-item|\/voddetail\/\d+\.html|555电影/i.test(html)
    ) {
      return current;
    }
  } catch (error) {
    return "";
  }
  return "";
}

async function fd555DiscoverSite(params, failedBase) {
  params = params || {};
  var portal = fd555Text(params.portal_url || FD555_DEFAULT_PORTAL);
  if (!/^https?:\/\//i.test(portal)) portal = "https://" + portal;
  var candidates = [];
  var seen = {};
  try {
    var portalHTML = await fd555GetText(
      portal,
      fd555Origin(portal) || FD555_DEFAULT_PORTAL,
      portal,
      12000
    );
    fd555PortalSites(portalHTML).forEach(function (site) {
      fd555PushSite(candidates, seen, site);
    });
  } catch (error) {
    console.log("[forward.555dy] 域名发布页读取失败:", error.message);
  }

  var cached = fd555StorageGet(FD555_SITE_STORAGE_KEY);
  if (cached && cached.base && cached.base !== failedBase) {
    fd555PushSite(candidates, seen, cached.base);
  }
  fd555PushSite(candidates, seen, params.base_url);
  FD555_LEGACY_BASES.forEach(function (site) {
    fd555PushSite(candidates, seen, site);
  });

  for (var index = 0; index < candidates.length; index += 1) {
    var base = await fd555ProbeSite(candidates[index], 0);
    if (!base) continue;
    fd555RememberMainBase(base, portal);
    console.log("[forward.555dy] 当前可用站点:", base);
    return base;
  }

  throw new Error("555dy.com 门户和候选站点均不可用");
}

function fd555ResolveMainBase(params) {
  params = params || {};
  if (fd555SiteState.base) return fd555SiteState.base;
  var cached = fd555StorageGet(FD555_SITE_STORAGE_KEY);
  if (cached && cached.base) {
    fd555SiteState = {
      base: fd555NormalizeSite(cached.base),
      checkedAt: Number(cached.checkedAt) || 0,
      portal: fd555Text(cached.portal)
    };
    if (fd555SiteState.base) return fd555SiteState.base;
  }
  if (fd555Text(params.base_url)) {
    var manual = fd555NormalizeSite(params.base_url);
    if (manual) return manual;
  }
  return FD555_DEFAULT_BASE;
}

async function fd555RefreshMainBase(params, failedBase) {
  if (fd555SitePromise) return fd555SitePromise;
  fd555SitePromise = fd555DiscoverSite(params, failedBase);
  try {
    return await fd555SitePromise;
  } finally {
    fd555SitePromise = null;
  }
}

function fd555LooksLikeContentPage(html) {
  var page = fd555Text(html);
  return page.length > 500 &&
    !/官网永久发布页|id=["']domainData["']/i.test(page) &&
    (
      /var\s+maccms/i.test(page) ||
      /module-poster-item|\/voddetail\/\d+\.html|player_aaaa/i.test(page)
    );
}

async function fd555GetSiteContent(path, params) {
  params = params || {};
  var base = fd555ResolveMainBase(params);
  try {
    var html = await fd555GetText(base + path, base);
    if (!fd555LooksLikeContentPage(html)) {
      throw new Error("返回内容不是 555电影页面");
    }
    fd555RememberMainBase(base, params.portal_url);
    return { base: base, html: html };
  } catch (firstError) {
    console.log(
      "[forward.555dy] 当前站点读取失败，开始查询最新域名:",
      firstError.message
    );
    var freshBase = await fd555RefreshMainBase(params, base);
    var freshHTML = await fd555GetText(freshBase + path, freshBase);
    if (!fd555LooksLikeContentPage(freshHTML)) {
      throw new Error("新站点仍未返回 555电影内容");
    }
    return { base: freshBase, html: freshHTML };
  }
}

function fd555MediaType(category, note) {
  var type = fd555Text(category);
  var status = fd555Text(note);
  if (type.indexOf("电影") >= 0 || type === "movie") return "movie";
  if (type.indexOf("连续剧") >= 0 || type.indexOf("剧集") >= 0) return "tv";
  if (type.indexOf("动漫") >= 0 || type.indexOf("综艺") >= 0) return "tv";
  if (/更新至|第\s*\d+\s*[集话期]|全\s*\d+\s*集|完结/.test(status)) return "tv";
  return "movie";
}

function fd555EpisodeCount(note) {
  var value = fd555Text(note);
  var match = value.match(/(?:更新至|第|全|共)\s*(\d+)\s*[集话期]/);
  if (match) return parseInt(match[1], 10) || 0;
  if (/正片|HD|BD|TC|高清/i.test(value)) return 1;
  return 0;
}

function fd555Item(data) {
  var title = fd555Text(data.title);
  var url = fd555Text(data.url);
  var poster = fd555Text(data.poster);
  var note = fd555Text(data.note);
  var category = fd555Text(data.category);
  var yearMatch = fd555Text(data.year || data.info).match(/(?:19|20)\d{2}/);
  var year = yearMatch ? yearMatch[0] : fd555Text(data.year);
  var mediaType = fd555MediaType(category, note);
  var wideImage = fd555WideImage(poster);
  return {
    id: url,
    type: "url",
    title: title,
    originalTitle: title,
    description: [category, note, fd555Text(data.actors)]
      .filter(Boolean)
      .join(" · "),
    posterPath: poster,
    detailPoster: poster,
    backdropPath: wideImage,
    backdropPaths: wideImage ? [wideImage] : [],
    coverUrl: wideImage || poster,
    rating: Number(data.rating || 0) || 0,
    mediaType: mediaType,
    genreTitle: fd555Text(data.genres),
    year: year,
    country: fd555Text(data.country),
    episodeCount: fd555EpisodeCount(note),
    link: url,
    externalUrl: url,
    source: "555电影",
    fd555Id: fd555Text(data.id),
    fd555Category: category,
    fd555Status: note
  };
}

function fd555ParsePosterItems(html, base, category) {
  var items = [];
  var seen = {};
  var anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  var match;
  while ((match = anchorPattern.exec(html))) {
    var attrs = match[1] || "";
    var body = match[2] || "";
    if (!/\bmodule-poster-item\b/i.test(attrs)) continue;
    var href = fd555Attr(attrs, "href");
    var idMatch = href.match(/\/voddetail\/(\d+)\.html/i);
    if (!idMatch) continue;
    var title =
      fd555Attr(attrs, "title") ||
      fd555StripTags(
        (body.match(/<div\b[^>]*module-poster-item-title[^>]*>([\s\S]*?)<\/div>/i) || [])[1]
      ) ||
      fd555Attr(body, "alt");
    if (!title || seen[idMatch[1]]) continue;
    seen[idMatch[1]] = true;
    var note =
      fd555StripTags(
        (body.match(/<div\b[^>]*module-item-note[^>]*>([\s\S]*?)<\/div>/i) || [])[1]
      ) || "";
    var ratingMatch = body.match(/豆瓣\s*[:：]?\s*([\d.]+)\s*分/i);
    var poster =
      fd555Attr(body, "data-original") ||
      fd555Attr(body, "data-src") ||
      fd555Attr(body, "src");
    items.push(
      fd555Item({
        id: idMatch[1],
        title: title,
        url: fd555Absolute(base, "/voddetail/" + idMatch[1] + ".html"),
        poster: poster,
        note: note,
        category: category,
        rating: ratingMatch ? ratingMatch[1] : 0
      })
    );
  }
  return items;
}

function fd555ParseSearchCards(html, base) {
  var items = [];
  var seen = {};
  var pattern =
    /<div\b[^>]*class=["'][^"']*\bmodule-card-item\b[^"']*["'][^>]*>([\s\S]*?)<div\b[^>]*class=["'][^"']*\bmodule-card-item-footer\b[^"']*["'][^>]*>/gi;
  var match;
  while ((match = pattern.exec(html))) {
    var body = match[1] || "";
    var href = fd555Attr(body, "href");
    var idMatch = href.match(/\/voddetail\/(\d+)\.html/i);
    if (!idMatch || seen[idMatch[1]]) continue;
    seen[idMatch[1]] = true;
    var title =
      fd555StripTags(
        (body.match(/<div\b[^>]*module-card-item-title[^>]*>([\s\S]*?)<\/div>/i) || [])[1]
      ) || fd555Attr(body, "alt");
    if (!title) continue;
    var category = fd555StripTags(
      (body.match(/<div\b[^>]*module-card-item-class[^>]*>([\s\S]*?)<\/div>/i) || [])[1]
    );
    var note = fd555StripTags(
      (body.match(/<div\b[^>]*module-item-note[^>]*>([\s\S]*?)<\/div>/i) || [])[1]
    );
    var poster =
      fd555Attr(body, "data-original") ||
      fd555Attr(body, "data-src") ||
      fd555Attr(body, "src");
    var infoBlocks = [];
    var infoPattern =
      /<div\b[^>]*class=["'][^"']*\bmodule-info-item-content\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
    var infoMatch;
    while ((infoMatch = infoPattern.exec(body))) {
      var infoText = fd555StripTags(infoMatch[1]);
      if (infoText) infoBlocks.push(infoText);
    }
    var meta = infoBlocks[0] || "";
    var actors = infoBlocks[1] || "";
    var metaParts = meta.split(/\s*\/\s*/);
    items.push(
      fd555Item({
        id: idMatch[1],
        title: title,
        url: fd555Absolute(base, "/voddetail/" + idMatch[1] + ".html"),
        poster: poster,
        note: note,
        category: category,
        info: meta,
        year: metaParts[0] || "",
        country: metaParts[1] || "",
        genres: metaParts.slice(2).join(", "),
        actors: actors
      })
    );
  }
  return items;
}

async function fd555LoadList(type, params, category) {
  params = params || {};
  var page = fd555Page(params.page);
  var content = await fd555GetSiteContent(
    "/vodshow/" + type + "--------" + page + "---.html",
    params
  );
  return fd555ParsePosterItems(content.html, content.base, category);
}

async function latestAll(params) {
  params = params || {};
  var page = fd555Page(params.page);
  if (page === 1) {
    var content = await fd555GetSiteContent("/index/home.html", params);
    var items = fd555ParsePosterItems(content.html, content.base, "");
    if (items.length) return items;
  }
  return fd555LoadList("1", params, "电影");
}

async function latestMovies(params) {
  return fd555LoadList("1", params || {}, "电影");
}

async function latestSeries(params) {
  return fd555LoadList("2", params || {}, "连续剧");
}

async function latestVariety(params) {
  return fd555LoadList("3", params || {}, "综艺纪录");
}

async function latestAnime(params) {
  return fd555LoadList("4", params || {}, "动漫");
}

async function latestWelfare(params) {
  params = params || {};
  var base = fd555Base(params.welfare_base_url || FD555_DEFAULT_WELFARE_BASE);
  var page = fd555Page(params.page);
  var url = base + "/vodshow/124--------" + page + "---.html";
  var html = await fd555GetText(url, base);
  return fd555ParsePosterItems(html, base, "福利");
}

async function search555(params) {
  params = params || {};
  var keyword = fd555Text(
    params.keyword || params.query || params.tags || params.title
  );
  if (!keyword) return [];
  var page = fd555Page(params.page);
  var content = await fd555GetSiteContent(
    "/vodsearch/" +
      encodeURIComponent(keyword) +
      "----------" +
      page +
      "---.html",
    params
  );
  var items = fd555ParseSearchCards(content.html, content.base);
  if (items.length) return items;
  return fd555ParsePosterItems(content.html, content.base, "");
}

function fd555ParsePlayGroups(html) {
  var groups = {};
  var order = [];
  var seen = {};
  var pattern =
    /<a\b([^>]*href=["'][^"']*\/vodplay\/(\d+)-(\d+)-(\d+)\.html[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi;
  var match;
  while ((match = pattern.exec(html))) {
    var attrs = match[1] || "";
    var videoId = match[2];
    var sid = match[3];
    var nid = match[4];
    var body = match[5] || "";
    if (!/\bmodule-play-list-link\b/i.test(attrs)) continue;
    var url = "/vodplay/" + videoId + "-" + sid + "-" + nid + ".html";
    if (seen[url]) continue;
    seen[url] = true;
    var label =
      fd555StripTags(
        (body.match(/<span\b[^>]*>([\s\S]*?)<\/span>/i) || [])[1]
      ) ||
      fd555StripTags(fd555Attr(attrs, "title")) ||
      "第" + nid + "集";
    if (!groups[sid]) {
      groups[sid] = [];
      order.push(sid);
    }
    groups[sid].push({
      url: url,
      sid: sid,
      nid: nid,
      label: label
    });
  }
  return { groups: groups, order: order, videoId: "" };
}

function fd555ParseSourceNames(html) {
  var names = [];
  var pattern =
    /<div\b[^>]*class=["'][^"']*\bmodule-tab-item\b[^"']*["'][^>]*data-dropdown-value=["']([^"']+)["'][^>]*>/gi;
  var match;
  while ((match = pattern.exec(html))) {
    var name = fd555StripTags(match[1]);
    if (name && names.indexOf(name) < 0) names.push(name);
  }
  return names;
}

function fd555MapSourceNames(html, playGroups) {
  var names = fd555ParseSourceNames(html);
  var map = {};
  for (var i = 0; i < playGroups.order.length; i += 1) {
    map[playGroups.order[i]] = names[i] || "线路" + (i + 1);
  }
  return map;
}

function fd555FirstMatch(html, pattern) {
  var match = html.match(pattern);
  return match ? match[1] || "" : "";
}

function fd555ParseInfoLinks(fragment) {
  var values = [];
  var pattern = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  var match;
  while ((match = pattern.exec(fragment))) {
    var value = fd555StripTags(match[1]);
    if (value && values.indexOf(value) < 0) values.push(value);
  }
  return values;
}

function fd555ParseDetail(html, base, videoId) {
  var title = fd555StripTags(fd555FirstMatch(
    html,
    /<div\b[^>]*class=["'][^"']*\bmodule-info-heading\b[^"']*["'][^>]*>[\s\S]*?<h1\b[^>]*>([\s\S]*?)<\/h1>/i
  ));
  if (!title) title = fd555StripTags(fd555FirstMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i))
    .replace(/\s*[-_].*$/i, "");
  var description = fd555StripTags(fd555FirstMatch(
    html,
    /<div\b[^>]*class=["'][^"']*\bmodule-info-introduction-content\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  ));
  var posterSection = fd555FirstMatch(
    html,
    /<div\b[^>]*class=["'][^"']*\bmodule-info-poster\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i
  );
  var poster = fd555Attr(posterSection, "data-original") || fd555Attr(posterSection, "src");
  var widePoster = fd555WideImage(poster);
  var tagsStart = html.search(
    /<div\b[^>]*class=["'][^"']*\bmodule-info-tag\b[^"']*["'][^>]*>/i
  );
  var tagsFragment = "";
  if (tagsStart >= 0) {
    var tagsEnd = html.indexOf('<div class="module-info-content"', tagsStart);
    if (tagsEnd < 0) tagsEnd = Math.min(html.length, tagsStart + 12000);
    tagsFragment = html.slice(tagsStart, tagsEnd);
    var mobilePlayStart = tagsFragment.indexOf('<div class="module-mobile-play"');
    if (mobilePlayStart >= 0) tagsFragment = tagsFragment.slice(0, mobilePlayStart);
  }
  var tags = fd555ParseInfoLinks(tagsFragment);
  var year = "";
  var country = "";
  var genres = [];
  for (var i = 0; i < tags.length; i += 1) {
    if (!year && /^(?:19|20)\d{2}$/.test(tags[i])) {
      year = tags[i];
    } else if (!country) {
      country = tags[i];
    } else {
      genres.push(tags[i]);
    }
  }
  function infoValue(label) {
    var escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return fd555StripTags(fd555FirstMatch(
      html,
      new RegExp(
        "<span\\b[^>]*module-info-item-title[^>]*>\\s*" +
          escaped +
          "\\s*[:：]?\\s*</span>\\s*<div\\b[^>]*module-info-item-content[^>]*>([\\s\\S]*?)</div>",
        "i"
      )
    ));
  }
  var director = infoValue("导演");
  var actors = infoValue("主演");
  var rating = fd555FirstMatch(
    html,
    /豆瓣\s*[:：]?\s*([\d.]+)\s*分/i
  );
  var playGroups = fd555ParsePlayGroups(html);
  playGroups.videoId = videoId;
  var sourceNames = fd555MapSourceNames(html, playGroups);
  var mainSid = playGroups.order[0] || "";
  var mainEpisodes = mainSid ? playGroups.groups[mainSid] || [] : [];
  var detailURL = base + "/voddetail/" + videoId + ".html";
  var episodeItems = mainEpisodes.map(function (episode, index) {
    var episodeURL = fd555Absolute(base, episode.url);
    return {
      id: episodeURL,
      type: "url",
      title: episode.label,
      mediaType: "tv",
      episode: index + 1,
      link: episodeURL,
      externalUrl: episodeURL,
      posterPath: poster,
      backdropPath: widePoster,
      description: title + " · " + episode.label,
      source: "555电影",
      fd555Id: videoId,
      fd555Sid: episode.sid,
      fd555Nid: episode.nid
    };
  });
  var historyType = fd555FirstMatch(
    html,
    /class=["'][^"']*\bmac_history_set\b[^"']*["'][^>]*\balt=["']\[([^\]]+)\]/i
  );
  var mediaType = /电影/.test(historyType)
    ? "movie"
    : (
      /连续剧|剧集|动漫|综艺|纪录片/.test(historyType) ||
      mainEpisodes.length > 1
    )
      ? "tv"
      : "movie";
  var item = fd555Item({
    id: videoId,
    title: title,
    url: detailURL,
    poster: poster,
    note: episodeItems.length ? "共" + episodeItems.length + "集" : "",
    category: mediaType === "movie" ? "电影" : "连续剧",
    rating: rating,
    year: year,
    country: country,
    genres: genres.join(", "),
    actors: actors
  });
  item.description = description || item.description;
  item.peoples = (director ? [{ id: "555-director-" + videoId, title: director, role: "导演" }] : [])
    .concat(
      actors.split(/\s*[,，/]\s*/).filter(Boolean).map(function (name) {
        return { id: "555-actor-" + videoId + "-" + name, title: name, role: "演员" };
      })
    );
  item.episodeCount = episodeItems.length || 1;
  item.episodeItems = episodeItems;
  item.fd555SidOrder = playGroups.order;
  item.fd555SourceNames = sourceNames;
  item.fd555Groups = playGroups.groups;
  return item;
}

function fd555ResourceInfo(params) {
  params = params || {};
  var candidates = [
    params.link,
    params.videoUrl,
    params.playUrl,
    params.url,
    params.externalUrl,
    params.id,
    params.videoId
  ];
  var raw = "";
  for (var i = 0; i < candidates.length; i += 1) {
    if (fd555Text(candidates[i])) {
      raw = fd555Text(candidates[i]);
      break;
    }
  }
  var playMatch = raw.match(
    /\/vodplay\/(\d+)-(\d+)-(\d+)\.html/i
  );
  var detailMatch = raw.match(/\/voddetail\/(\d+)\.html/i);
  var videoId = "";
  if (playMatch) videoId = playMatch[1];
  else if (detailMatch) videoId = detailMatch[1];
  else {
    var idMatch = raw.match(/(?:^|[^\d])(\d{3,})(?:[^\d]|$)/);
    if (idMatch) videoId = idMatch[1];
  }
  return {
    raw: raw,
    base: fd555Origin(raw) || fd555Base(params.base_url),
    videoId: videoId,
    sid: playMatch ? playMatch[2] : "",
    nid: playMatch ? playMatch[3] : ""
  };
}

function fd555NormalizeMatchTitle(value) {
  return fd555Text(value)
    .toLowerCase()
    .replace(/[\s:：·・\-—_.,，。!！?？'"“”‘’()（）[\]【】]/g, "");
}

function fd555TMDBYear(item) {
  var year = parseInt(fd555Text(item && item.year), 10);
  return isFinite(year) && year > 0 ? year : 0;
}

function fd555TMDBCandidateYear(candidate, mediaType) {
  var date = mediaType === "movie"
    ? candidate.release_date
    : candidate.first_air_date;
  if (!date) return 0;
  var year = parseInt(String(date).slice(0, 4), 10);
  return isFinite(year) ? year : 0;
}

function fd555SelectTMDBCandidate(results, item) {
  if (!Array.isArray(results) || !results.length) return null;
  var target = fd555NormalizeMatchTitle(item.title);
  if (!target) return null;
  var targetYear = fd555TMDBYear(item);
  var best = null;
  var bestScore = 0;
  results.forEach(function (candidate) {
    if (!candidate) return;
    var candidateYear = fd555TMDBCandidateYear(candidate, item.mediaType);
    var names = [
      candidate.title,
      candidate.name,
      candidate.original_title,
      candidate.original_name
    ].map(fd555NormalizeMatchTitle).filter(Boolean);
    var score = 0;
    var exactName = false;
    names.forEach(function (name) {
      if (name === target) {
        score = Math.max(score, 100);
        exactName = true;
      } else if (
        target.length >= 3 &&
        (name.indexOf(target) >= 0 || target.indexOf(name) >= 0)
      ) {
        score = Math.max(score, 75);
      }
    });
    if (!score) return;
    if (targetYear && candidateYear) {
      if (candidateYear === targetYear) score += 10;
      else if (Math.abs(candidateYear - targetYear) <= 1) score += 3;
      else if (exactName) score -= 5;
      else return;
    }
    if (candidate.backdrop_path) score += 3;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });
  return bestScore >= 75 ? best : null;
}

async function fd555TMDBResults(item, includeYear) {
  var path = item.mediaType === "movie" ? "search/movie" : "search/tv";
  var params = {
    query: item.title,
    language: "zh-CN",
    include_adult: false,
    page: 1
  };
  var year = fd555TMDBYear(item);
  if (includeYear && year) {
    params[item.mediaType === "movie" ? "year" : "first_air_date_year"] = year;
  }
  var response = await Widget.tmdb.get(path, { params: params });
  if (!response) return [];
  return Array.isArray(response) ? response : (response.results || []);
}

async function fd555DoubanEnglishTitle(item) {
  if (!item || !item.title) return "";
  try {
    var response = await Widget.http.get(
      "https://movie.douban.com/j/subject_suggest?q=" +
        encodeURIComponent(item.title),
      {
        headers: {
          "User-Agent": FD555_USER_AGENT,
          "Accept": "application/json,text/plain,*/*",
          "Referer": "https://movie.douban.com/"
        },
        timeout: 12000
      }
    );
    var data = response && response.data !== undefined ? response.data : response;
    if (typeof data === "string") data = JSON.parse(data);
    var results = Array.isArray(data) ? data : [];
    var target = fd555NormalizeMatchTitle(item.title);
    var targetYear = fd555TMDBYear(item);
    var matches = results.filter(function (entry) {
      return entry &&
        fd555NormalizeMatchTitle(entry.title) === target;
    });
    matches.sort(function (left, right) {
      var leftYear = parseInt(fd555Text(left.year), 10) || 0;
      var rightYear = parseInt(fd555Text(right.year), 10) || 0;
      var leftDiff = targetYear && leftYear ? Math.abs(leftYear - targetYear) : 99;
      var rightDiff = targetYear && rightYear ? Math.abs(rightYear - targetYear) : 99;
      return leftDiff - rightDiff;
    });
    if (!matches.length) return "";
    var aliases = fd555Text(matches[0].sub_title)
      .split(/\s*[/|；;]\s*/)
      .map(function (value) { return fd555Text(value); })
      .filter(function (value) { return /[a-z]/i.test(value); });
    return aliases[0] || "";
  } catch (error) {
    console.log("[forward.555dy] 中英文片名转换失败:", error.message);
    return "";
  }
}

async function fd555CinemetaMatch(title, item) {
  try {
    var type = item.mediaType === "movie" ? "movie" : "series";
    var response = await Widget.http.get(
      "https://v3-cinemeta.strem.io/catalog/" +
        type +
        "/top/search=" +
        encodeURIComponent(title) +
        ".json",
      {
        headers: {
          "User-Agent": FD555_USER_AGENT,
          "Accept": "application/json,text/plain,*/*"
        },
        timeout: 12000
      }
    );
    var data = response && response.data !== undefined ? response.data : response;
    if (typeof data === "string") data = JSON.parse(data);
    var metas = data && Array.isArray(data.metas) ? data.metas : [];
    var target = fd555NormalizeMatchTitle(title);
    return metas.find(function (meta) {
      return meta &&
        fd555NormalizeMatchTitle(meta.name) === target &&
        (
          !fd555TMDBYear(item) ||
          !parseInt(fd555Text(meta.releaseInfo || meta.year), 10) ||
          Math.abs(
            parseInt(fd555Text(meta.releaseInfo || meta.year), 10) -
              fd555TMDBYear(item)
          ) <= 2
        );
    }) || null;
  } catch (error) {
    console.log("[forward.555dy] Cinemeta 高清图匹配失败:", error.message);
    return null;
  }
}

async function fd555EnrichDetailImages(item) {
  if (!item || !item.title) {
    return item;
  }
  try {
    var candidate = null;
    var tmdbAvailable = Widget.tmdb && typeof Widget.tmdb.get === "function";
    if (tmdbAvailable && fd555TMDBYear(item)) {
      candidate = fd555SelectTMDBCandidate(
        await fd555TMDBResults(item, true),
        item
      );
    }
    if (tmdbAvailable && !candidate) {
      candidate = fd555SelectTMDBCandidate(
        await fd555TMDBResults(item, false),
        item
      );
    }
    var englishTitle = "";
    if (!candidate) {
      englishTitle = await fd555DoubanEnglishTitle(item);
      if (englishTitle && tmdbAvailable) {
        console.log(
          "[forward.555dy] 使用英文原名重新匹配 TMDB:",
          item.title,
          englishTitle
        );
        var aliasItem = {
          title: englishTitle,
          year: item.year,
          mediaType: item.mediaType
        };
        candidate = fd555SelectTMDBCandidate(
          await fd555TMDBResults(aliasItem, false),
          aliasItem
        );
        if (candidate) item.originalTitle = englishTitle;
      }
    }
    if (!candidate && englishTitle) {
      var cinemeta = await fd555CinemetaMatch(englishTitle, item);
      if (cinemeta) {
        if (cinemeta.background) {
          var metaBackdrop = cinemeta.background.replace(
            "/background/medium/",
            "/background/large/"
          );
          item.backdropPath = metaBackdrop;
          item.backdropPaths = [metaBackdrop];
        }
        if (cinemeta.poster) {
          var metaPoster = cinemeta.poster.replace(
            "/poster/small/",
            "/poster/large/"
          );
          item.posterPath = metaPoster;
          item.detailPoster = metaPoster;
          item.coverUrl = metaPoster;
        }
        item.imdbId = cinemeta.imdb_id || cinemeta.id;
        item.originalTitle = englishTitle;
        console.log(
          "[forward.555dy] 详情图片已匹配 Cinemeta:",
          item.title,
          englishTitle
        );
        return item;
      }
    }
    if (!candidate) return item;

    if (candidate.backdrop_path) {
      var backdrop = "https://image.tmdb.org/t/p/original" +
        candidate.backdrop_path;
      item.backdropPath = backdrop;
      item.backdropPaths = [backdrop];
    }
    if (candidate.poster_path) {
      var poster = "https://image.tmdb.org/t/p/original" +
        candidate.poster_path;
      item.posterPath = poster;
      item.detailPoster = poster;
      item.coverUrl = poster;
    }
    item.tmdbId = candidate.id;
    console.log(
      "[forward.555dy] 详情图片已匹配 TMDB:",
      item.title,
      candidate.title || candidate.name || candidate.id
    );
    return item;
  } catch (error) {
    console.log(
      "[forward.555dy] TMDB 高清横图匹配失败，使用 16:9 代理图:",
      error.message
    );
    return item;
  }
}

async function fd555LoadDetailData(info, params) {
  var path = "/voddetail/" + info.videoId + ".html";
  var welfare = /555kp28\.com/i.test(info.base);
  if (!welfare) {
    try {
      var content = await fd555GetSiteContent(path, params || {});
      var mainDetail = fd555ParseDetail(
        content.html,
        content.base,
        info.videoId
      );
      if (mainDetail.title) {
        return {
          base: content.base,
          html: content.html,
          detail: mainDetail
        };
      }
    } catch (error) {
      console.log("[forward.555dy] 主站详情读取失败:", error.message);
    }
    throw new Error("555电影详情页解析失败");
  }

  try {
    var content = await fd555GetSiteContent(path, params || {});
    var mainDetail = fd555ParseDetail(
      content.html,
      content.base,
      info.videoId
    );
    var mainGroups = mainDetail.fd555SidOrder
      ? mainDetail.fd555SidOrder.length
      : 0;
    if (mainDetail.title && mainGroups > 0) {
      return {
        base: content.base,
        html: content.html,
        detail: mainDetail
      };
    }
  } catch (error) {
    console.log("[forward.555dy] 福利主站映射失败:", error.message);
  }

  var welfareBase = fd555Base(
    (params && params.welfare_base_url) || FD555_DEFAULT_WELFARE_BASE
  );
  var welfareHTML = await fd555GetText(welfareBase + path, welfareBase);
  var welfareDetail = fd555ParseDetail(
    welfareHTML,
    welfareBase,
    info.videoId
  );
  if (!welfareDetail.title) throw new Error("555电影福利详情页解析失败");
  return {
    base: welfareBase,
    html: welfareHTML,
    detail: welfareDetail
  };
}

async function loadDetail(link) {
  var value = link && typeof link === "object"
    ? link.link || link.videoUrl || link.externalUrl || link.id || ""
    : link;
  var info = fd555ResourceInfo({ link: value });
  if (!info.videoId) throw new Error("无法识别 555电影影片 ID");
  var loaded = await fd555LoadDetailData(info, {});
  var detail = loaded.detail;
  delete detail.fd555SidOrder;
  delete detail.fd555SourceNames;
  delete detail.fd555Groups;
  return fd555EnrichDetailImages(detail);
}

function fd555Base64Decode(value) {
  var input = fd555Text(value).replace(/\s+/g, "");
  if (!input) return "";
  var alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var buffer = 0;
  var bits = 0;
  for (var i = 0; i < input.length; i += 1) {
    var ch = input.charAt(i);
    if (ch === "=") break;
    var index = alphabet.indexOf(ch);
    if (index < 0) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 255);
    }
  }
  try {
    return decodeURIComponent(
      output.replace(/(.)/g, function (character) {
        var code = character.charCodeAt(0).toString(16).toUpperCase();
        return "%" + (code.length < 2 ? "0" + code : code);
      })
    );
  } catch (error) {
    return output;
  }
}

function fd555ParsePlayer(html, base) {
  var match = html.match(
    /var\s+player_aaaa\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/i
  );
  if (!match) return null;
  var data;
  try {
    data = JSON.parse(match[1]);
  } catch (error) {
    return null;
  }
  var url = fd555Text(data.url);
  if (String(data.encrypt) === "1") {
    url = fd555Base64Decode(url);
  }
  if (url && !/^https?:\/\//i.test(url) && url.indexOf("//") !== 0) {
    url = fd555Absolute(base, url);
  }
  if (url.indexOf("//") === 0) url = "https:" + url;
  return {
    data: data,
    url: url,
    flag: fd555Text(data.from),
    episode: fd555Text(data.nid),
    sid: fd555Text(data.sid),
    id: fd555Text(data.id)
  };
}

function fd555DirectMedia(url) {
  return /^https?:\/\//i.test(url) &&
    /\.(?:m3u8|mp4|flv|m4v)(?:[?#]|$)/i.test(url.split("#")[0]);
}

async function fd555ProbeWelfareStream(stream, timeout) {
  if (!/\.m3u8(?:[?#]|$)/i.test(stream.url.split("#")[0])) {
    return "unknown";
  }
  try {
    var response = await Widget.http.get(stream.url, {
      headers: stream.customHeaders,
      timeout: timeout
    });
    var status = fd555Status(response);
    var data = response && response.data !== undefined ? response.data : response;
    var text = typeof data === "string" ? data : fd555Text(data);
    if (status >= 200 && status < 300) {
      return /^\s*#EXTM3U/i.test(text) ? "good" : "bad";
    }
    if ([401, 403, 404, 410, 451].indexOf(status) >= 0) return "bad";
    return "unknown";
  } catch (error) {
    return "unknown";
  }
}

async function fd555RankWelfareStreams(streams, params) {
  if (
    !streams.length ||
    fd555Text(params.welfare_verify_lines || "enabled").toLowerCase() ===
      "disabled"
  ) {
    return streams;
  }
  var timeout = parseInt(params.line_probe_timeout || "4500", 10);
  if (!isFinite(timeout)) timeout = 4500;
  timeout = Math.max(2500, Math.min(8000, timeout));
  var states = await Promise.all(streams.map(function (stream) {
    return fd555ProbeWelfareStream(stream, timeout);
  }));
  var groups = { good: [], unknown: [] };
  streams.forEach(function (stream, index) {
    var state = states[index];
    if (state === "good" || state === "unknown") groups[state].push(stream);
  });
  console.log(
    "[forward.555dy] 福利线路预检:",
    states.filter(function (state) { return state === "good"; }).length,
    "可用 /",
    states.filter(function (state) { return state === "bad"; }).length,
    "失效 /",
    states.filter(function (state) { return state === "unknown"; }).length,
    "未知"
  );
  return groups.good.concat(groups.unknown);
}

async function fd555LoadPlayer(base, videoId, sid, nid) {
  var pageURL = base + "/vodplay/" + videoId + "-" + sid + "-" + nid + ".html";
  var html = await fd555GetText(pageURL, base, base + "/");
  return {
    player: fd555ParsePlayer(html, base),
    pageURL: pageURL
  };
}

async function fd555BuildStreams(
  base,
  videoId,
  detail,
  preferredSid,
  nid,
  limit,
  params,
  prefix
) {
  var order = [];
  if (detail && detail.fd555SidOrder) {
    order = detail.fd555SidOrder.slice();
  }
  if (preferredSid && order.indexOf(preferredSid) < 0) {
    order.unshift(preferredSid);
  } else if (preferredSid) {
    order = [preferredSid].concat(order.filter(function (item) {
      return item !== preferredSid;
    }));
  }
  var available = order.filter(function (item) {
    if (item === preferredSid) return true;
    if (!detail || !detail.fd555Groups || !detail.fd555Groups[item]) return false;
    return detail.fd555Groups[item].some(function (episode) {
      return String(episode.nid) === String(nid);
    });
  }).slice(0, limit);

  var results = await Promise.all(
    available.map(function (candidateSid) {
      return fd555LoadPlayer(base, videoId, candidateSid, nid).catch(function (error) {
        console.log(
          "[forward.555dy] 线路读取失败:",
          candidateSid,
          error.message
        );
        return null;
      });
    })
  );

  var streams = [];
  var seenURL = {};
  results.forEach(function (result, index) {
    if (!result || !result.player || !result.player.url) return;
    var player = result.player;
    if (!fd555DirectMedia(player.url)) {
      console.log("[forward.555dy] 跳过非直链播放页:", player.url);
      return;
    }
    if (seenURL[player.url]) return;
    seenURL[player.url] = true;
    var candidateSid = available[index];
    var sourceName =
      detail && detail.fd555SourceNames && detail.fd555SourceNames[candidateSid]
        ? detail.fd555SourceNames[candidateSid]
        : "线路" + (index + 1);
    var episode =
      detail &&
      detail.fd555Groups &&
      detail.fd555Groups[candidateSid] &&
      detail.fd555Groups[candidateSid].find(function (entry) {
        return String(entry.nid) === String(nid);
      });
    var episodeName = episode && episode.label ? episode.label : "第" + nid + "集";
    var headers = {
      "User-Agent": FD555_USER_AGENT,
      "Referer": base + "/",
      "Origin": base
    };
    streams.push({
      name: [
        "555电影",
        prefix || "",
        sourceName,
        episodeName
      ].filter(Boolean).join(" "),
      description: [
        "来源：555电影",
        prefix ? "类型：" + prefix : "",
        "线路：" + sourceName,
        "剧集：" + episodeName,
        "播放器：" + (player.flag || "HLS"),
        "详情：" + base + "/voddetail/" + videoId + ".html"
      ].filter(Boolean).join("\n"),
      url: player.url,
      customHeaders: headers,
      headers: headers,
      playerType: "app"
    });
  });
  return streams;
}

async function fd555FindAlternativeWelfareStreams(
  info,
  detail,
  base,
  nid,
  params,
  limit
) {
  if (!detail || !detail.title) return [];
  var content = await fd555GetSiteContent(
    "/vodsearch/" + encodeURIComponent(detail.title) + "-------------.html",
    params
  );
  var target = fd555NormalizeMatchTitle(detail.title);
  var candidates = fd555ParseSearchCards(content.html, content.base)
    .filter(function (item) {
      return item &&
        item.fd555Id &&
        String(item.fd555Id) !== String(info.videoId) &&
        fd555NormalizeMatchTitle(item.title) === target;
    })
    .slice(0, 4);
  var streams = [];
  for (var index = 0; index < candidates.length; index += 1) {
    try {
      var candidateInfo = {
        base: content.base,
        videoId: candidates[index].fd555Id
      };
      var loaded = await fd555LoadDetailData(candidateInfo, params);
      var candidateDetail = loaded.detail;
      var candidateSid =
        candidateDetail.fd555SidOrder &&
        candidateDetail.fd555SidOrder[0];
      var candidateStreams = await fd555BuildStreams(
        loaded.base,
        candidateInfo.videoId,
        candidateDetail,
        candidateSid,
        nid,
        Math.min(limit, 4),
        params,
        "同名备用"
      );
      streams = streams.concat(candidateStreams);
    } catch (error) {
      console.log(
        "[forward.555dy] 同名备用资源失败:",
        candidates[index].title,
        error.message
      );
    }
  }
  return streams;
}

async function loadResource(params) {
  params = params || {};
  var info = fd555ResourceInfo(params);
  if (!info.videoId) throw new Error("当前视频没有可识别的 555电影 ID");
  var base = info.base || FD555_DEFAULT_BASE;
  var detail = null;
  try {
    var loaded = await fd555LoadDetailData(info, params);
    base = loaded.base;
    detail = loaded.detail;
  } catch (error) {
    console.log("[forward.555dy] 详情页读取失败，仅尝试当前播放页:", error.message);
    base = fd555ResolveMainBase(params);
  }

  var sid = info.sid;
  var nid = info.nid;
  if ((!sid || !nid) && detail) {
    var mainSid = detail.fd555SidOrder && detail.fd555SidOrder[0];
    var mainEpisode = mainSid && detail.fd555Groups[mainSid]
      ? detail.fd555Groups[mainSid][0]
      : null;
    if (mainEpisode) {
      sid = sid || mainEpisode.sid;
      nid = nid || mainEpisode.nid;
    }
  }
  if (!sid || !nid) throw new Error("无法定位 555电影播放集数");

  var requestedLimit = parseInt(params.max_lines || "8", 10);
  if (!isFinite(requestedLimit)) requestedLimit = 8;
  var limit = Math.max(1, Math.min(16, requestedLimit));
  var streams = await fd555BuildStreams(
    base,
    info.videoId,
    detail,
    sid,
    nid,
    limit,
    params,
    ""
  );

  if (/555kp28\.com/i.test(info.base)) {
    streams = await fd555RankWelfareStreams(streams, params);
    if (!streams.length) {
      try {
        var alternatives = await fd555FindAlternativeWelfareStreams(
          info,
          detail,
          base,
          nid,
          params,
          limit
        );
        if (alternatives.length) {
          streams = await fd555RankWelfareStreams(
            streams.concat(alternatives),
            params
          );
        }
      } catch (error) {
        console.log("[forward.555dy] 同名备用资源搜索失败:", error.message);
      }
    }
  }
  if (!streams.length) {
    throw new Error("福利线路均受地区限制或已失效，请稍后刷新资源");
  }
  return streams;
}
