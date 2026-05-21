import { useEffect, useState } from "react";

const readStorageValue = (key, initialValue) => {
  if (typeof window === "undefined") return typeof initialValue === "function" ? initialValue() : initialValue;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw);
  } catch (error) {
    console.error(`Erro ao ler localStorage (${key}):`, error);
  }

  return typeof initialValue === "function" ? initialValue() : initialValue;
};

export const usePersistentState = (key, initialValue) => {
  const [value, setValue] = useState(() => readStorageValue(key, initialValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao salvar localStorage (${key}):`, error);
    }
  }, [key, value]);

  return [value, setValue];
};
