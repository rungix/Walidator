

# A Firefox Web Extension

Dev-related logs.

## Cache-related HTTP headers

- ETag
- Cache-Control
- Expires
- Last-Modified



## Cache Busting

Cache busting is where we invalidate a cached file and force the browser to retrieve the file from the server. 

### Versioning

We could add a version number to the filename:

```markup
assets/js/app-v2.min.js
```

### Fingerprinting

We could add a fingerprint based on the file contents:

```markup
assets/js/app-d41d8cd98f00b204e9800998ecf8427e.min.js
```

### Append Query String

We could append a query string to the end of the filename:

```markup
assets/js/app.min.js?version=2
```





## HTTP response can't be intercepted

[Intercept HTTP requests](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Intercept_HTTP_requests)

> To intercept HTTP requests, use the webRequest API. This API enables you to add listeners for various stages of making an HTTP request. In the listeners, you can:
>
>     get access to request headers and bodies, and response headers
>     cancel and redirect requests
>     modify request and response headers



## Browser's dev console can't show modified HTTP headers

[Headers modified in webRequest.onHeadersReceived are not displayed in Netmonitor](https://bugzilla.mozilla.org/show_bug.cgi?id=1376950)



## How to log HTTP headers in Firefox

[HTTP logging](https://developer.mozilla.org/en-US/docs/Mozilla/Debugging/HTTP_logging)

1. Open a new tab and type in "about:networking" into the URL bar.

2. Go to the "Logging section"

3. Adjust the list of modules that you want to log: 

   > Logging only HTTP request and response headers: Replace MOZ_LOG`=nsHttp:5` with MOZ_LOG`=nsHttp:3`

## HTTP traffic-sniffing and manipulation tool

[Hoxy](https://github.com/greim/hoxy)



