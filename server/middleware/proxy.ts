/**
 * Forwards every request that isn't handled by this app to the Pxls back end.
 *
 * Browser navigations that the back end answers with an error fall through to
 * the SPA, which renders its own error page (like the old Express server did).
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  if (path === '/ws' || isFrontendPath(path)) {
    return;
  }

  const target = backendUrl() + getRequestURL(event).pathname + getRequestURL(event).search;
  const headers = { accept: getRequestHeader(event, 'accept') ?? '*/*' };

  if (!isNavigationRequest(event)) {
    return proxyRequest(event, target, { headers, fetchOptions: { redirect: 'manual' } });
  }

  let response: Response;
  try {
    response = await fetch(target, {
      headers: { ...getProxyRequestHeaders(event), ...headers },
      redirect: 'manual',
    });
  } catch (cause) {
    throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', cause });
  }

  if (response.status >= 400) {
    // Let the SPA shell render; the client-side catch-all page shows the error.
    setResponseStatus(event, response.status);
    setCookie(event, 'pxls-error-status', String(response.status), { path: '/', maxAge: 60 });
    await response.body?.cancel();
    return;
  }

  // fetch() already decoded the body, so the encoding headers no longer apply.
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  return sendWebResponse(
    event,
    new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    }),
  );
});
