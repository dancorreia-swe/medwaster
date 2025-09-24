import { useSuspenseQuery } from "@tanstack/react-query";
import { topicsQueryOptions } from "../api/topics";

export function Topics() {
  const { data } = useSuspenseQuery(topicsQueryOptions);

  console.log(data);
  return <div>Hello "/topics"!</div>;
}
