/**
 * @typedef {Object} CaptionTrack
 * @property {string} baseUrl the root url of the read api
 * @property {string} languageCode the language code of the text to be read
 * @property {("asr" | undefined)} [kind] the kind of text to be read
 *
 * @typedef {Object} YouTubeInitialPlayerResponse
 * @property {Object} captions
 * @property {Object} captions.playerCaptionsTracklistRenderer
 * @property {CaptionTrack[]} captions.playerCaptionsTracklistRenderer.captionTracks
 */

function rifm() {
  if (['www.youtube.com', 'youtube.com'].includes(location.host)) {
    readYouTubeForMe();
  } else {
    readOtherThingsForMe();
  }
}

function readYouTubeForMe() {
  // find the init player response data from page
  const start = 'var ytInitialPlayerResponse = ';
  const end = '};';
  const script = [...document.body.querySelectorAll('script')].find((s) =>
    s.innerText.includes(start),
  );

  if (script) {
    const text = script.innerText;
    const i = text.indexOf(start) + start.length;
    const j = text.indexOf(end, i);
    const code = text.substring(i, j + 1);

    try {
      /** @type {YouTubeInitialPlayerResponse} */
      const data = JSON.parse(code);

      const weighted =
        data.captions.playerCaptionsTracklistRenderer.captionTracks.map(
          (track) => {
            let weight = 0;

            // en, en-xx, zh-xx, others
            if (track.languageCode === 'en') {
              weight = 1;
            } else if (track.languageCode.startsWith('en')) {
              weight = 2;
            } else if (track.languageCode.startsWith('zh')) {
              weight = 3;
            } else {
              weight = 4;
            }

            if (track.kind === 'asr') weight += 10;

            return { ...track, weight };
          },
        );

      const sorted = weighted.sort((a, b) => {
        if (a.weight !== b.weight) {
          return a.weight - b.weight;
        }
        return a.languageCode.localeCompare(b.languageCode);
      });

      if (sorted[0]) {
        const pageUrl = encodeURIComponent(window.location.href);
        const captionUrl = encodeURIComponent(sorted[0].baseUrl);
        const dest = `https://rifm.vercel.app?source=${pageUrl}&caption=${captionUrl}`;
        window.open(dest, '_blank');
      } else {
        throw new Error('No caption track found');
      }
    } catch (error) {
      alert(`Fail to find caption track from the page: ${String(error)}`);
    }
  }
}

function readOtherThingsForMe() {
  const url = window.location.href;
  const dest = `https://rifm.vercel.app?source=${encodeURIComponent(url)}`;
  window.open(dest, '_blank');
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'rifm') {
    rifm();
  }
});
