// ==================== 爱壹帆媒体数据 v1.6.0 ====================
// Forward list/detail widget for iyf.tv.
// 只读取公开媒体元数据和分集目录，不提取或保存播放地址。
// 列表模块会自动把最近数据缓存在 Widget.storage；页面入口每次调用时做增量刷新。

var WidgetMetadata = {
  id: "iyf.tv.metadata",
  title: "爱壹帆媒体数据（Rex 在线）",
  version: "1.6.0",
  requiredVersion: "0.0.1",
  description: "自动增量缓存爱壹帆最新影视、分类和搜索结果，并加载详情元数据",
  author: "Codex",
  site: "https://www.iyf.tv/",
  iconurl: "https://www.iyf.tv/favicon.ico",
  detailCacheDuration: 300,
  globalParams: [
    {
      name: "auto_refresh",
      title: "自动增量刷新",
      type: "enumeration",
      value: "enabled",
      enumOptions: [
        { title: "启用", value: "enabled" },
        { title: "关闭", value: "disabled" },
      ],
      description: "启用后，每次进入列表页会先检查最新分页，并把新增或变化项合并到本地缓存。",
    },
    {
      name: "refresh_minutes",
      title: "刷新节流",
      type: "input",
      value: "0",
      description: "两次自动刷新至少间隔多少分钟；0 表示每次进入都检查。",
    },
    {
      name: "refresh_pages",
      title: "每次检查页数",
      type: "input",
      value: "3",
      description: "每次自动增量刷新最多检查最近几页，默认 3 页。",
    },
    {
      name: "cache_items",
      title: "每分类缓存条数",
      type: "input",
      value: "180",
      description: "每个分类最多保留多少条本地缓存，默认 180 条。",
    },
    {
      name: "snapshot_url",
      title: "爬虫快照地址",
      type: "input",
      value: "",
      description: "可选。填写定时爬虫生成的 iyf_media.json 公网地址；留空时直接读取站点接口。",
    },
    {
      name: "offline_mode",
      title: "离线数据模式",
      type: "enumeration",
      value: "auto", // IYF_OFFLINE_DEFAULT
      enumOptions: [
        { title: "自动（优先内置数据）", value: "auto" },
        { title: "仅内置数据", value: "embedded" },
        { title: "实时网络", value: "network" },
      ],
      description: "离线版内置媒体目录时会优先读取内置数据；标准版没有内置目录时自动使用网络。",
    },
  ],
  modules: [
    {
      id: "latestAll",
      title: "最新上线",
      functionName: "latestAll",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "latestMovies",
      title: "最新电影",
      functionName: "latestMovies",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "latestDramas",
      title: "最新剧集",
      functionName: "latestDramas",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "latestVariety",
      title: "最新综艺",
      functionName: "latestVariety",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "latestAnime",
      title: "最新动漫",
      functionName: "latestAnime",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "latestShort",
      title: "最新短剧",
      functionName: "latestShort",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "latestSports",
      title: "最新体育",
      functionName: "latestSports",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "latestDocumentary",
      title: "最新纪录片",
      functionName: "latestDocumentary",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "loadResource",
      title: "爱壹帆播放线路",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: [],
    },
  ],
  search: {
    title: "爱壹帆搜索",
    functionName: "searchIYF",
    params: [
      {
        name: "keyword",
        title: "搜索关键词",
        type: "input",
        value: "",
        placeholders: [
          { title: "尚公主", value: "尚公主" },
          { title: "动作电影", value: "动作" },
        ],
      },
      { name: "page", title: "页码", type: "page" },
    ],
  },
};

var IYF_SITE = "https://www.iyf.tv";
var IYF_API_HOST = "https://m10.iyf.tv";
var IYF_CINEMA = 1;
var IYF_PAGE_SIZE = 36;
var IYF_CACHE_SCHEMA = 3;
var IYF_CACHE_KEY_PREFIX = "iyf.tv.metadata.cache.v3.";
var IYF_DEFAULT_REFRESH_PAGES = 3;
var IYF_DEFAULT_CACHE_ITEMS = 180;
var IYF_OFFLINE_CATALOG = null;
var IYF_LINK_PREFIX = "iyf:";
var IYF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/142.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
  "Referer": IYF_SITE + "/",
  "Origin": IYF_SITE,
};

var IYF_CATEGORIES = {
  all: { title: "全部", cid: "0,1" },
  movie: { title: "电影", cid: "0,1,3" },
  drama: { title: "剧集", cid: "0,1,4" },
  variety: { title: "综艺", cid: "0,1,5" },
  anime: { title: "动漫", cid: "0,1,6" },
  documentary: { title: "纪录片", cid: "0,1,7" },
  short: { title: "短剧", cid: "0,1,8" },
  sport: { title: "体育", cid: "0,1,95" },
};

var IYF_LABEL_TO_CATEGORY = {
  "电影": "movie",
  "电视剧": "drama",
  "剧集": "drama",
  "综艺": "variety",
  "动漫": "anime",
  "动画": "anime",
  "纪录片": "documentary",
  "短剧": "short",
  "体育": "sport",
};

var iyfConfigCache = null;
var iyfCategoryCache = null;
var iyfSnapshotCache = {};

function iyfText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function iyfNumber(value, fallback) {
  var match = iyfText(value).match(/-?\d+(?:\.\d+)?/);
  if (!match) return fallback === undefined ? 0 : fallback;
  var parsed = Number(match[0]);
  return isFinite(parsed) ? parsed : (fallback === undefined ? 0 : fallback);
}

function iyfBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return ["1", "true", "yes", "y"].indexOf(iyfText(value).toLowerCase()) >= 0;
}

function iyfSplit(value) {
  if (Array.isArray(value)) {
    return value.map(iyfText).filter(Boolean);
  }
  return iyfText(value)
    .split(/\s*[,，/、|]\s*/)
    .map(iyfText)
    .filter(Boolean);
}

function iyfDate(value) {
  var text = iyfText(value);
  if (!text || text.indexOf("0001-") === 0) return "";
  var match = text.match(/((?:19|20)\d{2})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    return match[1] + "-" +
      String(Number(match[2])).padStart(2, "0") + "-" +
      String(Number(match[3])).padStart(2, "0");
  }
  match = text.match(/((?:19|20)\d{2})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return match[1] + "-" +
      String(Number(match[2])).padStart(2, "0") + "-" +
      String(Number(match[3])).padStart(2, "0");
  }
  return text;
}

function iyfPageURL(key) {
  return IYF_SITE + "/play/" + encodeURIComponent(iyfText(key));
}

function iyfOwnedLink(key) {
  var normalized = iyfText(key);
  return /^[A-Za-z0-9]{6,32}$/.test(normalized)
    ? IYF_LINK_PREFIX + normalized
    : "";
}

function iyfParseOwnedLink(value) {
  var text = iyfText(value);
  if (!text) return "";
  if (text.indexOf(IYF_LINK_PREFIX) === 0) {
    var namespaced = text.slice(IYF_LINK_PREFIX.length);
    return /^[A-Za-z0-9]{6,32}$/.test(namespaced) ? namespaced : "";
  }
  try {
    var parsed = new URL(text);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "www.iyf.tv" ||
      parsed.username ||
      parsed.password ||
      parsed.port
    ) {
      return "";
    }
    var match = parsed.pathname.match(/^\/play\/([A-Za-z0-9]{6,32})\/?$/);
    return match ? match[1] : "";
  } catch (error) {
    return "";
  }
}

function iyfPage(value) {
  var page = Math.floor(iyfNumber(value, 1));
  return page > 0 ? page : 1;
}

function iyfDecodeQueryValue(value) {
  try {
    return decodeURIComponent(value).split("+").join(" ");
  } catch (error) {
    return value;
  }
}

// Small dependency-free MD5 implementation. iyf.tv signs its public API query
// with md5(publicKey + "&" + lowercaseQuery + "&" + privateKey).
function iyfUTF8Bytes(text) {
  var bytes = [];
  for (var index = 0; index < text.length; index += 1) {
    var code = text.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length) {
      var next = text.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        index += 1;
      }
    }
    if (code <= 0x7f) {
      bytes.push(code);
    } else if (code <= 0x7ff) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code <= 0xffff) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return bytes;
}

function iyfMD5(text) {
  var shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  var constants = [];
  for (var constantIndex = 0; constantIndex < 64; constantIndex += 1) {
    constants[constantIndex] = Math.floor(
      Math.abs(Math.sin(constantIndex + 1)) * 4294967296
    ) >>> 0;
  }

  var bytes = iyfUTF8Bytes(iyfText(text));
  var originalBitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  var lowLength = originalBitLength >>> 0;
  var highLength = Math.floor(originalBitLength / 4294967296) >>> 0;
  for (var lengthIndex = 0; lengthIndex < 4; lengthIndex += 1) {
    bytes.push((lowLength >>> (lengthIndex * 8)) & 0xff);
  }
  for (var highIndex = 0; highIndex < 4; highIndex += 1) {
    bytes.push((highLength >>> (highIndex * 8)) & 0xff);
  }

  var a0 = 0x67452301;
  var b0 = 0xefcdab89;
  var c0 = 0x98badcfe;
  var d0 = 0x10325476;

  function rotateLeft(value, count) {
    return ((value << count) | (value >>> (32 - count))) >>> 0;
  }

  for (var offset = 0; offset < bytes.length; offset += 64) {
    var words = [];
    for (var wordIndex = 0; wordIndex < 16; wordIndex += 1) {
      var base = offset + wordIndex * 4;
      words[wordIndex] = (
        bytes[base] |
        (bytes[base + 1] << 8) |
        (bytes[base + 2] << 16) |
        (bytes[base + 3] << 24)
      ) >>> 0;
    }
    var a = a0;
    var b = b0;
    var c = c0;
    var d = d0;
    for (var round = 0; round < 64; round += 1) {
      var f;
      var g;
      if (round < 16) {
        f = (b & c) | (~b & d);
        g = round;
      } else if (round < 32) {
        f = (d & b) | (~d & c);
        g = (5 * round + 1) % 16;
      } else if (round < 48) {
        f = b ^ c ^ d;
        g = (3 * round + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * round) % 16;
      }
      var sum = (a + f + constants[round] + words[g]) >>> 0;
      var nextD = d;
      d = c;
      c = b;
      b = (b + rotateLeft(sum, shifts[round])) >>> 0;
      a = nextD;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  function littleEndianHex(value) {
    var output = "";
    for (var index = 0; index < 4; index += 1) {
      var byte = (value >>> (index * 8)) & 0xff;
      output += ("0" + byte.toString(16)).slice(-2);
    }
    return output;
  }

  return littleEndianHex(a0) + littleEndianHex(b0) +
    littleEndianHex(c0) + littleEndianHex(d0);
}

function iyfExtractInjectJSON(html) {
  var marker = "var injectJson = ";
  var start = html.indexOf(marker);
  if (start < 0) throw new Error("爱壹帆首页缺少 injectJson");
  start += marker.length;
  var depth = 0;
  var inString = false;
  var escaped = false;
  for (var index = start; index < html.length; index += 1) {
    var character = html.charAt(index);
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }
    if (character === "\"") {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(start, index + 1));
      }
    }
  }
  throw new Error("爱壹帆首页 injectJson 不完整");
}

async function iyfLoadSiteConfig(force) {
  if (iyfConfigCache && !force) return iyfConfigCache;
  var response = await Widget.http.get(IYF_SITE + "/", {
    headers: {
      "User-Agent": IYF_HEADERS["User-Agent"],
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": IYF_HEADERS["Accept-Language"],
    },
  });
  var inject = iyfExtractInjectJSON(String(response && response.data || ""));
  var configs = inject.config || [];
  var siteConfig = configs[0] || {};
  var pconfig = siteConfig.pConfig || {};
  var switchRegions = Array.isArray(inject["switch-region"])
    ? inject["switch-region"]
    : [];
  var currentRegion = switchRegions[0] || {};
  var privateKey = Array.isArray(pconfig.privateKey)
    ? pconfig.privateKey[0]
    : pconfig.privateKey;
  if (!pconfig.publicKey || !privateKey) {
    throw new Error("爱壹帆公开接口签名配置不可用");
  }
  iyfConfigCache = {
    publicKey: String(pconfig.publicKey),
    privateKey: String(privateKey),
    region: iyfText(currentRegion.regionCode || currentRegion.ipCountry),
  };
  return iyfConfigCache;
}

function iyfBuildQuery(params) {
  var parts = [];
  Object.keys(params || {}).forEach(function (key) {
    var value = params[key];
    if (value === null || value === undefined || value === "") return;
    if (typeof value === "boolean") value = value ? 1 : 0;
    parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(value)));
  });
  return parts.join("&");
}

async function iyfSignedURL(path, params, forceConfig) {
  var config = await iyfLoadSiteConfig(forceConfig);
  var query = iyfBuildQuery(params);
  var signingQuery = query.split("&").map(function (part) {
    var separator = part.indexOf("=");
    if (separator < 0) return part;
    return part.slice(0, separator) + "=" +
      iyfDecodeQueryValue(part.slice(separator + 1));
  }).join("&").toLowerCase();
  var signature = iyfMD5(
    config.publicKey + "&" + signingQuery + "&" + config.privateKey
  );
  return IYF_API_HOST + path + "?" + query +
    "&vv=" + signature +
    "&pub=" + encodeURIComponent(config.publicKey);
}

async function iyfAPICall(path, params) {
  var lastError = null;
  for (var attempt = 0; attempt < 2; attempt += 1) {
    try {
      var url = await iyfSignedURL(path, params, attempt > 0);
      var response = await Widget.http.get(url, { headers: IYF_HEADERS });
      var payload = response && response.data;
      if (typeof payload === "string") payload = JSON.parse(payload);
      if (!payload || payload.ret !== 200) {
        throw new Error("爱壹帆接口外层请求失败");
      }
      var data = payload.data || {};
      if (data.code !== 0 && data.code !== "0") {
        throw new Error(data.msg || "爱壹帆接口返回错误");
      }
      return data.info;
    } catch (error) {
      lastError = error;
      if (/视频不存在|内容不存在/.test(error && error.message || "")) {
        throw error;
      }
      if (attempt === 0) {
        iyfConfigCache = null;
        continue;
      }
    }
  }
  throw lastError || new Error("爱壹帆接口不可用");
}

async function iyfNavigationCategories() {
  if (iyfCategoryCache) return iyfCategoryCache;
  var info = await iyfAPICall("/v3/list/MainMenuV3", {
    cinema: IYF_CINEMA,
    v: 1,
  });
  var result = {};
  var navigation = Array.isArray(info) ? info[0] || {} : {};
  var lists = []
    .concat(Array.isArray(navigation.channelList) ? navigation.channelList : [])
    .concat(Array.isArray(navigation.attachList) ? navigation.attachList : []);
  lists.forEach(function (item) {
    var slug = IYF_LABEL_TO_CATEGORY[iyfText(item.label)] ||
      IYF_LABEL_TO_CATEGORY[iyfText(item.link)];
    if (slug && /^\d+(?:,\d+)+$/.test(iyfText(item.category))) {
      result[slug] = iyfText(item.category);
    }
  });
  iyfCategoryCache = result;
  return result;
}

async function iyfCategoryID(slug) {
  if (slug === "all") return IYF_CATEGORIES.all.cid;
  try {
    var navigation = await iyfNavigationCategories();
    if (navigation[slug]) return navigation[slug];
  } catch (error) {
    console.log("爱壹帆分类导航读取失败，使用内置分类 ID:", error.message);
  }
  return (IYF_CATEGORIES[slug] || IYF_CATEGORIES.all).cid;
}

function iyfCategorySlug(item) {
  var ids = "," + iyfText(item.category_ids || item.videoClassID) + ",";
  if (ids.indexOf(",0,1,3,") >= 0) return "movie";
  if (ids.indexOf(",0,1,4,") >= 0) return "drama";
  if (ids.indexOf(",0,1,5,") >= 0) return "variety";
  if (ids.indexOf(",0,1,6,") >= 0) return "anime";
  if (ids.indexOf(",0,1,7,") >= 0) return "documentary";
  if (ids.indexOf(",0,1,8,") >= 0) return "short";
  if (ids.indexOf(",0,1,95,") >= 0) return "sport";
  return IYF_LABEL_TO_CATEGORY[iyfText(item.atype_name || item.atypeName)] || "other";
}

function iyfBoundedInteger(value, fallback, minimum, maximum) {
  var parsed = Math.floor(iyfNumber(value, fallback));
  if (!isFinite(parsed)) parsed = fallback;
  return Math.max(minimum, Math.min(maximum, parsed));
}

function iyfCacheKey(slug) {
  return IYF_CACHE_KEY_PREFIX + slug;
}

function iyfStorageGet(key) {
  if (!Widget.storage || typeof Widget.storage.get !== "function") return null;
  try {
    var raw = Widget.storage.get(key);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    console.log("爱壹帆本地缓存读取失败:", error.message);
    return null;
  }
}

function iyfStorageSet(key, value) {
  if (!Widget.storage || typeof Widget.storage.set !== "function") return false;
  try {
    Widget.storage.set(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.log("爱壹帆本地缓存写入失败:", error.message);
    return false;
  }
}

function iyfReadCategoryCache(slug) {
  var cache = iyfStorageGet(iyfCacheKey(slug));
  if (
    !cache ||
    cache.schemaVersion !== IYF_CACHE_SCHEMA ||
    !Array.isArray(cache.items)
  ) {
    return null;
  }
  cache.items = cache.items.filter(function (item) {
    return item && item.id && item.title;
  });
  return cache;
}

function iyfItemSignature(item) {
  return iyfMD5(JSON.stringify([
    iyfText(item.id),
    iyfText(item.title),
    iyfText(item.description),
    iyfText(item.releaseDate),
    iyfText(item.posterPath),
    iyfText(item.rating),
    iyfText(item.mediaType),
    iyfText(item.genreTitle),
    iyfText(item.year),
    iyfText(item.country),
    iyfText(item.language),
    iyfText(item.episodeCount),
    iyfText(item.iyfUpdatedAt),
  ]));
}

function iyfCacheIndex(cache) {
  var result = {};
  var items = cache && Array.isArray(cache.items) ? cache.items : [];
  items.forEach(function (item) {
    result[iyfText(item.id)] = iyfItemSignature(item);
  });
  return result;
}

function iyfIsAutoRefreshEnabled(params) {
  return iyfText(params && params.auto_refresh || "enabled").toLowerCase() !==
    "disabled";
}

function iyfShouldRefresh(cache, params) {
  if (!cache || !cache.updatedAt) return true;
  var refreshMinutes = Math.max(
    0,
    iyfNumber(params && params.refresh_minutes, 0)
  );
  if (refreshMinutes <= 0) return true;
  return Date.now() - Number(cache.updatedAt) >= refreshMinutes * 60000;
}

async function iyfFetchLiveCategoryPage(slug, page) {
  var cid = await iyfCategoryID(slug);
  var info = await iyfAPICall("/api/list/index", {
    cinema: IYF_CINEMA,
    page: page,
    cid: cid,
    size: IYF_PAGE_SIZE,
    isn: 0,
    isfree: -1,
    v: 1,
  });
  if (!Array.isArray(info)) return [];
  return info.filter(function (item) {
    return item && item.key && item.title;
  }).map(function (item) {
    return iyfMapItem(item);
  });
}

async function iyfRefreshCategory(slug, previousCache, params) {
  var refreshPages = iyfBoundedInteger(
    params && params.refresh_pages,
    IYF_DEFAULT_REFRESH_PAGES,
    1,
    20
  );
  var maxItems = iyfBoundedInteger(
    params && params.cache_items,
    IYF_DEFAULT_CACHE_ITEMS,
    IYF_PAGE_SIZE,
    720
  );
  var previousItems = previousCache && Array.isArray(previousCache.items)
    ? previousCache.items
    : [];
  var previousIndex = iyfCacheIndex(previousCache);
  var fetchedItems = [];
  var fetchedKeys = {};
  var newCount = 0;
  var changedCount = 0;
  var pagesChecked = 0;

  for (var page = 1; page <= refreshPages; page += 1) {
    var pageItems;
    try {
      pageItems = await iyfFetchLiveCategoryPage(slug, page);
    } catch (error) {
      if (fetchedItems.length === 0) throw error;
      console.log(
        "爱壹帆增量刷新在第 " + page + " 页中止，保留已取得的新数据:",
        error.message
      );
      break;
    }
    pagesChecked += 1;
    if (!pageItems.length) break;

    var pageAllUnchanged = previousItems.length > 0;
    pageItems.forEach(function (item) {
      var key = iyfText(item.id);
      if (fetchedKeys[key]) return;
      var signature = iyfItemSignature(item);
      if (!previousIndex[key]) {
        newCount += 1;
        pageAllUnchanged = false;
      } else if (previousIndex[key] !== signature) {
        changedCount += 1;
        pageAllUnchanged = false;
      }
      fetchedKeys[key] = true;
      fetchedItems.push(item);
    });

    if (previousItems.length > 0 && pageAllUnchanged) break;
    if (pageItems.length < IYF_PAGE_SIZE) break;
  }

  previousItems.forEach(function (item) {
    var key = iyfText(item.id);
    if (!fetchedKeys[key]) fetchedItems.push(item);
  });
  var now = Date.now();
  var cache = {
    schemaVersion: IYF_CACHE_SCHEMA,
    slug: slug,
    updatedAt: now,
    lastRefresh: {
      newItems: newCount,
      changedItems: changedCount,
      pagesChecked: pagesChecked,
    },
    items: fetchedItems.slice(0, maxItems),
  };
  iyfStorageSet(iyfCacheKey(slug), cache);
  console.log(
    "爱壹帆增量刷新 " + slug + ":",
    "新增", newCount,
    "变化", changedCount,
    "检查页数", pagesChecked
  );
  return cache;
}

function iyfCachedPage(cache, page) {
  var start = (page - 1) * IYF_PAGE_SIZE;
  var items = cache && Array.isArray(cache.items) ? cache.items : [];
  return items.slice(start, start + IYF_PAGE_SIZE);
}

async function iyfLoadIncrementalCategory(slug, page, params) {
  var cache = iyfReadCategoryCache(slug);
  var enabled = iyfIsAutoRefreshEnabled(params);

  if (enabled && page === 1 && iyfShouldRefresh(cache, params)) {
    try {
      cache = await iyfRefreshCategory(slug, cache, params);
    } catch (error) {
      console.log("爱壹帆自动刷新失败，回退本地缓存:", error.message);
    }
  }

  if (enabled && cache && cache.items && cache.items.length) {
    var cached = iyfCachedPage(cache, page);
    if (page === 1 || cached.length > 0) return cached;
  }

  try {
    return await iyfFetchLiveCategoryPage(slug, page);
  } catch (error) {
    if (cache && cache.items && cache.items.length) {
      console.log("爱壹帆实时分页失败，返回本地缓存:", error.message);
      return iyfCachedPage(cache, page);
    }
    throw error;
  }
}

function iyfMapItem(item, detail) {
  var raw = item || {};
  var detailRaw = detail || {};
  var key = iyfText(raw.key || detailRaw.key);
  var genres = iyfSplit(raw.genres || raw.cidMapper || detailRaw.cidMapper);
  var directors = Array.isArray(raw.directors)
    ? raw.directors.map(iyfText).filter(Boolean)
    : iyfSplit(raw.directors || raw.directed || detailRaw.directors);
  var actors = Array.isArray(raw.actors)
    ? raw.actors.map(iyfText).filter(Boolean)
    : iyfSplit(raw.actors || raw.starring || detailRaw.stars);
  var category = iyfCategorySlug(raw);
  var mediaType = (
    raw.media_type === "movie" ||
    detailRaw.mediaType === "movie" ||
    category === "movie" ||
    iyfText(raw.atype_name || raw.atypeName || detailRaw.channel) === "电影"
  ) ? "movie" : "tv";
  var posterImage = iyfText(
    raw.poster_url || raw.image || detailRaw.image || detailRaw.imgPath
  );
  var backdropImage = iyfText(raw.backdrop_url);
  if (!backdropImage || backdropImage === posterImage) {
    if (/^https?:\/\//i.test(posterImage)) {
      backdropImage = posterImage +
        (posterImage.indexOf("?") >= 0 ? "&" : "?") +
        "w=270&h=152&format=webp&mode=crop";
    } else {
      backdropImage = posterImage;
    }
  }
  var episodes = Array.isArray(raw.episodes) ? raw.episodes : [];
  var url = iyfText(raw.source_url) || iyfPageURL(key);
  var title = iyfText(raw.title || detailRaw.title);
  var episodeItems = episodes.map(function (episode, index) {
    var episodeKey = iyfText(episode.key);
    var episodeURL = iyfText(episode.source_url) || iyfPageURL(episodeKey);
    var episodeLink = iyfOwnedLink(episodeKey) || episodeURL;
    return {
      id: episodeLink,
      type: "url",
      title: iyfText(episode.name) || String(index + 1),
      mediaType: "tv",
      episode: index + 1,
      releaseDate: iyfDate(episode.update_date),
      link: episodeLink,
      posterPath: posterImage,
      backdropPath: backdropImage,
      description: title + " · " + (iyfText(episode.name) || ("第" + (index + 1) + "集")),
      iyfKey: episodeKey,
    };
  });
  var resourceLink = iyfOwnedLink(key) || url;

  return {
    id: resourceLink,
    type: "url",
    title: title,
    originalTitle: title,
    description: iyfText(raw.description || detailRaw.contxt),
    releaseDate: iyfDate(raw.release_date || detailRaw.add_date || detailRaw.addTime),
    posterPath: posterImage,
    detailPoster: posterImage,
    backdropPath: backdropImage,
    backdropPaths: backdropImage ? [backdropImage] : [],
    coverUrl: posterImage,
    rating: iyfNumber(raw.rating || detailRaw.score, 0),
    mediaType: mediaType,
    genreTitle: genres.join(", "),
    genreItems: genres.map(function (genre, index) {
      return { id: "iyf-genre-" + index + "-" + genre, title: genre };
    }),
    peoples: directors.map(function (name) {
      return { id: "iyf-person-" + name, title: name, role: "导演" };
    }).concat(actors.map(function (name) {
      return { id: "iyf-person-" + name, title: name, role: "演员" };
    })),
    year: iyfText(raw.year || detailRaw.post_Year),
    country: iyfText(raw.region || detailRaw.regional),
    language: iyfText(raw.language || detailRaw.language),
    episodeCount: iyfNumber(
      raw.episode_count || raw.serial_count || detailRaw.serialCount,
      episodes.length
    ),
    episodeItems: episodeItems,
    link: resourceLink,
    externalUrl: url,
    source: "爱壹帆",
    iyfKey: key,
    iyfCategory: category,
    iyfUpdatedAt: iyfDate(raw.detail_updated_at || raw.release_date),
  };
}

function iyfNormalizeSnapshotItems(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.items)) return value.items;
  if (value && value.data && Array.isArray(value.data.items)) return value.data.items;
  return [];
}

async function iyfLoadSnapshot(params) {
  var url = iyfText(params && params.snapshot_url);
  if (!url) return null;
  if (iyfSnapshotCache.url === url && Array.isArray(iyfSnapshotCache.items)) {
    return iyfSnapshotCache.items;
  }
  var response = await Widget.http.get(url, {
    headers: { "Accept": "application/json" },
  });
  var items = iyfNormalizeSnapshotItems(response && response.data);
  iyfSnapshotCache = { url: url, items: items };
  return items;
}

function iyfEmbeddedCatalog(params) {
  if (!IYF_OFFLINE_CATALOG || !Array.isArray(IYF_OFFLINE_CATALOG.items)) {
    return null;
  }
  var mode = iyfText(params && params.offline_mode || "auto").toLowerCase();
  return mode === "network" ? null : IYF_OFFLINE_CATALOG;
}

function iyfFindEmbeddedItem(key) {
  if (!IYF_OFFLINE_CATALOG || !Array.isArray(IYF_OFFLINE_CATALOG.items)) {
    return null;
  }
  for (var index = 0; index < IYF_OFFLINE_CATALOG.items.length; index += 1) {
    var item = IYF_OFFLINE_CATALOG.items[index];
    if (item && iyfText(item.key) === iyfText(key)) return item;
  }
  return null;
}

function iyfPageFromSnapshot(items, slug, page, keyword) {
  var normalizedKeyword = iyfText(keyword).toLowerCase();
  var filtered = items.filter(function (item) {
    if (!item || !item.key || !item.title) return false;
    if (slug !== "all") {
      var categories = Array.isArray(item.categories) ? item.categories : [];
      if (categories.indexOf(slug) < 0 && item.category_slug !== slug) return false;
    }
    if (!normalizedKeyword) return true;
    var searchable = [
      item.title,
      item.description,
      Array.isArray(item.genres) ? item.genres.join(" ") : item.genres,
      Array.isArray(item.actors) ? item.actors.join(" ") : item.actors,
      Array.isArray(item.directors) ? item.directors.join(" ") : item.directors,
    ].join(" ").toLowerCase();
    return searchable.indexOf(normalizedKeyword) >= 0;
  });
  var start = (page - 1) * IYF_PAGE_SIZE;
  return filtered.slice(start, start + IYF_PAGE_SIZE).map(function (item) {
    return iyfMapItem(item);
  });
}

async function iyfLoadCategory(slug, params) {
  params = params || {};
  var page = iyfPage(params && params.page);
  var filterKeyword = iyfText(
    (params && params.genreId) || (params && params.peopleId)
  ).replace(/^iyf-(?:genre|person)-/, "");
  if (/^iyf-(?:genre|person)-/.test(
    iyfText((params && params.genreId) || (params && params.peopleId))
  )) {
    filterKeyword = filterKeyword.replace(/^\d+-/, "");
  }
  var embedded = iyfEmbeddedCatalog(params);
  if (embedded) {
    return iyfPageFromSnapshot(embedded.items, slug, page, filterKeyword);
  }
  var snapshot = await iyfLoadSnapshot(params);
  if (snapshot) {
    return iyfPageFromSnapshot(snapshot, slug, page, filterKeyword);
  }
  if (filterKeyword) {
    var filtered = await searchIYF({ keyword: filterKeyword, page: page });
    if (slug === "all") return filtered;
    return filtered.filter(function (item) {
      return item.iyfCategory === slug;
    });
  }
  return iyfLoadIncrementalCategory(slug, page, params || {});
}

async function latestAll(params) {
  return iyfLoadCategory("all", params || {});
}

async function latestMovies(params) {
  return iyfLoadCategory("movie", params || {});
}

async function latestDramas(params) {
  return iyfLoadCategory("drama", params || {});
}

async function latestVariety(params) {
  return iyfLoadCategory("variety", params || {});
}

async function latestAnime(params) {
  return iyfLoadCategory("anime", params || {});
}

async function latestShort(params) {
  return iyfLoadCategory("short", params || {});
}

async function latestSports(params) {
  return iyfLoadCategory("sport", params || {});
}

async function latestDocumentary(params) {
  return iyfLoadCategory("documentary", params || {});
}

async function searchIYF(params) {
  params = params || {};
  var keyword = iyfText(params.keyword || params.query || params.tags);
  var page = iyfPage(params.page);
  if (!keyword) return [];
  var embedded = iyfEmbeddedCatalog(params);
  if (embedded) {
    return iyfPageFromSnapshot(embedded.items, "all", page, keyword);
  }
  var snapshot = await iyfLoadSnapshot(params);
  if (snapshot) {
    return iyfPageFromSnapshot(snapshot, "all", page, keyword);
  }
  var info = await iyfAPICall("/api/list/Search", {
    cinema: IYF_CINEMA,
    tags: keyword,
    page: page,
    size: IYF_PAGE_SIZE,
    orderby: 0,
    desc: 0,
    v: 1,
  });
  var group = Array.isArray(info) ? info[0] || {} : {};
  var results = Array.isArray(group.result) ? group.result : [];
  return results.filter(function (item) {
    return item && item.key && item.title;
  }).map(function (item) {
    return iyfMapItem(item);
  });
}

function iyfNormalizeMatchTitle(value) {
  return iyfText(value)
    .toLowerCase()
    .replace(/[\s:：·・\-—_.,，。!！?？'"“”‘’()（）[\]【】]/g, "");
}

function iyfTMDBYear(item) {
  var year = iyfNumber(item.year, 0);
  if (!year) year = iyfNumber(item.releaseDate, 0);
  return year > 0 ? year : 0;
}

function iyfTMDBCandidateYear(candidate, mediaType) {
  var date = mediaType === "movie"
    ? candidate.release_date
    : candidate.first_air_date;
  if (!date) return 0;
  return iyfNumber(date, 0);
}

function iyfSelectTMDBCandidate(results, item) {
  if (!Array.isArray(results) || !results.length) return null;
  var target = iyfNormalizeMatchTitle(item.title);
  if (!target) return null;
  var targetYear = iyfTMDBYear(item);
  var best = null;
  var bestScore = 0;
  for (var index = 0; index < results.length; index += 1) {
    var candidate = results[index];
    if (!candidate) continue;
    var candidateYear = iyfTMDBCandidateYear(candidate, item.mediaType);
    if (targetYear && candidateYear && Math.abs(candidateYear - targetYear) > 1) {
      continue;
    }
    var names = [
      candidate.title,
      candidate.name,
      candidate.original_title,
      candidate.original_name,
    ].map(iyfNormalizeMatchTitle).filter(Boolean);
    var score = 0;
    for (var nameIndex = 0; nameIndex < names.length; nameIndex += 1) {
      var name = names[nameIndex];
      if (name === target) {
        score = Math.max(score, 100);
      } else if (
        target.length >= 3 &&
        (name.indexOf(target) >= 0 || target.indexOf(name) >= 0)
      ) {
        score = Math.max(score, 75);
      }
    }
    if (!score) continue;
    if (targetYear && candidateYear === targetYear) score += 10;
    if (candidate.backdrop_path) score += 3;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return bestScore >= 75 ? best : null;
}

async function iyfTMDBResults(item, includeYear) {
  var path = item.mediaType === "movie" ? "search/movie" : "search/tv";
  var params = {
    query: item.title,
    language: "zh-CN",
    include_adult: false,
    page: 1,
  };
  var year = iyfTMDBYear(item);
  if (includeYear && year) {
    params[item.mediaType === "movie" ? "year" : "first_air_date_year"] = year;
  }
  var response = await Widget.tmdb.get(path, { params: params });
  if (!response) return [];
  return Array.isArray(response) ? response : (response.results || []);
}

async function iyfEnrichDetailImages(item) {
  if (
    !item ||
    !Widget.tmdb ||
    typeof Widget.tmdb.get !== "function" ||
    !item.title
  ) {
    return item;
  }
  try {
    var candidate = null;
    if (iyfTMDBYear(item)) {
      candidate = iyfSelectTMDBCandidate(
        await iyfTMDBResults(item, true),
        item
      );
    }
    if (!candidate) {
      candidate = iyfSelectTMDBCandidate(
        await iyfTMDBResults(item, false),
        item
      );
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
    console.log(
      "详情图片已匹配 TMDB:",
      item.title,
      candidate.title || candidate.name || candidate.id
    );
    return item;
  } catch (error) {
    console.log("TMDB 高清图片匹配失败，使用源站图片:", error.message);
    return item;
  }
}

async function iyfAttachDirectPlayback(item, key) {
  if (!item || !key) return item;
  try {
    var info = await iyfPlaybackInfo(key);
    var streams = await iyfPlaybackStreams(info);
    var stream = streams[0];
    if (!stream) return item;
    item.videoUrl = stream.url;
    item.customHeaders = stream.customHeaders;
    item.headers = stream.headers;
    item.playerType = "system";
  } catch (error) {
    console.log("爱壹帆详情预取播放地址失败:", error.message);
  }
  return item;
}

async function loadDetail(link) {
  var key = iyfParseOwnedLink(link);
  if (!key) return null;
  var embedded = iyfFindEmbeddedItem(key);
  if (embedded) {
    return iyfEnrichDetailImages(
      await iyfAttachDirectPlayback(iyfMapItem(embedded), key)
    );
  }

  var detailInfo = await iyfAPICall("/v3/video/detail", {
    ispath: "false",
    cinema: IYF_CINEMA,
    device: "desktop",
    player: "CkPlayer",
    tech: "HLS",
    country: "US",
    lang: "cns",
    v: 1,
    id: key,
  });
  var detail = Array.isArray(detailInfo) ? detailInfo[0] || {} : {};
  if (!detail || !detail.title) return null;

  var playlist = [];
  try {
    var playlistInfo = await iyfAPICall("/v3/video/languagesplaylist", {
      vid: key,
      lsk: 1,
      taxis: 0,
      cid: iyfText(detail.cid),
      cinema: IYF_CINEMA,
      v: 1,
    });
    var playlistGroup = Array.isArray(playlistInfo) ? playlistInfo[0] || {} : {};
    playlist = Array.isArray(playlistGroup.playList)
      ? playlistGroup.playList
      : [];
  } catch (episodeError) {
    console.log("爱壹帆分集目录读取失败，仍返回详情:", episodeError.message);
  }
  var mapped = iyfMapItem({
    key: key,
    title: detail.title,
    description: detail.contxt,
    poster_url: detail.imgPath,
    category_ids: detail.cid,
    year: detail.post_Year,
    region: detail.regional,
    language: detail.language,
    rating: iyfNumber(detail.score, 0) ||
      (iyfNumber(detail.pinfenRate, 0) * 10),
    release_date: detail.add_date || detail.addTime,
    media_type: iyfText(detail.channel) === "电影" ? "movie" : "tv",
    directors: detail.directors,
    actors: detail.stars,
    genres: detail.cidMapper,
    episode_count: detail.serialCount,
    episodes: playlist.map(function (episode) {
      return {
        key: episode.key,
        name: episode.name,
        update_date: episode.updateDate,
        source_url: iyfPageURL(episode.key),
      };
    }),
  }, detail);
  return iyfEnrichDetailImages(
    await iyfAttachDirectPlayback(mapped, key)
  );
}

function iyfResourceKey(params) {
  var rawLink = params && params.link != null
    ? iyfText(params.link)
    : "";
  if (rawLink) return iyfParseOwnedLink(rawLink);
  var rawId = params && params.id != null ? iyfText(params.id) : "";
  return iyfParseOwnedLink(rawId);
}

async function iyfSignPlaybackURL(value) {
  var url = iyfText(value);
  if (!url || /[?&]vv=/.test(url)) return url;
  var hashIndex = url.indexOf("#");
  var hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  var base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  var queryIndex = base.indexOf("?");
  if (queryIndex < 0) return url;
  var query = base.slice(queryIndex + 1);
  var config = await iyfLoadSiteConfig();
  var signingQuery = query.split("&").map(function (part) {
    var separator = part.indexOf("=");
    if (separator < 0) return part;
    return part.slice(0, separator) + "=" +
      iyfDecodeQueryValue(part.slice(separator + 1));
  }).join("&").toLowerCase();
  var signature = iyfMD5(
    config.publicKey + "&" + signingQuery + "&" + config.privateKey
  );
  return base + "&vv=" + signature +
    "&pub=" + encodeURIComponent(config.publicKey) + hash;
}

async function iyfPlaybackInfo(key) {
  var lastError = null;
  var config = await iyfLoadSiteConfig();
  for (var autoPlay = 1; autoPlay >= 0; autoPlay -= 1) {
    try {
      var info = await iyfAPICall("/v3/video/play", {
        cinema: IYF_CINEMA,
        id: key,
        lang: "none",
        usersign: 1,
        region: config.region || "GL.",
        device: 1,
        a: autoPlay,
        isMasterSupport: 0,
        v: 1,
      });
      if (Array.isArray(info) && info[0]) return info[0];
    } catch (error) {
      lastError = error;
      if (!/视频不存在|内容不存在/.test(error && error.message || "")) {
        throw error;
      }
    }
  }
  throw lastError || new Error("爱壹帆未返回播放信息");
}

async function iyfPlaybackStreams(info) {
  var streams = [];
  var seen = {};
  var seenSources = {};

  async function addStream(path, name, description) {
    if (!path || !path.result) return;
    if (seenSources[path.result]) return;
    seenSources[path.result] = true;
    var url = path.needSign
      ? await iyfSignPlaybackURL(path.result)
      : path.result;
    if (path.isHls) {
      url += (url.indexOf("?") >= 0 ? "&" : "?") +
        "_iyf_ts=" + Date.now();
    }
    if (!url || seen[url]) return;
    seen[url] = true;
    var resourceHeaders = {
      "User-Agent": IYF_HEADERS["User-Agent"],
    };
    streams.push({
      name: name,
      description: description,
      url: url,
      customHeaders: resourceHeaders,
      headers: resourceHeaders,
      playerType: "system",
    });
  }

  var clarity = Array.isArray(info && info.clarity) ? info.clarity : [];
  for (var clarityIndex = 0; clarityIndex < clarity.length; clarityIndex += 1) {
    var quality = clarity[clarityIndex] || {};
    if (quality.isEnabled === false || !quality.path) continue;
    var qualityName = iyfText(quality.memo || quality.description ||
      (iyfText(quality.title) ? quality.title + "P" : "线路"));
    var suffix = info.isPreView ? " · 预览" : "";
    await addStream(
      quality.path,
      "爱壹帆 " + qualityName + (suffix ? " 预览" : ""),
      [
        qualityName,
        quality.path.isHls ? "HLS" : "MP4",
        suffix ? "预览" : "即时签名",
      ].filter(Boolean).join(" · ")
    );
  }

  var fallbackList = Array.isArray(info && info.flvPathList)
    ? info.flvPathList
    : [];
  for (var streamIndex = 0; streamIndex < fallbackList.length; streamIndex += 1) {
    var path = fallbackList[streamIndex] || {};
    // Ad entries normally carry an external click link. Never return them as
    // the main playback resource.
    if (!path.result || path.link || path.type === 1) continue;
    var bitrate = iyfNumber(path.bitrate, 0);
    var streamName = bitrate > 0 ? bitrate + "P" : "默认线路";
    await addStream(
      path,
      "爱壹帆 " + streamName,
      [
        streamName,
        path.isHls ? "HLS" : "MP4",
        info.isPreView ? "预览" : "即时签名",
      ].join(" · ")
    );
  }

  if (!streams.length) {
    if (iyfNumber(info && info.needLogin, 0) > 0) {
      throw new Error("该内容需要登录、会员或购买后才能播放");
    }
    throw new Error("当前内容没有可用播放线路");
  }
  return streams;
}

async function loadResource(params) {
  params = params || {};
  var key = iyfResourceKey(params);
  if (!key) return [];
  var info = await iyfPlaybackInfo(key);
  return iyfPlaybackStreams(info);
}

