import { useMatches } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Fragment } from "react/jsx-runtime";

const AppBreadcrumb = () => {
  const matches = useMatches();

  const breadcrumbs = matches
    .filter((match) => match.context.getTitle)
    .map(({ pathname, context }) => {
    console.log('match context:', context);
      return {
        title: context.getTitle ? context.getTitle() : "Untitled",
        path: pathname,
      };
    });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={breadcrumb.path}>
            <BreadcrumbItem >
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={breadcrumb.path}>
                  {breadcrumb.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export { AppBreadcrumb };
