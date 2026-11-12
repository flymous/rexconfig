// Good IPTV Forward source
// The upstream swaps a normal browser request for a short test stream.
// Both playlist loading and playback therefore enforce okHttp/Mod-1.5.0.0.

var GOOD_DEFAULT_SOURCE_URL =
  "https://goodiptv.club/iptv.m3u?userid=6187026765&sign=3ebee838866dd014747c74af8f19da3d5a81c5a86524ab467342f9e386ca9e98218d035d798352e36ba05920663591114024b27ffd513a3f7571d81196ccbe6fcff7c724dc9e9b&auth_token=2ece6b94850257c2f60987f075fb6b76";
var GOOD_REQUIRED_UA = "okHttp/Mod-1.5.0.0";
var GOOD_LINK_PREFIX = "good://";
var GOOD_CACHE_MS = 300000;
var GOOD_PAGE_SIZE = 30;
var goodPlaySequence = 0;
var goodState = {
  text: "",
  channels: [],
  url: "",
  userAgent: "",
  loadedAt: 0,
  promise: null,
  promiseURL: ""
};

var WidgetMetadata = {
  id: "forward.goodiptv",
  title: "Good IPTV",
  description: "Good IPTV M3U 直播源；内置完整订阅地址，每次进入频道生成新播放标识以避免旧进度续播",
  author: "Codex",
  site: "https://goodiptv.club/",
  iconurl: "",
  version: "1.0.9",
  requiredVersion: "0.0.1",
  detailCacheDuration: 0,
  globalParams: [
    {
      name: "user_agent",
      title: "播放 User-Agent",
      type: "input",
      value: GOOD_REQUIRED_UA,
      description: "源站要求的专用请求头。除非服务方明确通知，请保持 okHttp/Mod-1.5.0.0。"
    },
    {
      name: "request_timeout",
      title: "请求超时毫秒",
      type: "input",
      value: "20000",
      description: "读取 M3U 列表的超时时间，建议 10000-30000。"
    }
  ],
  modules: [
    {
      id: "allSource",
      title: "全部频道",
      functionName: "allSource",
      cacheDuration: 300,
      params: []
    },
    {
      id: "featuredChannels",
      title: "热门频道",
      functionName: "featuredChannels",
      cacheDuration: 300,
      params: []
    },
    {
      id: "channelGroups",
      title: "频道分类",
      functionName: "channelGroups",
      cacheDuration: 300,
      params: []
    },
    {
      id: "loadResource",
      title: "Good IPTV 播放线路",
      description: "按 Good IPTV 的专用 UA 播放当前频道",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: []
    }
  ],
  search: {
    title: "搜索 Good IPTV 频道",
    functionName: "searchChannels",
    params: [
      {
        name: "keyword",
        title: "频道关键词",
        type: "input",
        value: "",
        placeholders: [
          { title: "CCTV", value: "CCTV" },
          { title: "体育", value: "体育" }
        ]
      },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

function goodText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function goodDecodeEntities(value) {
  return goodText(value)
    .replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/&#(\d+);/g, function (_, number) {
      return String.fromCharCode(parseInt(number, 10));
    })
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function goodConfiguredURL(params) {
  return GOOD_DEFAULT_SOURCE_URL;
}

function goodConfiguredUA(params) {
  params = params || {};
  return goodText(params.user_agent) ||
    goodState.userAgent ||
    GOOD_REQUIRED_UA;
}

function goodConfiguredTimeout(params) {
  var value = parseInt(goodText(params && params.request_timeout) || "20000", 10);
  if (!isFinite(value)) value = 20000;
  return Math.max(5000, Math.min(60000, value));
}

function goodStatus(response) {
  return Number(
    (response && (response.statusCode || response.status || response.code)) || 200
  );
}

function goodResponseText(response) {
  var status = goodStatus(response);
  if (status < 200 || status >= 300) throw new Error("HTTP " + status);
  var data = response && response.data !== undefined ? response.data : response;
  if (typeof data === "string") return data;
  if (data === null || data === undefined) return "";
  return JSON.stringify(data);
}

function goodHeaders(params) {
  return {
    "User-Agent": goodConfiguredUA(params)
  };
}

function goodAttrs(line) {
  var attrs = {};
  var pattern =
    /([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s,]+))/g;
  var match;
  while ((match = pattern.exec(goodText(line)))) {
    attrs[match[1].toLowerCase()] =
      goodDecodeEntities(match[2] || match[3] || match[4] || "");
  }
  return attrs;
}

function goodCommaOutsideQuotes(line) {
  var quoted = false;
  var quote = "";
  var value = goodText(line);
  for (var index = 0; index < value.length; index += 1) {
    var char = value.charAt(index);
    if ((char === '"' || char === "'") && (index === 0 || value.charAt(index - 1) !== "\\")) {
      if (!quoted) {
        quoted = true;
        quote = char;
      } else if (char === quote) {
        quoted = false;
        quote = "";
      }
    } else if (char === "," && !quoted) {
      return index;
    }
  }
  return -1;
}

function goodExtinfTitle(line) {
  var comma = goodCommaOutsideQuotes(line);
  return comma >= 0 ? goodText(line.slice(comma + 1)) : "";
}

function goodParsePlaylist(text) {
  var source = goodText(text).replace(/^\uFEFF/, "").replace(/\r/g, "");
  if (source.indexOf("#EXTM3U") < 0) {
    throw new Error("直播源不是有效的 M3U 文件");
  }

  var channels = [];
  var seenURL = {};
  var currentGroup = "";
  var pending = null;
  var lines = source.split("\n");

  function addChannel(url) {
    if (!pending || !url || seenURL[url]) return;
    if (!/^(?:https?|rtmp|rtsp|rtp|udp):\/\//i.test(url)) return;
    var group = goodText(pending.group || currentGroup) || "未分组";
    var name = goodText(pending.title || pending.name) || "频道" + (channels.length + 1);
    seenURL[url] = true;
    channels.push({
      index: channels.length,
      name: name,
      title: name,
      url: url,
      group: group,
      logo: goodText(pending.logo),
      tvgId: goodText(pending.tvgId),
      duration: pending.duration,
      playlistUA: goodText(pending.playlistUA)
    });
  }

  lines.forEach(function (rawLine) {
    var line = goodText(rawLine);
    if (!line) return;
    if (/^#EXTINF:/i.test(line)) {
      var attrs = goodAttrs(line);
      pending = {
        title: goodExtinfTitle(line),
        name: attrs["tvg-name"] || "",
        group: attrs["group-title"] || "",
        logo: attrs["tvg-logo"] || "",
        tvgId: attrs["tvg-id"] || "",
        duration: line.slice(8).split(",")[0],
        playlistUA: attrs["http-user-agent"] || attrs["user-agent"] || ""
      };
      return;
    }
    if (/^#EXTGRP:/i.test(line)) {
      currentGroup = goodText(line.slice(8));
      if (pending && !pending.group) pending.group = currentGroup;
      return;
    }
    if (/^#EXTVLCOPT:/i.test(line)) {
      if (pending) {
        var option = line.slice(11);
        var userAgent = option.match(/^http-user-agent=(.+)$/i);
        if (userAgent) pending.playlistUA = goodText(userAgent[1]);
      }
      return;
    }
    if (line.charAt(0) === "#") return;
    addChannel(line);
    pending = null;
  });

  if (!channels.length) throw new Error("M3U 中没有可播放频道");
  return channels;
}

async function goodLoadChannels(params) {
  params = params || {};
  var url = goodConfiguredURL(params);
  var userAgent = goodConfiguredUA(params);
  var now = Date.now();
  if (
    goodState.text &&
    goodState.url === url &&
    goodState.userAgent === userAgent &&
    now - goodState.loadedAt < GOOD_CACHE_MS
  ) {
    return goodState.channels;
  }
  if (goodState.promise && goodState.promiseURL === url) {
    return goodState.promise;
  }

  goodState.promiseURL = url;
  goodState.promise = (async function () {
    var response = await Widget.http.get(url, {
      headers: { "User-Agent": userAgent },
      timeout: goodConfiguredTimeout(params)
    });
    var text = goodResponseText(response);
    var channels = goodParsePlaylist(text);
    goodState.text = text;
    goodState.channels = channels;
    goodState.url = url;
    goodState.userAgent = userAgent;
    goodState.loadedAt = Date.now();
    return channels;
  })();

  try {
    return await goodState.promise;
  } finally {
    goodState.promise = null;
    goodState.promiseURL = "";
  }
}

function goodGroupPriority(group) {
  var order = {
    "央视": 10,
    "央视-MCP": 20,
    "卫视": 30,
    "卫视-MCP": 40,
    "地方": 50,
    "影视": 60,
    "体育": 70,
    "熊猫": 80,
    "教育": 90,
    "纪实": 100,
    "少儿": 110,
    "综艺": 120,
    "其他": 130,
    "4K频道": 140,
    "AV3A频道": 150,
    "其他-MCP": 160
  };
  return order[group] || 500;
}

function goodGroupsFromChannels(channels) {
  var groups = [];
  var groupMap = {};
  channels.forEach(function (channel) {
    if (!groupMap[channel.group]) {
      groupMap[channel.group] = {
        name: channel.group,
        channels: [],
        firstIndex: channel.index
      };
      groups.push(groupMap[channel.group]);
    }
    groupMap[channel.group].channels.push(channel);
  });
  groups.sort(function (left, right) {
    var priority = goodGroupPriority(left.name) - goodGroupPriority(right.name);
    return priority || left.firstIndex - right.firstIndex;
  });
  return groups;
}

function goodChannelLink(index) {
  goodPlaySequence += 1;
  var nonce = Date.now().toString(36) + "-" + goodPlaySequence.toString(36);
  return GOOD_LINK_PREFIX + "channel/" + Number(index) + "?play=" + nonce;
}

function goodGroupLink(group) {
  return GOOD_LINK_PREFIX + "group/" + encodeURIComponent(goodText(group));
}

function goodParseLink(value) {
  var link = goodText(value);
  var prefix = link.indexOf("good://") === 0
    ? "good://"
    : (link.indexOf("goodiptv://") === 0 ? "goodiptv://" : "");
  if (!prefix) return null;
  var rest = link.slice(prefix.length);
  var queryIndex = rest.indexOf("?");
  var hashIndex = rest.indexOf("#");
  var cutoff = rest.length;
  if (queryIndex >= 0) cutoff = Math.min(cutoff, queryIndex);
  if (hashIndex >= 0) cutoff = Math.min(cutoff, hashIndex);
  var path = rest.slice(0, cutoff);
  var slash = path.indexOf("/");
  var type = slash >= 0 ? path.slice(0, slash) : path;
  var target = slash >= 0 ? path.slice(slash + 1) : "";
  if (type === "group") {
    try {
      target = decodeURIComponent(target);
    } catch (error) {}
  }
  return { type: type, target: target, raw: link };
}

function goodPoster(channel) {
  return channel && channel.logo ? channel.logo : "";
}

function goodMapChannel(channel, position) {
  var poster = goodPoster(channel);
  var link = goodChannelLink(channel.index);
  var episodeNumber = isFinite(position) ? Number(position) + 1 : channel.index + 1;
  return {
    id: link,
    type: "url",
    title: channel.name,
    originalTitle: channel.name,
    description: [
      channel.group || "未分组",
      "Good IPTV"
    ].filter(Boolean).join(" · "),
    posterPath: poster,
    detailPoster: poster,
    backdropPath: poster,
    backdropPaths: poster ? [poster] : [],
    coverUrl: poster,
    rating: 0,
    mediaType: "tv",
    genreTitle: channel.group,
    genreItems: channel.group ? [{
      id: "good-group-" + channel.group,
      title: channel.group
    }] : [],
    peoples: [],
    episode: episodeNumber,
    duration: 0,
    link: link,
    externalUrl: link,
    source: "Good IPTV",
    goodChannelIndex: channel.index
  };
}

function goodMapSource(title, channels, link) {
  var first = channels.find(function (channel) { return channel.logo; }) || channels[0] || {};
  var poster = goodPoster(first);
  return {
    id: link,
    type: "url",
    title: title,
    originalTitle: title,
    description: channels.length + " 个频道 · Good IPTV · 专用 UA",
    posterPath: poster,
    detailPoster: poster,
    backdropPath: poster,
    backdropPaths: poster ? [poster] : [],
    coverUrl: poster,
    rating: 0,
    mediaType: "tv",
    genreTitle: title === "全部频道" ? "直播" : title,
    genreItems: [],
    peoples: [],
    episodeCount: channels.length,
    link: link,
    externalUrl: link,
    source: "Good IPTV"
  };
}

async function allSource(params) {
  var channels = await goodLoadChannels(params || {});
  return [goodMapSource("全部频道", channels, GOOD_LINK_PREFIX + "all")];
}

async function channelGroups(params) {
  var channels = await goodLoadChannels(params || {});
  return goodGroupsFromChannels(channels).map(function (group) {
    return goodMapSource(
      group.name,
      group.channels,
      goodGroupLink(group.name)
    );
  });
}

async function featuredChannels(params) {
  var channels = await goodLoadChannels(params || {});
  var selected = channels
    .filter(function (channel) {
      return !/测试/i.test(channel.name);
    })
    .slice()
    .sort(function (left, right) {
      var priority =
        goodGroupPriority(left.group) - goodGroupPriority(right.group);
      return priority || left.index - right.index;
    })
    .slice(0, 16);
  if (!selected.length) selected = channels.slice(0, 16);
  return selected.map(goodMapChannel);
}

async function loadDetail(link, params) {
  if (link && typeof link === "object") {
    link = link.link || link.externalUrl || link.id || "";
  }
  var parsed = goodParseLink(link);
  if (!parsed) throw new Error("无法识别 Good IPTV 播放入口");
  var channels = await goodLoadChannels(params || {});
  var selected = [];
  var title = "全部频道";
  var detailLink = GOOD_LINK_PREFIX + "all";

  if (parsed.type === "channel") {
    var channelIndex = parseInt(parsed.target, 10);
    var channel = channels.find(function (item) {
      return item.index === channelIndex;
    });
    if (!channel) throw new Error("频道不存在或直播源已经更新");
    selected = [channel];
    title = channel.name;
    detailLink = link;
  } else if (parsed.type === "group") {
    title = parsed.target || "未分组";
    detailLink = link;
    selected = channels.filter(function (item) {
      return item.group === title;
    });
  } else if (parsed.type === "all") {
    selected = channels.slice();
  } else {
    throw new Error("无法识别 Good IPTV 入口类型");
  }

  if (!selected.length) throw new Error("当前分类没有频道");
  var detail = goodMapSource(title, selected, detailLink);
  detail.episodeCount = selected.length;
  detail.episodeItems = selected.map(goodMapChannel);
  return detail;
}

async function searchChannels(params) {
  params = params || {};
  var keyword = goodText(params.keyword || params.query || params.title).toLowerCase();
  var channels = await goodLoadChannels(params);
  if (!keyword) return channels.slice(0, GOOD_PAGE_SIZE).map(goodMapChannel);
  var page = parseInt(goodText(params.page) || "1", 10);
  if (!isFinite(page) || page < 1) page = 1;
  var matched = channels.filter(function (channel) {
    return (
      channel.name.toLowerCase().indexOf(keyword) >= 0 ||
      channel.group.toLowerCase().indexOf(keyword) >= 0
    );
  });
  var start = (page - 1) * GOOD_PAGE_SIZE;
  return matched.slice(start, start + GOOD_PAGE_SIZE).map(goodMapChannel);
}

async function loadResource(params) {
  params = params || {};
  var link = params.link || params.url || params.externalUrl || "";
  if (link && typeof link === "object") {
    link = link.link || link.externalUrl || link.id || "";
  }
  var parsed = goodParseLink(link);
  if (!parsed || parsed.type !== "channel") {
    throw new Error("当前入口不是可播放的 Good IPTV 频道");
  }
  var channelIndex = parseInt(parsed.target, 10);
  var channels = await goodLoadChannels(params);
  var channel = channels.find(function (item) {
    return item.index === channelIndex;
  });
  if (!channel) throw new Error("频道不存在或直播源已经更新");
  if (!/^https?:\/\//i.test(channel.url)) {
    throw new Error("当前频道不是 HTTP(S) 直播流");
  }

  var headers = {
    "User-Agent": goodConfiguredUA(params)
  };
  return [{
    name: channel.name + " · Good IPTV",
    description: [
      "来源：Good IPTV",
      "分组：" + (channel.group || "未分组"),
      "请求头：User-Agent=" + headers["User-Agent"]
    ].join("\n"),
    url: channel.url,
    customHeaders: headers,
    headers: headers,
    playerType: "app"
  }];
}
