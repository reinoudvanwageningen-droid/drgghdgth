(() => {
  const doNotTrackEnabled =
    navigator.doNotTrack === "1" ||
    navigator.msDoNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.globalPrivacyControl === true;
  if (doNotTrackEnabled) {
    return;
  }

  const counterNamespace = "capsconsult-nl";
  const referrer = document.referrer.toLowerCase();
  const sourceKey = referrer.includes("linkedin.")
    ? "source-linkedin"
    : referrer.includes("google.")
      ? "source-google"
      : referrer
        ? "source-overig"
        : "source-direct";
  const deviceKey = window.innerWidth < 768 ? "device-mobiel" : "device-desktop";

  const keys = ["page-visits", sourceKey, deviceKey];

  keys.forEach((counterKey) => {
    const endpoint = `https://api.countapi.xyz/hit/${counterNamespace}/${counterKey}`;
    fetch(endpoint, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      keepalive: true,
      credentials: "omit",
      referrerPolicy: "no-referrer"
    }).catch(() => {
      // Tracking is best-effort and should never affect page functionality.
    });
  });
})();
