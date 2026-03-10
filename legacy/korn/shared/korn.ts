declare global {
  namespace KornAPI {
    export type App = RestAPI.RouteParent<{
      name: "api";
      children: [
        { name: "video"; query: { name: "asd" }; get: "stream" },
        // ...
        Auth,
      ];
    }>;

    export type Auth = RestAPI.RouteParent<{
      name: "auth";
      children: [
        {
          name: "sign_in";
          body: { username: string; password: string };
          post: { token: string };
        },
        {
          name: "sign_out";
          post: "ok";
        },
      ];
    }>;
  }
}
