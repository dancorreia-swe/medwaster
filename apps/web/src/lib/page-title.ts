import { BRAND_NAME } from "./brand";

const BASE_TITLE = BRAND_NAME;

export function formatPageTitle(pageTitle?: string) {
  return pageTitle ? `${BASE_TITLE} - ${pageTitle}` : BASE_TITLE;
}

export function buildPageHead(pageTitle?: string) {
  return {
    meta: [{ title: formatPageTitle(pageTitle) }],
  };
}
