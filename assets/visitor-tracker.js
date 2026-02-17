(() => {
  const doNotTrackEnabled =
    navigator.doNotTrack === "1" ||
    navigator.msDoNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.globalPrivacyControl === true;
  if (doNotTrackEnabled) {
    return;
  }

  const counterNamespace = "jvw-infraservice-nl";
  const isDebugMode =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.search.includes("debugTracker=1");

  const logTrackerIssue = (error, counterKey) => {
    if (!isDebugMode) {
      return;
    }
    console.debug("visitor-tracker: hit failed", {
      counterKey,
      message: error?.message ?? "unknown error"
    });
  };

  const getSourceKey = () => {
    if (!document.referrer) {
      return "source-direct";
    }

    let referrerHost = "";
    try {
      referrerHost = new URL(document.referrer).hostname.toLowerCase();
    } catch {
      referrerHost = document.referrer.toLowerCase();
    }

    if (referrerHost.includes("linkedin.")) {
      return "source-linkedin";
    }
    if (referrerHost.includes("google.")) {
      return "source-google";
    }
    return "source-overig";
  };

  const getDeviceKey = () => {
    const mobileByViewport = window.matchMedia("(max-width: 767px)").matches;
    const mobileByUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    return mobileByViewport || mobileByUserAgent ? "device-mobiel" : "device-desktop";
  };

  const sourceKey = getSourceKey();
  const deviceKey = getDeviceKey();

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
    }).catch((error) => {
      // Tracking is best-effort and should never affect page functionality.
      logTrackerIssue(error, counterKey);
    });
  });
})();
