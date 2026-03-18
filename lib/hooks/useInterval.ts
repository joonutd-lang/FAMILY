"use client";

import * as React from "react";

export function useInterval(callback: () => void, delay: number) {
  const cbRef = React.useRef(callback);
  React.useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    const id = window.setInterval(() => cbRef.current(), delay);
    return () => window.clearInterval(id);
  }, [delay]);
}

