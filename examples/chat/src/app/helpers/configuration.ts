import { Configuration } from '../types';

const INWORLD_CONFIGURATION_KEY = 'inworldConfiguration';

export const save = (values: Configuration) => {
  localStorage.setItem(INWORLD_CONFIGURATION_KEY, JSON.stringify(values));
};

export const get = (): Configuration | null => {
  const storedValue = localStorage.getItem(INWORLD_CONFIGURATION_KEY);
  if (storedValue) {
    return JSON.parse(storedValue);
  }
  return null;
};
