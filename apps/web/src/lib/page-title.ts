const BASE_TITLE = "Medwaster";

export function formatPageTitle(pageTitle?: string) {
  return pageTitle ? `${BASE_TITLE} - ${pageTitle}` : BASE_TITLE;
}

export function buildPageHead(pageTitle?: string) {
  return {
    meta: [{ title: formatPageTitle(pageTitle) }],
  };
}
