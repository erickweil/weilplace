
export const getApiURL = (route) => {
  //const clientside_api_url = "http://localhost:3001";
  const clientside_api_url = "https://k3s.devops.fslab.dev/30090";
  const serverside_api_url = "http://weilplace-server:3001";
  if(typeof window === "undefined") {
    return new URL(serverside_api_url+route);
  } else {
    return new URL(clientside_api_url+route);
  }
}