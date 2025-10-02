import { Outlet, useChildMatches } from '@tanstack/react-router';

export const wrapRouteWithOutletIfNested = <
  TProps extends Record<string, unknown>
>(
  Component: React.ComponentType<TProps>
) => {
  const OutletIfNested = (props: TProps) => {
    const childMatches = useChildMatches();

    if (childMatches.length) return <Outlet />;

    return <Component {...props} />;
  };

  return OutletIfNested;
};
