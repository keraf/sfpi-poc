# Secure full page iframe
The scenario here is to provide a secure way to display an iframe cross-domain as full page. Three apps are in this proof of concept for the demo with the following assumptions:
- App 1: Served on our domain and servers.
- App 2: Served on a third party domain (not in our control) but served from our servers.
- App 3: Served on a third party domain and server (not in our control).

The two first apps can be run by using `npm run app1:start` for App 1 and `npm run app2:start` for App 2. App 3 is a simple HTML file that can directly be opened by the browser.

## App 1
Site that includes all the functionality we want to provide to our applications that run on different domains. Both endpoints, `/` and `/iframe` render the same result but have notable differences:
- `/`: Does not allow to be embedded as an iframe by using the `x-frame-options=DENY` header.
- `/iframe`: Requires a token to be passed to authorize its usage.

Some other endpoints exist to demo basic functionality and the usage of cookies. It is possible to log in and out from a dummy account.

In order for the cookie to work in an iframe embedded with a different origin, the `SameSite=None` attribute has to be set (which requires `Secure=true` to be set as well).

## App 2
Site that is intended to use the iframe from App 1 on a different origin. It should have the same functionality as App 1 and act transparently for the user.

Under the hood, the application rendering the page of App 2 makes a request for a short lived token to App 1. This token is then used when requesting the iframe from App 1 which will validate it before the iframe content is rendered.

## App 3
Malicious site, tries to embed the iframe without proper authorization using 4 different methods:
- Embedding the home page of App 1 -> Doesn't work because it sets the `x-frame-options` header to `DENY` to prevent it from being embedded as an iframe.
- Embedding the iframe endpoint of App 1 without token -> Gets rejected for missing the token.
- Embedding the iframe endpoint of App 1 with an old token generated for App 2 -> Gets rejected for an expired token or mismatching referer (if the token is new).
- Pulling the content of App 2 to embed it in the page and use a fresh token -> Gets rejected for a mismatching referer.
