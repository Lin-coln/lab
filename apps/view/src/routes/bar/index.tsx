import cx from "clsx";
import { Button } from "ui";
import { useParams, useNavigate } from "react-router";

export function loader() {
  console.log("bar loading...");
  return {};
}

export function Component() {
  const navigate = useNavigate();
  const params = useParams();
  return (
    <div className={cx("flex flex-col justify-center items-center min-h-screen", "app-region-drag")}>
      <div>Bar</div>
      <div>{JSON.stringify(params)}</div>
      <div className="max-w-120 mb-8">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, blanditiis, distinctio dolore doloribus eaque
        earum facere id ipsam magni nam natus nobis omnis optio qui quia quis similique soluta. Perferendis?
      </div>
      <Button
        label={"home"}
        onClick={() => {
          navigate("/");
        }}
      />
    </div>
  );
}
