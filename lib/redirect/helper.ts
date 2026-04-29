// Store redirect in sessionStorage (client-side only)
export const storeRedirect = (redirect: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('authRedirect', redirect);
  }
};

export const getAndClearRedirect = (): string | null => {
  if (typeof window !== 'undefined') {
    const redirect = sessionStorage.getItem('authRedirect');
    sessionStorage.removeItem('authRedirect');
    return redirect;
  }
  return null;
};

export const getRedirect = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('authRedirect');
  }
  return null;
};