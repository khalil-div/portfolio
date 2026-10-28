"use client";

import { useSyncExternalStore } from "react";

const format = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Muscat",
  hour: "2-digit",
  minute: "2-digit",
});

const subscribe = (notify: () => void) => {
  const id = setInterval(notify, 15_000);
  return () => clearInterval(id);
};

/** Muscat's current time. Empty on the server, filled in on the client. */
export function LocalTime() {
  const time = useSyncExternalStore(
    subscribe,
    () => format.format(new Date()),
    () => "",
  );

  return (
    <span className="mono" dir="ltr" style={{ minWidth: "5.5em" }}>
      {time && `${time} GST`}
    </span>
  );
}
