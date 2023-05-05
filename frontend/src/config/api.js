export const getApiURL = (route) => {
  if(typeof window === "undefined") {
    const serverside_api_url = process.env.SERVERSIDE_API_URL;
    return new URL(serverside_api_url+route);
  } else {
    const clientside_api_url = process.env.NEXT_PUBLIC_API_URL;
    return new URL(clientside_api_url+route);
  }
}