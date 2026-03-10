import { Button } from "ui";
import cx from "clsx";
import { useRouter } from "utils/react";

export default function App() {
  const routeNode = useRouter({
    mode: "history",
    getRoute: (name: string) => ({ "/": Index })[name],
  });

  return routeNode;
}

function Index() {
  return (
    <div className={cx("flex flex-col justify-center items-center min-h-screen", "app-region-drag")}>
      <div className="max-w-120 mb-8">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, blanditiis, distinctio dolore doloribus eaque
        earum facere id ipsam magni nam natus nobis omnis optio qui quia quis similique soluta. Perferendis?
      </div>
      <Button
        label={"button"}
        onClick={() => {
          console.log(123);
        }}
      />
    </div>
  );
}
