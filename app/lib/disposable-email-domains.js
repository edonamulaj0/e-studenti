export const ALWAYS_ALLOWED_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "protonmail.com",
  "proton.me",
  "uni-pr.edu",
];

export const DISPOSABLE_EMAIL_DOMAINS = [
  "mailinator.com",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "yopmail.com",
  "yopmail.fr",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "getnada.com",
  "maildrop.cc",
  "dispostable.com",
  "fakeinbox.com",
  "fishnone.com",
  "mintemail.com",
  "mohmal.com",
  "moakt.com",
  "emailondeck.com",
  "sharklasers.com",
  "spam4.me",
  "mailnesia.com",
  "mailcatch.com",
  "mytemp.email",
  "tempinbox.com",
  "burnermail.io",
  "33mail.com",
  "anonaddy.com",
  "simplelogin.io",
  "discard.email",
  "tempr.email",
  "fakemail.net",
  "mailsac.com",
  "inboxkitten.com",
  "tempmailo.com",
  "emailfake.com",
  "crazymailing.com",
  "tempmail.ninja",
  "mail-temp.com",
  "1secmail.com",
  "1secmail.net",
  "1secmail.org",
  "luxusmail.org",
  "rootfest.net",
  "mailbox52.ml",
  "spambox.us",
  "tempmail2.com",
  "throwam.com",
  "kleemail.com",
  "deadaddress.com",
];

export function isDisposableEmail(email) {
  const domain = String(email || "").toLowerCase().split("@")[1];
  if (!domain) return true;
  if (ALWAYS_ALLOWED_DOMAINS.includes(domain)) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) return true;
  return false;
}

export const DISPOSABLE_EMAIL_ERROR =
  "Nuk mund të krijoni llogari me email të përkohshëm. Ju lutem përdorni Gmail, Outlook, ProtonMail ose email-in tuaj universitar (@uni-pr.edu).";
