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

/**
 * Send a message to the background script to update the badge text of the
 * chrome extension.
 *
 * @param {string} [text] the text to set as the badge text
 */
function updateBadgeText(text = '') {
  chrome.runtime.sendMessage({ action: 'updateBadgeText', text });
}

function rifm() {
  if (['www.youtube.com', 'youtube.com'].includes(location.host)) {
    readYouTubeForMe();
  } else {
    readOtherThingsForMe();
  }
}

async function readYouTubeForMe() {
  try {
    updateBadgeText('...');

    // fetch html of current page
    const pageResponse = await fetch(window.location.href);
    const pageHtml = await pageResponse.text();

    // ask rifm api to get caption url
    const captionResponse = await fetch(
      'https://rifm.vercel.app/api/public/youtube/caption',
      {
        method: 'POST',
        body: JSON.stringify({
          html: pageHtml,
        }),
      },
    );
    const result = await captionResponse.text();

    // navigate to rifm page
    const pageUrl = encodeURIComponent(window.location.href);
    const captionUrl = encodeURIComponent(result);
    const dest = `https://rifm.vercel.app?source=${pageUrl}&caption=${captionUrl}`;
    window.open(dest, '_blank');
  } catch (error) {
    alert(`Fail to read caption from the page: ${String(error)}`);
  } finally {
    updateBadgeText();
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
