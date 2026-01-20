import { Button } from "ui";

export default function App() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <div className="max-w-120 mb-8">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, blanditiis, distinctio dolore doloribus eaque
        earum facere id ipsam magni nam natus nobis omnis optio qui quia quis similique soluta. Perferendis?
      </div>
      <Button
        label={"music converter"}
        onClick={() => {
          console.log(123);
        }}
      />
    </div>
  );
}
