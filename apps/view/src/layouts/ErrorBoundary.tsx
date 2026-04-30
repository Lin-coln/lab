import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { Button } from "ui";

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      {isRouteErrorResponse(error) ? (
        <>
          <h1 className="text-4xl font-bold">{error.status}</h1>
          <p className="mt-2">{error.statusText}</p>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-bold">Error</h1>
          <p className="mt-2">{(error as Error).message}</p>
        </>
      )}

      <Button
        label={"back to home"}
        onClick={() => {
          navigate("/");
        }}
      />
    </div>
  );
}
