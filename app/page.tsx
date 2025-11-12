"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type Address = {
  prefecture?: string;
  city?: string;
  town?: string;
};

export default function Home() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [status, setStatus] = useState<string>("位置情報を取得中です…");
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("このブラウザは位置情報取得に対応していません。");
      setStatus("");
      return;
    }

    setCoords(null);
    setAddress(null);
    setError(null);
    setStatus("位置情報を取得中です…");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setStatus("住所情報を取得中です…");

        const params = new URLSearchParams({
          format: "jsonv2",
          lat: latitude.toString(),
          lon: longitude.toString(),
          addressdetails: "1",
          "accept-language": "ja",
        });

        fetch(
          `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        )
          .then(async (response) => {
            if (!response.ok) {
              throw new Error("住所情報の取得に失敗しました。");
            }
            return response.json();
          })
          .then((data) => {
            const { address: addr = {} } = data ?? {};
            setAddress({
              prefecture: addr.state ?? addr.region ?? "",
              city: addr.city ?? addr.town ?? addr.village ?? "",
              town: addr.suburb ?? addr.neighbourhood ?? addr.hamlet ?? "",
            });
            setStatus("取得が完了しました。");
          })
          .catch((fetchError) => {
            console.error(fetchError);
            setError("住所情報の取得でエラーが発生しました。");
            setStatus("");
          });
      },
      (positionError) => {
        switch (positionError.code) {
          case positionError.PERMISSION_DENIED:
            setError("位置情報の取得が許可されませんでした。");
            break;
          case positionError.POSITION_UNAVAILABLE:
            setError("位置情報を取得できませんでした。");
            break;
          case positionError.TIMEOUT:
            setError("位置情報の取得がタイムアウトしました。");
            break;
          default:
            setError("位置情報の取得中に予期せぬエラーが発生しました。");
        }
        setStatus("");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const formattedAddress = useMemo(() => {
    if (!address) return "";
    const parts = [address.prefecture, address.city, address.town].filter(
      Boolean
    );
    return parts.join(" ");
  }, [address]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between bg-white py-32 px-16 dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            木山のVercelの検証用サイト
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <section className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-zinc-100/70 p-6 text-left shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            現在地情報
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            「現在地の取得を許可する」を押すと、端末の緯度経度と住所を表示します。
          </p>
          <div className="mt-4 space-y-2 text-base text-zinc-800 dark:text-zinc-200">
            {status && (
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                {status}
              </p>
            )}
            {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
            {coords && (
              <div>
                <p>
                  緯度:{" "}
                  <span className="font-mono">
                    {coords.latitude.toFixed(6)}
                  </span>
                </p>
                <p>
                  経度:{" "}
                  <span className="font-mono">
                    {coords.longitude.toFixed(6)}
                  </span>
                </p>
              </div>
            )}
            {formattedAddress && (
              <p>
                住所推定:{" "}
                <span className="font-medium">{formattedAddress}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={requestLocation}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            再取得する
          </button>
        </section>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
