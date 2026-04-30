import cx from "clsx";
import { Button } from "ui";
import { useNavigate } from "react-router";

export function Component() {
  const navigate = useNavigate();
  return (
    <div className={cx("flex flex-col justify-center items-center min-h-screen", "app-region-drag")}>
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
      <Button
        label={"/bar/joaidjfa"}
        onClick={() => {
          navigate("/bar/joaidjfa");
        }}
      />
    </div>
  );
}
