import { useQuery } from "@tanstack/react-query";

export interface IPLocationData {
  ip: string;
  country: string;
  province: string;
  city: string;
  latitude: string;
  longitude: string;
}

async function fetchIPLocation(): Promise<IPLocationData | null> {
  const res = await fetch("/api/public/weather/ip-location");
  const result = await res.json();
  if (result.code === 200 && result.data) {
    return {
      ip: result.data.ip || "",
      country: result.data.country || "",
      province: result.data.province || "",
      city: result.data.city || "",
      latitude: result.data.latitude || "",
      longitude: result.data.longitude || "",
    };
  }
  return null;
}

export function useIPLocation() {
  return useQuery<IPLocationData | null>({
    queryKey: ["ip-location"],
    queryFn: fetchIPLocation,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
