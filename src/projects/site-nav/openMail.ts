/** Opens the visitor's mail app, addressed to Ethan. The address is never shown
 *  and never sits in the HTML, the JS or a static mailto: href (spam scrapers read
 *  all three): it is stored with every character shifted up by one and decoded only
 *  when a contact link is pressed. Plain split-up parts are not enough, because the
 *  minifier joins constant parts back into the full address at build time; a regex
 *  callback is something it cannot evaluate ahead of time. */
const MAIL_HREF = 'nbjmup;jbnfuibocblbsfAhnbjm/dpn';
export const openMail = () => {
  window.location.href = MAIL_HREF.replace(/./g, (c) => String.fromCharCode(c.charCodeAt(0) - 1));
};

/** onClick for an <a href="#"> contact link: keeps the anchor's look and keyboard
 *  behaviour, opens mail instead of following the "#". */
export const onMailClick = (e: { preventDefault: () => void }) => {
  e.preventDefault();
  openMail();
};
