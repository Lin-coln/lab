import { Suspense, type ReactNode } from "react";
import cx from "clsx";
import { routes, useHashRoute } from "./routes.ts";

export default function App() {
  const route = useHashRoute();
  const RouteComponent = routes[route];
  const loadingNode = <Center className={cx("text-xl")}>Loading...</Center>;
  const notFoundNode = <Center className={cx("text-2xl")}>404 Not Found</Center>;
  return <Suspense fallback={loadingNode}>{RouteComponent ? <RouteComponent /> : notFoundNode}</Suspense>;
}

function Center(props: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("w-screen h-screen", "flex justify-center items-center", props.className)}>{props.children}</div>
  );
}
