"use strict";

var http = require("http");
var fs = require("fs");
var path = require("path");
var execFile = require("child_process").execFile;
var { URL } = require("url");

var root = __dirname;
var port = Number(process.env.PORT) || 8000;
var upstreams = {
  pv: "https://www.prajavani.net/api/v1/menu-groups",
  dh: "https://www.deccanherald.com/api/v1/menu-groups"
};
var mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function send(response, status, body, contentType) {
  response.writeHead(status, { "Content-Type": contentType });
  response.end(body);
}

async function proxyMenuGroups(response, brand) {
  var upstream = upstreams[brand];
  if (!upstream) {
    send(response, 400, JSON.stringify({ error: "Unknown brand" }), "application/json; charset=utf-8");
    return;
  }

  try {
    var result = await new Promise(function (resolve, reject) {
      execFile("curl.exe", [
        "-sS",
        "-L",
        "-A",
        "Mozilla/5.0",
        "-H",
        "Accept: application/json",
        "-w",
        "\n__HTTP_STATUS__%{http_code}",
        upstream
      ], { maxBuffer: 20 * 1024 * 1024, encoding: "utf8" }, function (error, stdout) {
        if (error) {
          reject(error);
          return;
        }

        var marker = "\n__HTTP_STATUS__";
        var markerIndex = stdout.lastIndexOf(marker);
        resolve({
          body: markerIndex >= 0 ? stdout.slice(0, markerIndex) : stdout,
          status: markerIndex >= 0 ? Number(stdout.slice(markerIndex + marker.length)) : 200
        });
      });
    });

    response.writeHead(result.status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end(result.body);
  } catch (error) {
    console.error("Menu API proxy failed:", error.message);
    send(response, 502, JSON.stringify({ error: "Unable to reach menu API" }), "application/json; charset=utf-8");
  }
}

function serveStatic(response, pathname) {
  var requestedPath = pathname === "/" ? "/index.html" : pathname;
  var filePath = path.resolve(root, "." + requestedPath);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    send(response, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  fs.stat(filePath, function (statError, stats) {
    if (statError || !stats.isFile()) {
      send(response, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

var server = http.createServer(function (request, response) {
  var requestUrl = new URL(request.url, "http://localhost");
  if (request.method === "GET" && requestUrl.pathname === "/api/menu-groups") {
    proxyMenuGroups(response, requestUrl.searchParams.get("brand") || "pv");
    return;
  }

  if (request.method !== "GET") {
    send(response, 405, "Method not allowed", "text/plain; charset=utf-8");
    return;
  }

  if (requestUrl.pathname === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }

  serveStatic(response, requestUrl.pathname);
});

server.listen(port, function () {
  console.log("Navbar server running at http://localhost:" + port);
});
