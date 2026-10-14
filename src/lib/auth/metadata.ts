export function signUpOptions(fullName: string, emailRedirectTo: string) {
  return {
    data: { full_name: fullName },
    emailRedirectTo,
  };
}

export function profileUpdatePayload(fullName: string) {
  return { full_name: fullName };
}
