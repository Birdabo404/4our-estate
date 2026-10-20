type SupabaseLikeError = {
  message: string;
  code?: string;
};

export function humanize(error: SupabaseLikeError): string {
  const code = error.code ?? "";
  const message = error.message.toLowerCase();

  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return "An account with this email already exists.";
  }
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (message.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }
  if (message.includes("inquiry rate limit")) {
    return "You have sent too many inquiries this hour. Try again later.";
  }
  if (
    message.includes("listing transition not allowed") ||
    message.includes("new listings start as draft")
  ) {
    return "That status change is not allowed.";
  }
  if (message.includes("only admins may feature")) {
    return "Only an admin can feature a listing.";
  }
  if (message.includes("cannot reassign")) {
    return "You cannot reassign this listing.";
  }
  if (message.includes("only admins can change roles")) {
    return "Only an admin can change a role.";
  }
  if (message.includes("cannot remove the last admin")) {
    return "The last admin cannot be removed.";
  }
  if (message.includes("only inquiry status")) {
    return "You can update the status only.";
  }
  if (
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    code === "42501"
  ) {
    return "You do not have permission to do that.";
  }
  if (code === "23505" && message.includes("slug")) {
    return "A listing with this slug already exists.";
  }
  if (code === "23505") {
    return "That record already exists.";
  }
  if (code === "23514" || message.includes("check constraint")) {
    return "Some of those details are not valid.";
  }
  return "Something went wrong. Please try again.";
}
